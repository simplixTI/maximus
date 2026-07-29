import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { isCapacitorNative } from "@/lib/platform";

type Category = "services" | "messages" | "appointments" | "general";

type NotificationDataPayload = {
  notification_type?: string;
  entity_id?: string;
  category?: Category;
  booking_id?: string;
  [key: string]: string | undefined;
};

const CHANNELS: Array<{ id: Category; name: string; importance: 2 | 3 | 4 | 5 }> = [
  // Importance: 5 = high (heads-up), 3 = default, 2 = low
  { id: "services", name: "Services", importance: 5 },
  { id: "messages", name: "Messages", importance: 5 },
  { id: "appointments", name: "Appointments", importance: 5 },
  { id: "general", name: "General", importance: 3 },
];

const categoryFor = (t: string | undefined): Category => {
  if (!t) return "general";
  if (t === "chat_message") return "messages";
  if (["request_received", "service_request", "quote_sent", "quote_accepted"].includes(t))
    return "services";
  if (
    [
      "booking_confirmed",
      "provider_assigned",
      "provider_en_route",
      "provider_arrived",
      "job_completed",
      "appointment",
      "service_completed",
      "appointment_cancelled",
      "appointment_changed",
    ].includes(t)
  )
    return "appointments";
  return "general";
};

function deepLinkFor(
  data: NotificationDataPayload,
  role: string | null | undefined,
): string {
  const type = data.notification_type;
  const id = data.entity_id ?? "";
  const isProvider = role === "provider";

  if (type === "chat_message") {
    const bookingId = data.booking_id ?? id;
    return bookingId ? `/chat/${bookingId}` : isProvider ? "/provider/dashboard" : "/client/dashboard";
  }
  if (type === "service_request" || type === "request_received") {
    return isProvider ? (id ? `/provider/jobs/${id}` : "/provider/jobs") : "/client/dashboard";
  }
  if (type === "quote_sent" || type === "quote_accepted") {
    return id ? `/client/bookings/${id}` : "/client/bookings";
  }
  if (
    type === "booking_confirmed" ||
    type === "appointment" ||
    type === "provider_assigned" ||
    type === "provider_en_route" ||
    type === "provider_arrived" ||
    type === "appointment_cancelled" ||
    type === "appointment_changed"
  ) {
    if (isProvider) return id ? `/provider/jobs/${id}` : "/provider/jobs";
    return id ? `/client/bookings/${id}` : "/client/bookings";
  }
  if (type === "service_completed" || type === "job_completed") {
    return id ? `/client/bookings/${id}` : "/client/bookings";
  }
  return isProvider ? "/provider/notifications" : "/client/notifications";
}

// -----------------------------------------------------------------------------
// Module-level guards: prevent double registration + expose the current token
// so signOut can deactivate this device (and only this device).
// -----------------------------------------------------------------------------
let registrationInFlight = false;
let currentToken: string | null = null;

/**
 * Marks the token registered on this device as inactive in Supabase so no more
 * push messages are dispatched to it. Should be called BEFORE supabase.auth.signOut()
 * so RLS still permits the update. Only touches this device's row — leaves other
 * devices of the same user untouched.
 */
export async function deactivateCurrentDevicePushToken(): Promise<void> {
  if (!currentToken) return;
  try {
    await supabase
      .from("push_tokens")
      .update({ active: false, last_used_at: new Date().toISOString() })
      .eq("token", currentToken);
  } catch (e) {
    console.warn("[push] deactivate on logout failed:", e);
  } finally {
    currentToken = null;
  }
}

/**
 * Registers this device with FCM (via @capacitor/push-notifications), stores
 * the resulting token in public.push_tokens, creates the four Android
 * notification channels, and wires up receive/tap listeners.
 *
 * Web builds are no-ops for now.
 */
