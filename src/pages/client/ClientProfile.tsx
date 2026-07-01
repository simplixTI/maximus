import { useNavigate } from "react-router-dom";
import { Home, Calendar, Map, User, Camera, LogOut, Bell, ChevronRight, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";

const ClientProfile = () => {
  const navigate = useNavigate();

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-20">
      <div className="px-6 pt-8 pb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Profile</h1>
      </div>

      <div className="px-6 space-y-6">
        <div className="flex flex-col items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/15 text-3xl font-bold text-accent">TC</div>
          <p className="mt-3 font-display text-lg font-semibold text-foreground">Test Client</p>
          <p className="text-sm text-muted-foreground">client@test.com</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
              <Star className="h-3 w-3" /> Plus Member
            </span>
            <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-500">
              <Shield className="h-3 w-3" /> Verified
            </span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-foreground">5</p>
            <p className="text-[10px] text-muted-foreground">Bookings</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-foreground">4.8</p>
            <p className="text-[10px] text-muted-foreground">Avg Rating</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-foreground">$627</p>
            <p className="text-[10px] text-muted-foreground">Total Spent</p>
          </div>
        </div>

        <AnimatedList className="space-y-2">
          {[
            { label: "Personal Information", path: "/client/profile/edit", icon: "👤" },
            { label: "Payment Methods", path: "/client/payments", icon: "💳" },
            { label: "Membership Plan", path: "/client/membership", icon: "⭐" },
            { label: "Notifications", path: "/client/notifications", icon: "🔔", badge: 2 },
            { label: "Help & Support", path: "/client/support", icon: "💬" },
          ].map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-left transition-all hover:border-accent/50 hover:scale-[1.01] active:scale-[0.99]">
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
              {item.badge && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">{item.badge}</span>}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </AnimatedList>

        <Button variant="outline" onClick={() => navigate("/login")} className="h-12 w-full gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <BottomNav variant="client" items={[
        { icon: Home, label: "Home", path: "/client/dashboard" },
        { icon: Calendar, label: "Bookings", path: "/client/bookings" },
        { icon: Map, label: "Map", path: "/client/map" },
        { icon: User, label: "Profile", path: "/client/profile", active: true },
      ]} />
    </PageTransition>
  );
};

export default ClientProfile;
