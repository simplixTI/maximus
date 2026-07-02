import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Map, Briefcase, DollarSign, User, TrendingUp, Clock, Star, ChevronRight } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import ListSkeleton from "@/components/shared/ListSkeleton";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderJobs, useProviderEarnings } from "@/hooks/data";
import { useBroadcastMyLocation } from "@/hooks/tracking";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const jobsQ = useProviderJobs();
  const earningsQ = useProviderEarnings();
  const [online, setOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("provider_profiles")
      .select("online")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setOnline(!!(data as { online?: boolean } | null)?.online));
  }, [user]);

  const toggleOnline = async () => {
    if (!user) return;
    setTogglingOnline(true);
    const next = !online;
    const { error } = await supabase.from("provider_profiles").update({ online: next }).eq("user_id", user.id);
    setTogglingOnline(false);
    if (error) {
      toast.error(error.message);
    } else {
      setOnline(next);
      toast.success(next ? "You're online — accepting jobs" : "You're offline");
    }
  };

  useBroadcastMyLocation(online);

  const jobs = jobsQ.data ?? [];
  const active = jobs.filter((j) => j.status !== "completed" && j.status !== "cancelled");
  const earnings = earningsQ.data ?? { total: 0, completed: 0, active: 0 };
  const loading = jobsQ.isLoading || earningsQ.isLoading;

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-20">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleOnline}
            disabled={togglingOnline}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${online ? "bg-green-500/15 text-green-500" : "bg-secondary text-muted-foreground"}`}
          >
            <span className={`h-2 w-2 rounded-full ${online ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
            {online ? "Online" : "Offline"}
          </motion.button>
        </div>
      </div>

      <div className="px-6 space-y-5">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <Skeleton className="mx-auto h-5 w-5 rounded" />
                <Skeleton className="mx-auto h-6 w-10" />
                <Skeleton className="mx-auto h-3 w-14" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid grid-cols-3 gap-3">
            {[
              { icon: Briefcase, label: "Active", value: String(earnings.active), color: "text-accent" },
              { icon: DollarSign, label: "Earned", value: `$${earnings.total.toFixed(0)}`, color: "text-green-500" },
              { icon: Star, label: "Completed", value: String(earnings.completed), color: "text-accent" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.3 }} className="rounded-2xl border border-border bg-card p-4 text-center">
                <stat.icon className={`mx-auto h-5 w-5 ${stat.color}`} />
                <p className="mt-2 text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.35 }} className="rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <span className="text-sm font-semibold text-foreground">Lifetime earnings</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">${earnings.total.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{earnings.completed} jobs completed</p>
          </motion.div>
        )}

        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Upcoming Jobs</h2>
          {loading ? (
            <ListSkeleton count={3} variant="job" />
          ) : active.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
              <p className="text-sm text-muted-foreground">No jobs yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Stay online to get matched with new bookings</p>
            </div>
          ) : (
            <AnimatedList className="space-y-2">
              {active.map((job) => {
                const req = (job as { request?: { category?: string } }).request;
                const client = (job as { client?: { full_name?: string } }).client;
                const amount = ((job as { quote?: { amount?: number } }).quote?.amount) ?? 0;
                return (
                  <button
                    key={job.id}
                    onClick={() => navigate(`/provider/jobs/${job.id}`)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-accent/30 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground capitalize">{req?.category ?? "Service"}</p>
                      <p className="text-xs text-muted-foreground">
                        {client?.full_name ?? "Client"} • {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent">${Number(amount).toFixed(0)}</p>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </AnimatedList>
          )}
        </div>
      </div>

      <BottomNav variant="provider" items={[
        { icon: Home, label: "Home", path: "/provider/dashboard", active: true },
        { icon: Map, label: "Map", path: "/provider/map" },
        { icon: Briefcase, label: "Jobs", path: "/provider/jobs" },
        { icon: DollarSign, label: "Earnings", path: "/provider/earnings" },
        { icon: User, label: "Profile", path: "/provider/profile" },
      ]} />
    </PageTransition>
  );
};

export default ProviderDashboard;
