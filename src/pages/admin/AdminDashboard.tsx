import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  ShieldCheck,
  Briefcase,
  DollarSign,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ChevronRight,
  FileText,
  UserCheck,
  Wrench,
  Sparkles,
  Radio,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/lib/supabase";

// --- Helpers ---------------------------------------------------------------
const fmtInt = new Intl.NumberFormat("en-US");
const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const startOfMonthIso = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};
const nDaysAgoIso = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

// --- Data hooks (parallel, resilient) --------------------------------------
type Metrics = {
  totalUsers: number;
  usersDeltaPct: number;
  usersSpark: number[];
  pendingApprovals: number;
  activeJobs: number;
  jobsSpark: number[];
  revenueMtd: number;
  revenueDeltaPct: number;
  revenueSpark: number[];
  revenue7d: { day: string; value: number }[];
};

async function fetchMetrics(): Promise<Metrics> {
  const monthStart = startOfMonthIso();
  const sevenDaysAgo = nDaysAgoIso(6);
  const fourteenDaysAgo = nDaysAgoIso(13);

  const [users, providers, activeBookings, mtdRev, prevRev, allBookings, usersHistory] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("provider_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("verified", false),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("status", ["confirmed", "en_route", "arrived", "in_progress"]),
      supabase
        .from("bookings")
        .select("quote:quotes(amount), completed_at")
        .eq("status", "completed")
        .gte("completed_at", monthStart),
      supabase
        .from("bookings")
        .select("quote:quotes(amount), completed_at")
        .eq("status", "completed")
        .gte("completed_at", fourteenDaysAgo)
        .lt("completed_at", sevenDaysAgo),
      supabase
        .from("bookings")
        .select("id, created_at, status")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, created_at")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: true }),
    ]);

  const totalUsers = users.count ?? 0;
  const pendingApprovals = providers.count ?? 0;
  const activeJobs = activeBookings.count ?? 0;

  const sumAmount = (
    rows: { quote?: { amount?: number | string } | null }[] | null | undefined,
  ) =>
    (rows ?? []).reduce((acc, r) => {
      const raw = r.quote?.amount;
      const n = typeof raw === "string" ? parseFloat(raw) : (raw ?? 0);
      return acc + (isNaN(n) ? 0 : n);
    }, 0);

  const revenueMtd = sumAmount(mtdRev.data as never);
  const prev = sumAmount(prevRev.data as never);
  const revenueDeltaPct = prev > 0 ? ((revenueMtd - prev) / prev) * 100 : revenueMtd > 0 ? 100 : 0;

  // Bucket last 7 days
  const days: { day: string; value: number; jobs: number; users: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    days.push({ day: label, value: 0, jobs: 0, users: 0 });
  }
  const dayIndex = (iso: string | null | undefined): number => {
    if (!iso) return -1;
    const t = new Date(iso).setHours(0, 0, 0, 0);
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return Math.floor((t - start.getTime()) / 86400000);
  };
  (mtdRev.data ?? []).forEach((r: { quote?: { amount?: number | string } | null; completed_at?: string | null }) => {
    const i = dayIndex(r.completed_at);
    if (i >= 0 && i < 7) {
      const raw = r.quote?.amount;
      const n = typeof raw === "string" ? parseFloat(raw) : (raw ?? 0);
      days[i].value += isNaN(n) ? 0 : n;
    }
  });
  (allBookings.data ?? []).forEach((r: { created_at?: string | null }) => {
    const i = dayIndex(r.created_at);
    if (i >= 0 && i < 7) days[i].jobs += 1;
  });
  (usersHistory.data ?? []).forEach((r: { created_at?: string | null }) => {
    const i = dayIndex(r.created_at);
    if (i >= 0 && i < 7) days[i].users += 1;
  });

  const usersLast = days.reduce((a, d) => a + d.users, 0);
  const usersDeltaPct = totalUsers > 0 ? (usersLast / Math.max(totalUsers - usersLast, 1)) * 100 : 0;

  return {
    totalUsers,
    usersDeltaPct,
    usersSpark: days.map((d) => d.users),
    pendingApprovals,
    activeJobs,
    jobsSpark: days.map((d) => d.jobs),
    revenueMtd,
    revenueDeltaPct,
    revenueSpark: days.map((d) => d.value),
    revenue7d: days.map((d) => ({ day: d.day, value: d.value })),
  };
}

type ActivityRow = {
  id: string;
  kind: "signup" | "quote" | "booking" | "review";
  title: string;
  subtitle: string;
  at: string;
};

