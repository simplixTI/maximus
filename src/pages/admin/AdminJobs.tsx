import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MoreVertical,
  Search,
  AlertTriangle,
  Eye,
  ArrowRightLeft,
  XCircle,
  MessageCircle,
  Radio,
  RefreshCw,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  useAdminAllBookings,
  useAvailableProviders,
  useReassignProvider,
  useUpdateBookingStatus,
  useAdminSendClientMessage,
} from "@/hooks/data";
import { useQueryClient } from "@tanstack/react-query";
import { sendTransactionalSMS } from "@/lib/sms";
import JobDetailDrawer from "@/components/admin/JobDetailDrawer";

type BookingStatus = "confirmed" | "en_route" | "arrived" | "in_progress" | "completed" | "cancelled";
const OVERRIDE_STATUSES: BookingStatus[] = [
  "confirmed",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
];

const STATUS_COLOR: Record<string, string> = {
  confirmed: "hsl(213, 70%, 55%)",
  en_route: "hsl(38, 90%, 55%)",
  arrived: "hsl(268, 75%, 65%)",
  in_progress: "hsl(200, 80%, 60%)",
  completed: "hsl(150, 65%, 55%)",
  cancelled: "hsl(0, 84%, 60%)",
};

const ACTIVE_STATUSES = new Set(["confirmed", "en_route", "arrived", "in_progress"]);
const STUCK_THRESHOLD_MS: Record<string, number> = {
  in_progress: 4 * 60 * 60 * 1000,
  en_route: 45 * 60 * 1000,
  arrived: 60 * 60 * 1000,
};

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function isStuck(b: { status: string; started_at?: string | null; created_at: string }): boolean {
  const t = STUCK_THRESHOLD_MS[b.status];
  if (!t) return false;
  const base = b.started_at ?? b.created_at;
  return Date.now() - new Date(base).getTime() > t;
}

