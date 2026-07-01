import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type LatLng = { lat: number; lng: number };

/**
 * Broadcasts the current browser geolocation to
 * provider_profiles.current_location every `intervalMs` while enabled.
 */
export function useBroadcastMyLocation(enabled: boolean, intervalMs = 15000) {
  const { user } = useAuth();
  const watchIdRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !user || typeof navigator === "undefined" || !navigator.geolocation) return;

    const push = async (lat: number, lng: number) => {
      lastRef.current = Date.now();
      const wkt = `POINT(${lng} ${lat})`;
      await supabase
        .from("provider_profiles")
        .update({ current_location: wkt })
        .eq("user_id", user.id);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (Date.now() - lastRef.current < intervalMs) return;
        push(pos.coords.latitude, pos.coords.longitude);
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, user, intervalMs]);
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
