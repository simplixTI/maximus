import { useNavigate } from "react-router-dom";
import { Map, Briefcase, DollarSign, User, Camera, LogOut, ChevronRight, Star, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";

const ProviderProfile = () => {
  const navigate = useNavigate();

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-20">
      <div className="px-6 pt-8 pb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Profile</h1>
      </div>

      <div className="px-6 space-y-6">
        <div className="flex flex-col items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-3xl font-bold text-primary">TP</div>
          <p className="mt-3 font-display text-lg font-semibold text-foreground">Test Provider</p>
          <p className="text-sm text-muted-foreground">provider@test.com</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-500">
              <Shield className="h-3 w-3" /> Approved
            </span>
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
              <Star className="h-3 w-3" /> 4.9 Rating
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-foreground">127</p>
            <p className="text-[10px] text-muted-foreground">Jobs Done</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-foreground">$12.4k</p>
            <p className="text-[10px] text-muted-foreground">Total Earned</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-foreground">98%</p>
            <p className="text-[10px] text-muted-foreground">Accept Rate</p>
          </div>
        </div>

        <AnimatedList className="space-y-2">
          {[
            { label: "Business Information", path: "/provider/profile/business", icon: "🏢" },
            { label: "Documents & Licenses", path: "/provider/profile/documents", icon: "📄", badge: "1 expired" },
            { label: "Skills & Services", path: "/provider/profile/skills", icon: "🔧" },
            { label: "Vehicle Information", path: "/provider/profile/vehicle", icon: "🚗" },
            { label: "Notifications", path: "/provider/notifications", icon: "🔔", badgeCount: 3 },
            { label: "Help & Support", path: "/provider/support", icon: "💬" },
          ].map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-left transition-all hover:border-accent/50 hover:scale-[1.01] active:scale-[0.99]">
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
              {item.badge && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">{item.badge}</span>}
              {item.badgeCount && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">{item.badgeCount}</span>}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </AnimatedList>

        <Button variant="outline" onClick={() => navigate("/login")} className="h-12 w-full gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <BottomNav variant="provider" items={[
        { icon: Map, label: "Map", path: "/provider/map" },
        { icon: Briefcase, label: "Jobs", path: "/provider/jobs" },
        { icon: DollarSign, label: "Earnings", path: "/provider/earnings" },
        { icon: User, label: "Profile", path: "/provider/profile", active: true },
      ]} />
    </PageTransition>
  );
};

export default ProviderProfile;
