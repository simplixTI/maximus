import { useNavigate } from "react-router-dom";
import { Home, Map, Briefcase, DollarSign, User, Clock, MapPin } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import ListSkeleton from "@/components/shared/ListSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";
import { useProviderJobs } from "@/hooks/data";
import { formatDistanceToNow } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-accent/15 text-accent",
  en_route: "bg-primary/15 text-primary",
  arrived: "bg-primary/15 text-primary",
  in_progress: "bg-primary/15 text-primary",
  completed: "bg-green-500/15 text-green-500",
  cancelled: "bg-destructive/15 text-destructive",
};

const ProviderJobs = () => {
  const navigate = useNavigate();
  const jobsQ = useProviderJobs();
  const jobs = jobsQ.data ?? [];

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-20">
      <div className="px-6 pt-8 pb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your service jobs</p>
      </div>

      <div className="px-6">
        {jobsQ.isLoading ? (
          <ListSkeleton count={3} variant="job" />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs yet"
            description="New jobs will appear here once you're approved and go online. Stay tuned!"
          />
        ) : (
          <AnimatedList className="space-y-3">
            {jobs.map((job) => {
              const req = (job as { request?: { category?: string; address?: string } }).request;
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
                    {req?.address && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{req.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-accent">${Number(amount).toFixed(0)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[job.status] ?? "bg-secondary text-foreground"}`}>
                      {job.status.replace("_", " ")}
                    </span>
                  </div>
                </button>
              );
            })}
          </AnimatedList>
        )}
      </div>

      <BottomNav variant="provider" items={[
        { icon: Home, label: "Home", path: "/provider/dashboard" },
        { icon: Map, label: "Map", path: "/provider/map" },
        { icon: Briefcase, label: "Jobs", path: "/provider/jobs", active: true },
        { icon: DollarSign, label: "Earnings", path: "/provider/earnings" },
        { icon: User, label: "Profile", path: "/provider/profile" },
      ]} />
    </PageTransition>
  );
};

export default ProviderJobs;
