import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Calendar, Map, User, MapPin, ChevronRight, Clock } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import ListSkeleton from "@/components/shared/ListSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";

const mockBookings = [
  { id: "1", service: "Electrical Repair", provider: "John D.", address: "456 Oak Ave", date: "Mar 20", status: "in_progress", statusColor: "bg-primary/15 text-primary" },
  { id: "2", service: "Plumbing Fix", provider: "Angela W.", address: "789 Pine St", date: "Mar 18", status: "completed", statusColor: "bg-green-500/15 text-green-500" },
  { id: "3", service: "HVAC Maintenance", provider: "Carlos M.", address: "321 Elm Dr", date: "Mar 15", status: "completed", statusColor: "bg-green-500/15 text-green-500" },
];

const ClientBookings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<typeof mockBookings>([]);

  useEffect(() => {
    const timer = setTimeout(() => { setBookings(mockBookings); setLoading(false); }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-20">
      <div className="px-6 pt-8 pb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your service requests</p>
      </div>

      <div className="px-6">
        {loading ? (
          <ListSkeleton count={3} variant="job" />
        ) : bookings.length === 0 ? (
          <EmptyState icon={Calendar} title="No bookings yet" description="Your service requests and bookings will appear here once you request your first service." actionLabel="Request a Service" onAction={() => navigate("/client/request")} />
        ) : (
          <AnimatedList className="space-y-3">
            {bookings.map((b) => (
              <button key={b.id} onClick={() => navigate(`/client/bookings/${b.id}`)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-accent/30 hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{b.service}</p>
                  <p className="text-xs text-muted-foreground">{b.provider} • {b.date}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{b.address}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${b.statusColor}`}>{b.status.replace("_", " ")}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </AnimatedList>
        )}
      </div>

      <BottomNav variant="client" items={[
        { icon: Home, label: "Home", path: "/client/dashboard" },
        { icon: Calendar, label: "Bookings", path: "/client/bookings", active: true },
        { icon: Map, label: "Map", path: "/client/map" },
        { icon: User, label: "Profile", path: "/client/profile" },
      ]} />
    </PageTransition>
  );
};

export default ClientBookings;