const AdminJobs = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const bookingsQ = useAdminAllBookings();
  const providersQ = useAvailableProviders();
  const updateStatus = useUpdateBookingStatus();
  const reassign = useReassignProvider();
  const sendMsg = useAdminSendClientMessage();

  const [filter, setFilter] = useState<"all" | "active" | "stuck" | "completed" | "cancelled">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [overrideForId, setOverrideForId] = useState<string | null>(null);
  const [reassignForId, setReassignForId] = useState<string | null>(null);
  const [cancelForId, setCancelForId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("customer_request");

  useEffect(() => {
    const channel = supabase
      .channel("admin-bookings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_status_events" },
        () => {
          qc.invalidateQueries({ queryKey: ["booking_status_events"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const all = bookingsQ.data ?? [];

  const counts = useMemo(() => {
    const c = { all: 0, active: 0, stuck: 0, completed: 0, cancelled: 0 };
    for (const b of all) {
      c.all += 1;
      if (ACTIVE_STATUSES.has(b.status)) c.active += 1;
      if (isStuck(b)) c.stuck += 1;
      if (b.status === "completed") c.completed += 1;
      if (b.status === "cancelled") c.cancelled += 1;
    }
    return c;
  }, [all]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((b) => {
      if (filter === "active" && !ACTIVE_STATUSES.has(b.status)) return false;
      if (filter === "stuck" && !isStuck(b)) return false;
      if (filter === "completed" && b.status !== "completed") return false;
      if (filter === "cancelled" && b.status !== "cancelled") return false;
      if (q) {
        const provider = (b as { provider?: { user?: { full_name?: string }; business_name?: string } })
          .provider;
        const hay = [
          b.id,
          (b as { request?: { category?: string; address?: string } }).request?.category,
          (b as { request?: { address?: string } }).request?.address,
          (b as { client?: { full_name?: string } }).client?.full_name,
          provider?.user?.full_name,
          provider?.business_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, filter, search]);

  const selected = selectedId ? all.find((b) => b.id === selectedId) ?? null : null;
  const overrideTarget = overrideForId ? all.find((b) => b.id === overrideForId) : null;
  const reassignTarget = reassignForId ? all.find((b) => b.id === reassignForId) : null;
  const cancelTarget = cancelForId ? all.find((b) => b.id === cancelForId) : null;

  const openDrawer = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const doOverride = async (nextStatus: BookingStatus) => {
    if (!overrideTarget) return;
    try {
      await updateStatus.mutateAsync({
        booking_id: overrideTarget.id,
        status: nextStatus as never,
        notes: `Admin override → ${nextStatus}`,
      });
      toast.success(`Status set to ${nextStatus.replace("_", " ")}`);
      setOverrideForId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to override status");
    }
  };

  const doReassign = async (providerId: string) => {
    if (!reassignTarget) return;
    try {
      await reassign.mutateAsync({ booking_id: reassignTarget.id, provider_id: providerId });
      toast.success("Provider reassigned");
      setReassignForId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reassign");
    }
  };

  const doCancel = async () => {
    if (!cancelTarget) return;
    try {
      await updateStatus.mutateAsync({
        booking_id: cancelTarget.id,
        status: "cancelled" as never,
        notes: `Admin cancel: ${cancelReason.replace("_", " ")}`,
      });
      toast.success("Booking cancelled");
      setCancelForId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel");
    }
  };

  const smsClient = async (b: (typeof all)[number]) => {
    const c = (b as { client?: { id?: string; phone?: string; email?: string; full_name?: string } }).client;
    if (!c?.id) return toast.error("Client info missing");
    await sendMsg.mutateAsync({
      client_id: c.id,
      phone: c.phone,
      email: c.email,
      full_name: c.full_name,
      title: "Update on your job",
      body: `Hi ${c.full_name?.split(" ")[0] ?? "there"}, your ${
        (b as { request?: { category?: string } }).request?.category ?? "service"
      } booking has an update — check the app for details.`,
    });
    toast.success("SMS + email + in-app sent to client");
  };

  const smsProvider = async (b: (typeof all)[number]) => {
    const p = (b as { provider?: { user?: { phone?: string; full_name?: string } } }).provider;
    if (!p?.user?.phone) return toast.error("Provider phone missing");
    sendTransactionalSMS({
      to: p.user.phone,
      template: "generic",
      data: {
        body: `Maximus admin: please check the ${
          (b as { request?: { category?: string } }).request?.category ?? "service"
        } job assigned to you.`,
      },
    });
    toast.success("SMS sent to provider");
  };

  const filterChips: { id: typeof filter; label: string; count: number; tint: string }[] = [
    { id: "all", label: "All", count: counts.all, tint: "hsl(220, 10%, 60%)" },
    { id: "active", label: "Active", count: counts.active, tint: "hsl(200, 80%, 60%)" },
    { id: "stuck", label: "Stuck", count: counts.stuck, tint: "hsl(0, 84%, 60%)" },
    { id: "completed", label: "Completed", count: counts.completed, tint: "hsl(150, 65%, 55%)" },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled, tint: "hsl(220, 10%, 45%)" },
  ];

  return (
    <div className="relative min-h-screen bg-background pb-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 overflow-hidden">
        <div className="absolute -left-16 top-0 h-52 w-52 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -right-16 top-12 h-52 w-52 rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between px-6 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="rounded-xl p-2 text-foreground/80 hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold leading-none text-foreground">
                Jobs <span className="text-gradient-orange">Ops</span>
              </h1>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Live dispatch · {counts.all} total
              </p>
            </div>
          </div>
          <button
            onClick={() => bookingsQ.refetch()}
            className="rounded-xl border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
            aria-label="Refresh"
          >
            <Radio className={`h-4 w-4 ${bookingsQ.isFetching ? "animate-pulse text-accent" : ""}`} />
          </button>
        </div>

        {counts.stuck > 0 && filter !== "stuck" && (
          <motion.button
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setFilter("stuck")}
            className="mx-6 mb-3 flex w-[calc(100%-3rem)] items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-left transition-colors hover:bg-destructive/15"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {counts.stuck} stuck {counts.stuck === 1 ? "job" : "jobs"} need attention
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tap to review jobs idle beyond expected thresholds
              </p>
            </div>
          </motion.button>
        )}

        <div className="mx-6 flex flex-col gap-3">
          <div className="scrollbar-none flex gap-2 overflow-x-auto">
            {filterChips.map((c) => {
              const active = filter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "border-transparent bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  <span>{c.label}</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                    style={{
                      background: active ? "hsl(0 0% 100% / 0.15)" : `${c.tint}20`,
                      color: active ? "hsl(var(--background))" : c.tint,
                    }}
                  >
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client, provider, category, address, ID…"
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 px-6">
          {bookingsQ.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-card/40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
              <p className="text-sm font-medium text-foreground">No jobs match</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a different filter or clear the search
              </p>
            </div>
          ) : (
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
              className="space-y-2"
            >
              {filtered.map((b) => {
                const bx = b as {
                  id: string;
                  status: string;
                  created_at: string;
                  started_at?: string | null;
                  client_id: string;
                  provider_id?: string | null;
                  request?: { category?: string; description?: string; address?: string } | null;
                  quote?: { amount?: number | string } | null;
                  client?: { id?: string; full_name?: string; phone?: string; email?: string } | null;
                  provider?: {
                    business_name?: string;
                    rating_avg?: number;
                    user?: { full_name?: string; phone?: string } | null;
                  } | null;
                };
                const stuck = isStuck(bx);
                const color = STATUS_COLOR[bx.status] ?? "hsl(220, 10%, 60%)";
                const amount =
                  typeof bx.quote?.amount === "string" ? parseFloat(bx.quote.amount) : bx.quote?.amount ?? 0;
                const providerName = bx.provider?.user?.full_name ?? bx.provider?.business_name ?? "Unassigned";

                return (
                  <motion.li
                    key={bx.id}
                    variants={{
                      hidden: { opacity: 0, y: 6 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                    }}
                  >
                    <div
                      className={`group relative flex items-start gap-3 overflow-hidden rounded-2xl border p-4 transition-all hover:border-accent/30 ${
                        stuck ? "border-destructive/40 bg-destructive/[0.04]" : "border-border bg-card/60"
                      }`}
                    >
                      <button
                        onClick={() => openDrawer(bx.id)}
                        className="flex flex-1 items-start gap-3 text-left"
                      >
                        <div
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: `${color}18` }}
                        >
                          <span className="text-[10px] font-bold tabular-nums" style={{ color }}>
                            #{bx.id.slice(0, 4)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold capitalize text-foreground">
                              {bx.request?.category ?? "Service"}
                            </p>
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                              style={{ background: `${color}20`, color }}
                            >
                              {bx.status.replace("_", " ")}
                            </span>
                            {stuck && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                stuck
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {bx.client?.full_name ?? "—"} → {providerName}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="tabular-nums text-foreground">${amount.toFixed(0)}</span>
                            <span>{relTime(bx.created_at)} ago</span>
                            {bx.provider?.rating_avg !== undefined && bx.provider.rating_avg > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5 fill-current text-accent" />
                                {Number(bx.provider.rating_avg).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="rounded-lg p-1.5 text-muted-foreground opacity-70 hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 group-hover:opacity-100"
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 border-border bg-card">
                          <DropdownMenuItem onClick={() => openDrawer(bx.id)}>
                            <Eye className="mr-2 h-3.5 w-3.5" /> View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setOverrideForId(bx.id)}>
                            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Override status
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setReassignForId(bx.id)}>
                            <ArrowRightLeft className="mr-2 h-3.5 w-3.5" /> Reassign provider
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => smsClient(bx)}>
                            <MessageCircle className="mr-2 h-3.5 w-3.5" /> Message client
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => smsProvider(bx)}
                            disabled={!bx.provider?.user?.phone}
                          >
                            <MessageCircle className="mr-2 h-3.5 w-3.5" /> SMS provider
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setCancelForId(bx.id)}
                            className="text-destructive focus:text-destructive"
                            disabled={bx.status === "cancelled" || bx.status === "completed"}
                          >
                            <XCircle className="mr-2 h-3.5 w-3.5" /> Cancel job
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </div>
      </div>

      <JobDetailDrawer booking={selected as never} open={drawerOpen} onOpenChange={setDrawerOpen} />

      <Dialog open={!!overrideForId} onOpenChange={(v) => !v && setOverrideForId(null)}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display">Override status</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Force a new status. Client + provider will be notified. Choose carefully.
            </p>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {OVERRIDE_STATUSES.map((s) => {
              const color = STATUS_COLOR[s];
              return (
                <button
                  key={s}
                  onClick={() => doOverride(s)}
                  disabled={updateStatus.isPending || overrideTarget?.status === s}
                  className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2 text-left text-xs font-medium capitalize text-foreground transition-all hover:border-accent/40 disabled:opacity-40"
                >
                  <span>{s.replace("_", " ")}</span>
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reassignForId} onOpenChange={(v) => !v && setReassignForId(null)}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display">Reassign provider</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Pick a verified provider — sorted by rating.
            </p>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-1.5 overflow-y-auto pr-1">
            {providersQ.isLoading ? (
              <p className="text-xs text-muted-foreground">Loading providers…</p>
            ) : (providersQ.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No verified providers.</p>
            ) : (
              (providersQ.data ?? []).map((p) => {
                const px = p as {
                  user_id: string;
                  business_name?: string;
                  rating_avg?: number;
                  jobs_completed?: number;
                  online?: boolean;
                  user?: { full_name?: string } | null;
                };
                const isCurrent = reassignTarget?.provider_id === px.user_id;
                return (
                  <button
                    key={px.user_id}
                    onClick={() => doReassign(px.user_id)}
                    disabled={isCurrent || reassign.isPending}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-left transition-all hover:border-accent/40 disabled:opacity-40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {px.user?.full_name ?? px.business_name ?? "Provider"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {px.jobs_completed ?? 0} jobs · {px.online ? "online" : "offline"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isCurrent && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                          current
                        </span>
                      )}
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-foreground">
                        <Star className="h-3 w-3 fill-current text-accent" />
                        {Number(px.rating_avg ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelForId} onOpenChange={(v) => !v && setCancelForId(null)}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display">Cancel booking</DialogTitle>
            <p className="text-xs text-muted-foreground">
              This notifies both client + provider. Cannot be undone.
            </p>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Reason</p>
            <div className="grid grid-cols-2 gap-2">
              {["customer_request", "provider_no_show", "dispute", "duplicate"].map((r) => (
                <button
                  key={r}
                  onClick={() => setCancelReason(r)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs capitalize transition-colors ${
                    cancelReason === r
                      ? "border-destructive/50 bg-destructive/10 text-foreground"
                      : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelForId(null)}
              className="border-border bg-transparent text-foreground"
            >
              Keep booking
            </Button>
            <Button
              onClick={doCancel}
              disabled={updateStatus.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updateStatus.isPending ? "Cancelling…" : "Cancel booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobs;