export function usePushRegistration(): void {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setupRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (setupRef.current || registrationInFlight) return;
    setupRef.current = true;
    registrationInFlight = true;

    const removers: Array<() => void> = [];

    // -----------------------------------------------------------------------
    // Web branch — Firebase Messaging via service worker + VAPID
    // -----------------------------------------------------------------------
    if (!isCapacitorNative()) {
      (async () => {
        try {
          if (
            typeof window === "undefined" ||
            !("serviceWorker" in navigator) ||
            !("Notification" in window)
          )
            return;

          const { getFirebaseMessagingIfSupported, getToken, onMessage, FIREBASE_VAPID_KEY } =
            await import("@/lib/firebase");

          const messaging = await getFirebaseMessagingIfSupported();
          if (!messaging) return;

          let permission = Notification.permission;
          if (permission === "default") {
            permission = await Notification.requestPermission();
          }
          if (permission !== "granted") return;

          const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
            scope: "/firebase-cloud-messaging-push-scope",
          });

          const fcmToken = await getToken(messaging, {
            vapidKey: FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: swReg,
          });
          if (!fcmToken) return;

          currentToken = fcmToken;

          const { error } = await supabase.from("push_tokens").upsert(
            {
              user_id: user.id,
              token: fcmToken,
              platform: "web",
              app_version: null,
              active: true,
              last_used_at: new Date().toISOString(),
            },
            { onConflict: "token" },
          );
          if (error) console.warn("[push/web] token upsert failed:", error.message);

          const unsubscribe = onMessage(messaging, (payload) => {
            // Foreground receipt — surface as toast; SW handles background.
            const title = payload.notification?.title ?? "Notification";
            const body = payload.notification?.body;
            const data = (payload.data ?? {}) as NotificationDataPayload;
            toast(title, {
              description: body ?? undefined,
              action: {
                label: "View",
                onClick: () => navigate(deepLinkFor(data, role)),
              },
            });
            qc.invalidateQueries({ queryKey: ["notifications"] });
          });
          removers.push(() => unsubscribe());
        } catch (e) {
          console.warn("[push/web] setup failed:", e);
        } finally {
          registrationInFlight = false;
        }
      })();

      return () => {
        setupRef.current = false;
        for (const r of removers) {
          try {
            r();
          } catch {
            // ignore
          }
        }
      };
    }

    // -----------------------------------------------------------------------
    // Native branch — @capacitor/push-notifications
    // -----------------------------------------------------------------------
    (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // Channels first so the OS can honour channel_id on the very first push.
        if (Capacitor.getPlatform() === "android") {
          const existing = await PushNotifications.listChannels().catch(() => ({ channels: [] }));
          const existingIds = new Set((existing?.channels ?? []).map((c) => c.id));
          for (const ch of CHANNELS) {
            if (existingIds.has(ch.id)) continue;
            await PushNotifications.createChannel({
              id: ch.id,
              name: ch.name,
              description: `${ch.name} notifications`,
              importance: ch.importance,
              visibility: 1,
              sound: "default",
              lights: true,
              vibration: true,
            }).catch((e) => console.warn(`[push] createChannel ${ch.id} failed:`, e));
          }
        }

        const perm = await PushNotifications.checkPermissions();
        let status = perm.receive;
        if (status === "prompt" || status === "prompt-with-rationale") {
          const req = await PushNotifications.requestPermissions();
          status = req.receive;
        }
        if (status !== "granted") return;

        const platform: "android" | "ios" =
          Capacitor.getPlatform() === "ios" ? "ios" : "android";

        let appVersion: string | null = null;
        try {
          const info = await CapApp.getInfo();
          appVersion = info?.version ?? null;
        } catch {
          // getInfo is not available on some platforms — non-fatal.
        }

        const regHandle = await PushNotifications.addListener("registration", async (t) => {
          currentToken = t.value;
          const { error } = await supabase
            .from("push_tokens")
            .upsert(
              {
                user_id: user.id,
                token: t.value,
                platform,
                app_version: appVersion,
                active: true,
                last_used_at: new Date().toISOString(),
              },
              { onConflict: "token" },
            );
          if (error) console.warn("[push] token upsert failed:", error.message);
        });
        removers.push(() => regHandle.remove());

        const regErrHandle = await PushNotifications.addListener(
          "registrationError",
          (err) => console.warn("[push] registrationError:", err),
        );
        removers.push(() => regErrHandle.remove());

        const recvHandle = await PushNotifications.addListener(
          "pushNotificationReceived",
          (n) => {
            // Foreground receipt — Android suppresses heads-up in this case,
            // so surface it as an in-app toast.
            toast(n.title ?? "Notification", {
              description: n.body ?? undefined,
              action: {
                label: "View",
                onClick: () => {
                  const data = (n.data ?? {}) as NotificationDataPayload;
                  navigate(deepLinkFor(data, role));
                },
              },
            });
            qc.invalidateQueries({ queryKey: ["notifications"] });
          },
        );
        removers.push(() => recvHandle.remove());

        const actHandle = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            const data = (action.notification.data ?? {}) as NotificationDataPayload;
            navigate(deepLinkFor(data, role));
          },
        );
        removers.push(() => actHandle.remove());

        await PushNotifications.register();
      } catch (e) {
        console.warn("[push] setup failed:", e);
      } finally {
        registrationInFlight = false;
      }
    })();

    return () => {
      setupRef.current = false;
      for (const r of removers) {
        try {
          r();
        } catch {
          // ignore
        }
      }
    };
  }, [user, role, navigate, qc]);
}
