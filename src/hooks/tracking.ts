import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { App as CapApp } from "@capacitor/app";
import { Geolocation, type PermissionStatus } from "@capacitor/geolocation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { isCapacitorNative } from "@/lib/platform";

export type LatLng = { lat: number; lng: number };

export type BroadcastStatus =
  | "idle"
  | "requesting"
  | "sharing"
  | "denied"
  | "unavailable"
  | "error";

type WatcherHandle = { kind: "web"; id: number } | { kind: "native"; id: string };

const clearWatcher = async (handle: WatcherHandle | null) => {
  if (!handle) return;
  try {
    if (handle.kind === "web") {
      navigator.geolocation.clearWatch(handle.id);
    } else {
      await Geolocation.clearWatch({ id: handle.id });
    }
  } catch {
    // best-effort cleanup
  }
};

const ensureNativePermission = async (): Promise<PermissionStatus["location"] | "unsupported"> => {
  try {
    const current = await Geolocation.checkPermissions();
    if (current.location === "granted") return "granted";
    const requested = await Geolocation.requestPermissions({ permissions: ["location"] });
    return requested.location;
  } catch {
    return "unsupported";
  }
};

const ensureWebPermission = async (): Promise<"granted" | "denied" | "unavailable"> => {
  if (typeof navigator === "undefined" || !navigator.geolocation) return "unavailable";
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve("granted"),
      (err) => resolve(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { timeout: 10000, maximumAge: 60000 },
    );
  });
};

/**
 * Broadcasts the provider's current location to
 * provider_profiles.current_location while `enabled` is true.
 * Foreground-only: pauses when the app is backgrounded (Capacitor) and
 * resumes when it returns to the foreground. Requests permission on demand,
 * with graceful handling of denial and unavailable environments.
 * Returns a status the UI can use to render a "Sharing location" indicator.
 */
export function useBroadcastMyLocation(enabled: boolean, intervalMs = 15000) {
  const { user } = useAuth();
  const watcherRef = useRef<WatcherHandle | null>(null);
  const lastRef = useRef<number>(0);
  const cancelledRef = useRef<boolean>(false);
  const [status, setStatus] = useState<BroadcastStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cancelledRef.current = false;

    if (!enabled || !user) {
      setStatus("idle");
      setError(null);
      const prev = watcherRef.current;
      watcherRef.current = null;
      void clearWatcher(prev);
      return;
    }

    let appStateHandle: { remove: () => void } | null = null;

    const push = async (lat: number, lng: number) => {
      if (Date.now() - lastRef.current < intervalMs) return;
      lastRef.current = Date.now();
      const wkt = `POINT(${lng} ${lat})`;
      await supabase
        .from("provider_profiles")
        .update({ current_location: wkt })
        .eq("user_id", user.id);
    };

    const startWatcher = async () => {
      if (watcherRef.current || cancelledRef.current) return;

      if (isCapacitorNative()) {
        try {
          const id = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 20000 },
            (position, err) => {
              if (err || !position) return;
              void push(position.coords.latitude, position.coords.longitude);
            },
          );
          if (cancelledRef.current) {
            await Geolocation.clearWatch({ id }).catch(() => undefined);
            return;
          }
          watcherRef.current = { kind: "native", id };
          setStatus("sharing");
        } catch (e) {
          setStatus("error");
          setError(e instanceof Error ? e.message : "Failed to start location watcher");
        }
      } else {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          setStatus("unavailable");
          return;
        }
        try {
          const id = navigator.geolocation.watchPosition(
            (pos) => void push(pos.coords.latitude, pos.coords.longitude),
            (err) => {
              if (err.code === err.PERMISSION_DENIED) {
                setStatus("denied");
              } else {
                setStatus("error");
                setError(err.message);
              }
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
          );
          watcherRef.current = { kind: "web", id };
          setStatus("sharing");
        } catch (e) {
          setStatus("error");
          setError(e instanceof Error ? e.message : "Failed to start location watcher");
        }
      }
    };

    const stopWatcher = async () => {
      const prev = watcherRef.current;
      watcherRef.current = null;
      await clearWatcher(prev);
    };

    const boot = async () => {
      setStatus("requesting");
      setError(null);
      if (isCapacitorNative()) {
        const result = await ensureNativePermission();
        if (cancelledRef.current) return;
        if (result !== "granted") {
          setStatus(result === "unsupported" ? "unavailable" : "denied");
          return;
        }
      } else {
        const result = await ensureWebPermission();
        if (cancelledRef.current) return;
        if (result !== "granted") {
          setStatus(result);
          return;
        }
      }
      if (cancelledRef.current) return;
      await startWatcher();

      if (isCapacitorNative()) {
        try {
          const listener = await CapApp.addListener("appStateChange", async ({ isActive }) => {
            if (cancelledRef.current) return;
            if (isActive) {
              if (!watcherRef.current) await startWatcher();
            } else {
              await stopWatcher();
              setStatus("idle");
            }
          });
          appStateHandle = { remove: () => listener.remove() };
        } catch {
          // ignore
        }
      }
    };

    void boot();

    return () => {
      cancelledRef.current = true;
      appStateHandle?.remove();
      void stopWatcher();
      setStatus("idle");
    };
  }, [enabled, user, intervalMs]);

  return { status, error };
}

/**
 * Subscribes to provider_profiles UPDATEs for the provider assigned to
 * `bookingId`. Returns the latest {lat, lng} decoded from GeoJSON.
 */
export function useBookingProviderLocation(bookingId: string | undefined) {
  const [providerId, setProviderId] = useState<string | null>(null);
  const [location, setLocation] = useState<LatLng | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    supabase
      .from("bookings")
      .select("provider_id, provider:provider_profiles(current_location)")
      .eq("id", bookingId)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as
          | {
              provider_id?: string | null;
              provider?: { current_location?: { coordinates?: [number, number] } | null };
            }
          | null;
        if (row?.provider_id) setProviderId(row.provider_id);
        const coords = row?.provider?.current_location?.coordinates;
        if (coords && coords.length === 2) {
          setLocation({ lng: coords[0], lat: coords[1] });
        }
      });
  }, [bookingId]);

  useEffect(() => {
    if (!providerId) return;
    const channel: RealtimeChannel = supabase
      .channel(`provider-location:${providerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "provider_profiles",
          filter: `user_id=eq.${providerId}`,
        },
        (payload) => {
          const row = payload.new as {
            current_location?: { coordinates?: [number, number] } | null;
          };
          const coords = row.current_location?.coordinates;
          if (coords && coords.length === 2) {
            setLocation({ lng: coords[0], lat: coords[1] });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [providerId]);

  return { providerId, location };
}
