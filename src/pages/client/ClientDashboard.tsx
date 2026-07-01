import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Calendar, Map, User, Plus, Clock, ChevronRight, Bell, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/layout/BottomNav";
import ListSkeleton from "@/components/shared/ListSkeleton";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";

const mockActive = [
  { id: "1", service: "Electrical Repair", provider: "John D.", time: "Today, 10:00 AM", status: "In Progress", statusColor: "bg-primary/15 text-primary" },
];

const mockRecent = [
  { id: "2", service: "Plumbing Fix", provider: "Angela W.", time: "Mar 18", status: "Completed", rating: 4.8 },
  { id: "3", service: "HVAC Maintenance", provider: "Carlos M.", time: "Mar 15", status: "Completed", rating: 4.7 },
];

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-20">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="font-display text-2xl font-bold text-foreground">Test Client</h1>
          </div>
          <button onClick={() => navigate("/client/notifications")} className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent border-2 border-background" />
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

      <div className="mt-6 px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Active Bookings</h2>
          <button onClick={() => navigate("/client/bookings")} className="text-xs text-accent font-medium">View All</button>
        </div>
        {loading ? (
          <ListSkeleton count={1} variant="job" />
        ) : (
          <AnimatedList className="space-y-3">
            {mockActive.map((b) => (
              <button key={b.id} onClick={() => navigate(`/client/tracking/${b.id}`)} className="flex w-full items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{b.service}</p>
                  <p className="text-xs text-muted-foreground">{b.provider} • {b.time}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${b.statusColor}`}>{b.status}</span>
                  <span className="text-xs text-accent font-medium">Track →</span>
                </div>
              </button>
            ))}
          </AnimatedList>
        )}
      </div>

      <div className="mt-6 px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Recent Activity</h2>
        </div>
        {loading ? (
          <ListSkeleton count={2} />
        ) : (
          <AnimatedList className="space-y-2">
            {mockRecent.map((r) => (
              <button key={r.id} onClick={() => navigate(`/client/bookings/${r.id}`)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-accent/20 hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                  <Calendar className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{r.service}</p>
                  <p className="text-xs text-muted-foreground">{r.provider} • {r.time}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">{r.status}</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-accent text-accent" />
                    <span className="text-[10px] text-muted-foreground">{r.rating}</span>
                  </div>
                </div>
              </button>
            ))}
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
