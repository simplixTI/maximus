import { useNavigate } from "react-router-dom";
import { Home, Calendar, Map, User, Plus, Clock, ChevronRight, Bell, FileText, Hourglass, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/layout/BottomNav";
import ListSkeleton from "@/components/shared/ListSkeleton";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";
import { useAuth } from "@/contexts/AuthContext";
import { useMyBookings, useMyPendingQuotes, useMyServiceRequests } from "@/hooks/data";
import { useUnreadCount } from "@/hooks/notifications";
import { formatDistanceToNow } from "date-fns";

const REQUEST_STATUS_META: Record<
  string,
  { label: string; dot: string; text: string; bg: string; icon: typeof Hourglass; pulse?: boolean }
> = {
  draft: {
    label: "Awaiting quote",
    dot: "hsl(42, 95%, 62%)",
    text: "text-accent",
    bg: "bg-accent/10 border-accent/25",
    icon: Hourglass,
    pulse: true,
  },
  quoted: {
    label: "Quote ready",
    dot: "hsl(42, 95%, 62%)",
    text: "text-accent",
    bg: "bg-accent/12 border-accent/40",
    icon: Sparkles,
  },
  paid: {
    label: "Booked",
    dot: "hsl(200, 80%, 60%)",
    text: "text-primary",
    bg: "bg-primary/10 border-primary/25",
    icon: FileText,
  },
  matched: {
    label: "Provider matched",
    dot: "hsl(200, 80%, 60%)",
    text: "text-primary",
    bg: "bg-primary/10 border-primary/25",
    icon: FileText,
  },
  in_progress: {
    label: "In progress",
    dot: "hsl(200, 80%, 60%)",
    text: "text-primary",
    bg: "bg-primary/10 border-primary/25",
    icon: FileText,
  },
  completed: {
    label: "Completed",
    dot: "hsl(150, 65%, 55%)",
    text: "text-green-500",
    bg: "bg-green-500/8 border-green-500/25",
    icon: FileText,
  },
  cancelled: {
    label: "Cancelled",
    dot: "hsl(220, 10%, 50%)",
    text: "text-muted-foreground",
    bg: "bg-muted/30 border-border",
    icon: FileText,
  },
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-primary/15 text-primary",
  en_route: "bg-primary/15 text-primary",
  arrived: "bg-primary/15 text-primary",
  in_progress: "bg-primary/15 text-primary",
  completed: "bg-green-500/15 text-green-500",
  cancelled: "bg-destructive/15 text-destructive",
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const bookingsQ = useMyBookings();
  const quotesQ = useMyPendingQuotes();
  const requestsQ = useMyServiceRequests();
  const unreadQ = useUnreadCount();
  const unread = unreadQ.data ?? 0;

  const bookings = bookingsQ.data ?? [];
  const active = bookings.filter((b) => b.status !== "completed" && b.status !== "cancelled");
  const recent = bookings.filter((b) => b.status === "completed").slice(0, 3);
  const pendingQuotes = quotesQ.data ?? [];
  const allRequests = requestsQ.data ?? [];
  // Show requests that are still in the pre-booking pipeline (draft/quoted/cancelled)
  // — once they become paid/matched/in_progress they surface under Active Bookings.
  const preBookingRequests = allRequests
    .filter((r) => r.status === "draft" || r.status === "quoted" || r.status === "cancelled")
    .slice(0, 4);
  const loading = bookingsQ.isLoading || quotesQ.isLoading;

  const greeting =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-20">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="font-display text-2xl font-bold text-foreground capitalize">{greeting}</h1>
          </div>
          <button onClick={() => navigate("/client/notifications")} className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground border-2 border-background">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.35 }}>
          <Button
            onClick={() => navigate("/client/request")}
            className="h-16 w-full gap-3 rounded-2xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange"
          >
            <Plus className="h-5 w-5" />
            Request a Service
          </Button>
        </motion.div>
      </div>

      {/* Pending Quotes CTA */}
      {pendingQuotes.length > 0 && (
        <div className="mt-4 px-6">
          <button
            onClick={() => navigate("/client/bookings")}
            className="w-full rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 to-accent/5 p-4 text-left transition-all hover:from-accent/15 hover:to-accent/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-accent">
                    {pendingQuotes.length} quote{pendingQuotes.length > 1 ? "s" : ""} waiting
                  </p>
                  <p className="text-xs text-muted-foreground">Review and accept to book</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-accent" />
            </div>
          </button>
        </div>
      )}

      {/* Membership CTA */}
      <div className="mt-4 px-6">
        <button onClick={() => navigate("/client/membership")} className="w-full rounded-2xl border border-accent/20 bg-accent/5 p-4 text-left transition-all hover:bg-accent/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-accent">⭐ Plus Member</p>
              <p className="text-xs text-muted-foreground">5 requests/month • 10% discount</p>
            </div>
            <ChevronRight className="h-4 w-4 text-accent" />
          </div>
        </button>
      </div>

      {/* Your Requests — pre-booking pipeline (draft/quoted/cancelled) */}
      {preBookingRequests.length > 0 && (
        <div className="mt-6 px-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Your Requests</h2>
            <button
              onClick={() => navigate("/client/bookings")}
              className="text-xs font-medium text-accent"
            >
              View All
            </button>
          </div>
          <AnimatedList className="space-y-2.5">
            {preBookingRequests.map((r) => {
              const meta = REQUEST_STATUS_META[r.status] ?? REQUEST_STATUS_META.draft;
              return (
                <button
                  key={r.id}
                  onClick={() => navigate("/client/bookings")}
                  className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${meta.bg}`}
                >
                  {/* Accent glow behind status */}
                  <div
                    className="pointer-events-none absolute -right-6 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full opacity-30 blur-2xl"
                    style={{ background: meta.dot }}
                  />
                  <div
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${meta.dot}18` }}
                  >
                    <meta.icon className={`h-4 w-4 ${meta.text}`} />
                  </div>
                  <div className="relative min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold capitalize text-foreground">
                      {r.category ?? "Service"}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {r.description ?? r.address ?? "Details on request"}
                    </p>
                    <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="relative flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="relative inline-flex h-1.5 w-1.5">
                        {meta.pulse && (
                          <span
                            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                            style={{ background: meta.dot }}
                          />
                        )}
                        <span
                          className="relative inline-flex h-1.5 w-1.5 rounded-full"
                          style={{ background: meta.dot }}
                        />
                      </span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${meta.text}`}>
                        {meta.label}
                      </span>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })}
          </AnimatedList>
        </div>
      )}

      <div className="mt-6 px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Active Bookings</h2>
          <button onClick={() => navigate("/client/bookings")} className="text-xs text-accent font-medium">View All</button>
        </div>
        {loading ? (
          <ListSkeleton count={1} variant="job" />
        ) : active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">No active bookings yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Request a service to get started</p>
          </div>
        ) : (
          <AnimatedList className="space-y-3">
            {active.map((b) => {
              const req = (b as { request?: { category?: string } }).request;
              return (
                <button
                  key={b.id}
                  onClick={() => navigate(`/client/tracking/${b.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground capitalize">
                      {req?.category ?? "Service"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[b.status] ?? "bg-secondary text-foreground"}`}>
                      {b.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-accent font-medium">Track →</span>
                  </div>
                </button>
              );
            })}
          </AnimatedList>
        )}
      </div>

      <div className="mt-6 px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Recent Activity</h2>
        </div>
        {loading ? (
          <ListSkeleton count={2} />
        ) : recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-center text-xs text-muted-foreground">
            Completed jobs will appear here
          </div>
        ) : (
          <AnimatedList className="space-y-2">
            {recent.map((b) => {
              const req = (b as { request?: { category?: string } }).request;
              return (
                <button
                  key={b.id}
                  onClick={() => navigate(`/client/bookings/${b.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-accent/20 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                    <Calendar className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground capitalize">
                      {req?.category ?? "Service"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">
                    completed
                  </span>
                </button>
              );
            })}
          </AnimatedList>
        )}
      </div>

      <BottomNav variant="client" items={[
        { icon: Home, label: "Home", path: "/client/dashboard", active: true },
        { icon: Calendar, label: "Bookings", path: "/client/bookings" },
        { icon: Map, label: "Map", path: "/client/map" },
        { icon: User, label: "Profile", path: "/client/profile" },
      ]} />
    </PageTransition>
  );
};

export default ClientDashboard;
