import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Briefcase, DollarSign, User, Clock, ChevronRight, MapPin } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import ListSkeleton from "@/components/shared/ListSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";

const mockJobs = [
  { id: "1", service: "Electrical Repair", client: "Sarah M.", address: "456 Oak Ave", time: "Today, 2:00 PM", pay: "$120", status: "upcoming", statusColor: "bg-accent/15 text-accent" },
  { id: "2", service: "Plumbing Fix", client: "Mike R.", address: "789 Pine St", time: "Today, 4:30 PM", pay: "$95", status: "upcoming", statusColor: "bg-accent/15 text-accent" },
  { id: "3", service: "HVAC Maintenance", client: "Lisa T.", address: "321 Elm Dr", time: "Yesterday", pay: "$180", status: "completed", statusColor: "bg-green-500/15 text-green-500" },
];

const ProviderJobs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<typeof mockJobs>([]);

  useEffect(() => {
    const timer = setTimeout(() => { setJobs(mockJobs); setLoading(false); }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-20">
      <div className="px-6 pt-8 pb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your service jobs</p>
      </div>

      <div className="px-6">
        {loading ? (
          <ListSkeleton count={3} variant="job" />
        ) : jobs.length === 0 ? (
          <EmptyState icon={Briefcase} title="No jobs yet" description="New jobs will appear here once you're approved and go online. Stay tuned!" />
        ) : (
          <AnimatedList className="space-y-3">
            {jobs.map((job) => (
              <button key={job.id} onClick={() => navigate(`/provider/jobs/${job.id}`)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-accent/30 hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{job.service}</p>
                  <p className="text-xs text-muted-foreground">{job.client} • {job.time}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{job.address}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-accent">{job.pay}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${job.statusColor}`}>{job.status}</span>
                </div>
              </button>
            ))}
          </AnimatedList>
        )}
      </div>

      <BottomNav variant="provider" items={[
        { icon: Map, label: "Map", path: "/provider/map" },
        { icon: Briefcase, label: "Jobs", path: "/provider/jobs", active: true },
        { icon: DollarSign, label: "Earnings", path: "/provider/earnings" },
        { icon: User, label: "Profile", path: "/provider/profile" },
      ]} />
    </PageTransition>
  );
};

export default ProviderJobs;
