import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, CreditCard, Bell, CheckCircle, AlertTriangle } from "lucide-react";
import ListSkeleton from "@/components/shared/ListSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";

const mockNotifications = [
  { id: "1", icon: CheckCircle, title: "Booking Confirmed", desc: "Your plumbing service is scheduled for tomorrow at 10 AM", time: "2 min ago", read: false, color: "text-green-500" },
  { id: "2", icon: AlertTriangle, title: "Provider En Route", desc: "John D. is on the way. ETA: 15 minutes", time: "1 hour ago", read: false, color: "text-accent" },
  { id: "3", icon: CreditCard, title: "Payment Processed", desc: "Payment of $150.00 for electrical service completed", time: "3 hours ago", read: true, color: "text-primary" },
  { id: "4", icon: Calendar, title: "Upcoming Service", desc: "HVAC maintenance scheduled for March 28 at 2 PM", time: "1 day ago", read: true, color: "text-primary" },
  { id: "5", icon: Bell, title: "Special Offer", desc: "Get 20% off your next service with code SPRING20", time: "2 days ago", read: true, color: "text-accent" },
];

const ClientNotifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<typeof mockNotifications>([]);

  useEffect(() => {
    const timer = setTimeout(() => { setNotifications(mockNotifications); setLoading(false); }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="font-display text-xl font-bold text-foreground">Notifications</h1>
      </div>

      <div className="px-6">
        {loading ? (
          <ListSkeleton count={4} />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="All caught up!" description="You have no notifications right now. We'll let you know when something important happens." />
        ) : (
          <AnimatedList className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className={`flex gap-3 rounded-2xl border p-4 transition-all hover:scale-[1.01] ${n.read ? "border-border bg-card" : "border-accent/30 bg-accent/5"}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary ${n.color}`}>
                  <n.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.desc}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{n.time}</p>
                </div>
              </div>
            ))}
          </AnimatedList>
        )}
      </div>
    </PageTransition>
  );
};

export default ClientNotifications;
