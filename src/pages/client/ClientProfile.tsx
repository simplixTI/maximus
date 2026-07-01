import { useNavigate } from "react-router-dom";
import { Home, Calendar, Map, User, LogOut, ChevronRight, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";
import { useAuth } from "@/contexts/AuthContext";
import { useMyBookings } from "@/hooks/data";
import { useUnreadCount } from "@/hooks/notifications";
import { toast } from "sonner";

const ClientProfile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const bookingsQ = useMyBookings();
  const unreadQ = useUnreadCount();

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "You";
  const email = user?.email ?? "";
  const initials =
    fullName.split(" ").filter(Boolean).map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "?";
  const bookings = bookingsQ.data ?? [];
  const completed = bookings.filter((b) => b.status === "completed");
  const totalSpent = completed.reduce(
    (sum, b) => sum + Number((b as { quote?: { amount?: number } }).quote?.amount ?? 0),
    0,
  );
  const unread = unreadQ.data ?? 0;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      navigate("/login", { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign out failed");
    }
  };

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-20">
      <div className="px-6 pt-8 pb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Profile</h1>
      </div>

      <div className="px-6 space-y-6">
        <div className="flex flex-col items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/15 text-3xl font-bold text-accent">
            {initials}
          </div>
          <p className="mt-3 font-display text-lg font-semibold text-foreground capitalize">{fullName}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
              <Star className="h-3 w-3" /> Member
            </span>
            <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-500">
              <Shield className="h-3 w-3" /> Verified
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-foreground">{bookings.length}</p>
            <p className="text-[10px] text-muted-foreground">Bookings</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-foreground">{completed.length}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-foreground">${totalSpent.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Total Spent</p>
          </div>
        </div>

        <AnimatedList className="space-y-2">
          {[
            { label: "Personal Information", path: "/client/profile/edit", icon: "👤" },
            { label: "Payment Methods", path: "/client/payments", icon: "💳" },
            { label: "Membership Plan", path: "/client/membership", icon: "⭐" },
            { label: "Notifications", path: "/client/notifications", icon: "🔔", badge: unread > 0 ? unread : undefined },
            { label: "Help & Support", path: "/client/support", icon: "💬" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-left transition-all hover:border-accent/50 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
              {item.badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </AnimatedList>

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="h-12 w-full gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
        >
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