async function fetchActivity(): Promise<ActivityRow[]> {
  const since = nDaysAgoIso(7);
  const [signups, quotes, bookings] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("quotes")
      .select("id, amount, status, created_at, request:service_requests(category, client:profiles(full_name))")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("bookings")
      .select("id, status, created_at, request:service_requests(category)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const out: ActivityRow[] = [];
  (signups.data ?? []).forEach((r) =>
    out.push({
      id: `u-${r.id}`,
      kind: "signup",
      title: r.full_name || r.email || "New user",
      subtitle: "joined Maximus",
      at: r.created_at,
    }),
  );
  (quotes.data ?? []).forEach((r: {
    id: string;
    amount: number | string;
    created_at: string;
    request?: { category?: string; client?: { full_name?: string } } | null;
  }) => {
    const amt = typeof r.amount === "string" ? parseFloat(r.amount) : r.amount;
    out.push({
      id: `q-${r.id}`,
      kind: "quote",
      title: `Quote sent · ${fmtMoney.format(amt || 0)}`,
      subtitle: `${r.request?.category ?? "service"} — ${r.request?.client?.full_name ?? "client"}`,
      at: r.created_at,
    });
  });
  (bookings.data ?? []).forEach((r: {
    id: string;
    status: string;
    created_at: string;
    request?: { category?: string } | null;
  }) =>
    out.push({
      id: `b-${r.id}`,
      kind: "booking",
      title: `Booking ${r.status.replace("_", " ")}`,
      subtitle: r.request?.category ?? "service",
      at: r.created_at,
    }),
  );

  return out.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 6);
}

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// --- UI atoms --------------------------------------------------------------
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  });
  const path = `M ${points.join(" L ")}`;
  const fill = `M 0,100 L ${points.join(" L ")} L 100,100 Z`;
  const uid = useMemo(() => Math.random().toString(36).slice(2), []);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-10 w-full">
      <defs>
        <linearGradient id={`sg-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${uid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LivePulse({ color = "hsl(var(--accent))" }: { color?: string }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-pulse-ring"
        style={{ background: color }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

function DeltaChip({ pct }: { pct: number }) {
  const up = pct >= 0;
  const val = Math.abs(pct);
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        up ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"
      }`}
    >
      <Icon className="h-2.5 w-2.5" />
      {val.toFixed(0)}%
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  spark,
  color,
  delta,
  live,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  spark?: number[];
  color: string;
  delta?: number;
  live?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-4 transition-all hover:border-accent/40 hover:shadow-[0_0_30px_-8px_hsl(var(--orange-glow)/0.35)]">
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-60" style={{ background: color }} />
      <div className="flex items-start justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}20` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        {live ? <LivePulse color={color} /> : delta !== undefined ? <DeltaChip pct={delta} /> : null}
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {spark && spark.some((v) => v !== 0) ? (
        <div className="-mx-1 mt-2">
          <Sparkline data={spark} color={color} />
        </div>
      ) : (
        <div className="mt-2 h-10 opacity-40">
          <Sparkline data={[0, 0.2, 0.1, 0.3, 0.2, 0.4, 0.3]} color={color} />
        </div>
      )}
    </div>
  );
}

