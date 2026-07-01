import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useRealtimeNotifications, type NotificationRow } from "@/hooks/notifications";

export default function RealtimeNotifier() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  const onNew = useCallback(
    (n: NotificationRow) => {
      toast(n.title, {
        description: n.body ?? undefined,
        action: {
          label: "View",
          onClick: () => navigate("/client/notifications"),
        },
      });
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const notif = new Notification(n.title, {
            body: n.body ?? undefined,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: n.id,
          });
          notif.onclick = () => {
            window.focus();
            navigate("/client/notifications");
            notif.close();
          };
        } catch {
          // ignore
        }
      }
    },
    [navigate],
  );

  useRealtimeNotifications(onNew);

  return null;
}
