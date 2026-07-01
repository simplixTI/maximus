import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  FileText,
  Calendar,
  MapPin,
  Wrench,
  CheckCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ListSkeleton from "@/components/shared/ListSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";
import { formatDistanceToNow } from "date-fns";
import { useMyNotifications, useMarkAllNotificationsRead } from "@/hooks/notifications";

const TYPE_ICON: Record<string, { icon: LucideIcon; color: string }> = {
  welcome: { icon: Bell, color: "text-accent" },
  request_received: { icon: FileText, color: "text-primary" },
  quote_sent: { icon: FileText, color: "text-accent" },
  quote_accepted: { icon: CheckCircle, color: "text-green-500" },
  booking_confirmed: { icon: Calendar, color: "text-green-500" },
  provider_assigned: { icon: Wrench, color: "text-primary" },
  provider_en_route: { icon: MapPin, color: "text-accent" },
  provider_arrived: { icon: MapPin, color: "text-accent" },
  job_completed: { icon: CheckCircle, color: "text-green-500" },
  generic: { icon: Bell, color: "text-muted-foreground" },
};

const ClientNotifications = () => {
  const navigate = useNavigate();
  const notifQ = useMyNotifications();
  const markAll = useMarkAllNotificationsRead();
  const notifications = notifQ.data ?? [];
  const hasUnread = notifications.some((n) => !n.read);

  useEffect(() => {
    if (hasUnread) markAll.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnread]);

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Notifications</h1>
        {notifications.length > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCheck className="h-3.5 w-3.5" /> All read
          </span>
        )}
      </div>

      <div className="px-6">
        {notifQ.isLoading ? (
          <ListSkeleton count={4} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="All caught up!"
            description="You have no notifications right now. We'll let you know when something important happens."
          />
        ) : (
          <AnimatedList className="space-y-2">
            {notifications.map((n) => {
              const meta = TYPE_ICON[n.type] ?? TYPE_ICON.generic;
              const Icon = meta.icon;
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 rounded-2xl border p-4 transition-all hover:scale-[1.01] ${
                    n.read ? "border-border bg-card" : "border-accent/30 bg-accent/5"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary ${meta.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    </div>
                    {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </AnimatedList>
        )}
      </div>
    </PageTransition>
  );
};

export default ClientNotifications;
