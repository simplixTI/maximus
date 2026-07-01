import { useNavigate } from "react-router-dom";
import { Users, CheckCircle, Briefcase, DollarSign, TrendingUp, ArrowLeft } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const stats = [
    { icon: Users, label: "Total Users", value: "1,247", color: "text-primary" },
    { icon: CheckCircle, label: "Pending Approvals", value: "12", color: "text-accent" },
    { icon: Briefcase, label: "Active Jobs", value: "34", color: "text-green-500" },
    { icon: DollarSign, label: "Revenue (MTD)", value: "$24,580", color: "text-accent" },
  ];

  const navItems = [
    { label: "User Management", path: "/admin/users", desc: "View and manage all users" },
    { label: "Provider Approvals", path: "/admin/approvals", desc: "Review pending applications" },
    { label: "Jobs Management", path: "/admin/jobs", desc: "Monitor active and past jobs" },
    { label: "Quotes", path: "/admin/quotes", desc: "Manage service quotes" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate("/")} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>
      </div>
      <div className="px-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <p className="mt-2 text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="font-display font-semibold text-foreground">Revenue Trend</h2>
          </div>
          <div className="h-40 flex items-center justify-center rounded-xl bg-secondary">
            <p className="text-sm text-muted-foreground">Chart placeholder — Recharts integration</p>
          </div>
        </div>

        <div className="space-y-2">
          {navItems.map((item) => (
            <button key={item.path} onClick={() => navigate(item.path)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 text-left hover:border-accent/30">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <span className="text-muted-foreground">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