// --- Page ------------------------------------------------------------------
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [now, setNow] = useState(new Date());

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const metricsQ = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: fetchMetrics,
    refetchInterval: 45000,
    staleTime: 30000,
  });
  const activityQ = useQuery({
    queryKey: ["admin", "activity"],
    queryFn: fetchActivity,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const m = metricsQ.data;
  const orange = "hsl(38, 90%, 55%)";
  const emerald = "hsl(150, 65%, 55%)";
  const cyan = "hsl(200, 80%, 60%)";
  const violet = "hsl(268, 75%, 65%)";

  const navGrid = [
    { path: "/admin/users", label: "Users", desc: "Directory", icon: Users, tint: cyan, badge: m?.totalUsers },
    { path: "/admin/approvals", label: "Approvals", desc: "Pending", icon: UserCheck, tint: orange, badge: m?.pendingApprovals },
    { path: "/admin/jobs", label: "Jobs", desc: "Live ops", icon: Wrench, tint: emerald, badge: m?.activeJobs },
    { path: "/admin/quotes", label: "Quotes", desc: "Send + track", icon: FileText, tint: violet },
  ];

  const activityIcon = (kind: ActivityRow["kind"]) => {
    if (kind === "signup") return { Icon: Users, tint: cyan };
    if (kind === "quote") return { Icon: FileText, tint: orange };
    if (kind === "review") return { Icon: Sparkles, tint: violet };
    return { Icon: Briefcase, tint: emerald };
  };

  return (
    <div className="relative min-h-screen bg-background pb-10">
      {/* Ambient gradient blobs — desktop only (would look like a gray band on mobile) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-64 overflow-hidden md:block">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute -right-16 top-16 h-64 w-64 rounded-full bg-primary/10 blur-[110px]" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/60 text-foreground/80 transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold leading-none text-foreground">
                Mission <span className="text-gradient-orange">Control</span>
              </h1>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <LivePulse color="hsl(150, 65%, 55%)" />
                <span>All systems nominal</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="tabular-nums">
                  {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} local
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              metricsQ.refetch();
              activityQ.refetch();
            }}
            className="rounded-xl border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
            aria-label="Refresh"
          >
            <Radio className={`h-4 w-4 ${metricsQ.isFetching ? "animate-pulse text-accent" : ""}`} />
          </button>
        </div>

        {/* KPI Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06 } },
          }}
          className="grid grid-cols-2 gap-3 px-6"
        >
          {[
            {
              icon: Users,
              label: "Total Users",
              value: m ? fmtInt.format(m.totalUsers) : "—",
              spark: m?.usersSpark,
              color: cyan,
              delta: m?.usersDeltaPct,
            },
            {
              icon: ShieldCheck,
              label: "Pending Approvals",
              value: m ? fmtInt.format(m.pendingApprovals) : "—",
              color: orange,
              live: (m?.pendingApprovals ?? 0) > 0,
            },
            {
              icon: Briefcase,
              label: "Active Jobs",
              value: m ? fmtInt.format(m.activeJobs) : "—",
              spark: m?.jobsSpark,
              color: emerald,
              live: (m?.activeJobs ?? 0) > 0,
            },
            {
              icon: DollarSign,
              label: "Revenue MTD",
              value: m ? fmtMoney.format(m.revenueMtd) : "—",
              spark: m?.revenueSpark,
              color: orange,
              delta: m?.revenueDeltaPct,
            },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <KpiCard {...kpi} />
            </motion.div>
          ))}
        </motion.div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-6 mt-4 overflow-hidden rounded-2xl border border-border bg-card/70 p-4 backdrop-blur"
        >
          <div className="mb-1 flex items-center justify-between">
            <div>
              <p className="font-display text-sm font-semibold text-foreground">7-Day Revenue</p>
              <p className="text-[11px] text-muted-foreground">Completed bookings</p>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold tabular-nums text-foreground">
                {m ? fmtMoney.format(m.revenue7d.reduce((a, d) => a + d.value, 0)) : "—"}
              </p>
              {m && <DeltaChip pct={m.revenueDeltaPct} />}
            </div>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={m?.revenue7d ?? []} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(38, 90%, 55%)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="hsl(38, 90%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(220, 15%, 15%)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="hsl(220, 10%, 40%)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ stroke: "hsl(38, 90%, 55%)", strokeOpacity: 0.3, strokeWidth: 1 }}
                  contentStyle={{
                    background: "hsl(220, 30%, 6%)",
                    border: "1px solid hsl(38, 90%, 55%, 0.4)",
                    borderRadius: "12px",
                    fontSize: 12,
                    padding: "6px 10px",
                  }}
                  labelStyle={{ color: "hsl(220, 10%, 50%)", fontSize: 10 }}
                  formatter={(v: number) => [fmtMoney.format(v), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(38, 90%, 55%)"
                  strokeWidth={2}
                  fill="url(#revFill)"
                  dot={{ fill: "hsl(38, 90%, 55%)", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "hsl(42, 95%, 65%)", stroke: "hsl(0, 0%, 0%)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live Activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-6 mt-4 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              <p className="font-display text-sm font-semibold text-foreground">Live Activity</p>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Last 7 days
            </span>
          </div>
          {activityQ.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-secondary/60" />
              ))}
            </div>
          ) : (activityQ.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No recent activity</p>
          ) : (
            <ul className="space-y-1">
              {(activityQ.data ?? []).map((a) => {
                const { Icon, tint } = activityIcon(a.kind);
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-secondary/40"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${tint}18` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: tint }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">{a.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{a.subtitle}</p>
                    </div>
                    <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground">
                      {relTime(a.at)} ago
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>

        {/* Nav Grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-6 mt-5 grid grid-cols-2 gap-3"
        >
          {navGrid.map((n) => (
            <button
              key={n.path}
              onClick={() => navigate(n.path)}
              className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_10px_30px_-15px_hsl(var(--orange-glow)/0.5)]"
            >
              <div
                className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
                style={{ background: n.tint }}
              />
              <div className="flex w-full items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${n.tint}20` }}
                >
                  <n.icon className="h-5 w-5" style={{ color: n.tint }} />
                </div>
                {typeof n.badge === "number" && n.badge > 0 ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
                    style={{ background: `${n.tint}18`, color: n.tint }}
                  >
                    {fmtInt.format(n.badge)}
                  </span>
                ) : null}
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-foreground">{n.label}</p>
                <p className="text-[11px] text-muted-foreground">{n.desc}</p>
              </div>
              <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
