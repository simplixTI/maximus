import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Briefcase, DollarSign, User, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";
import { Skeleton } from "@/components/ui/skeleton";

const transactions = [
  { id: "1", service: "Electrical Repair", client: "Sarah M.", date: "Mar 20", amount: 120, type: "earning" },
  { id: "2", service: "Plumbing Fix", client: "Mike R.", date: "Mar 19", amount: 95, type: "earning" },
  { id: "3", service: "HVAC Maintenance", client: "Lisa T.", date: "Mar 18", amount: 180, type: "earning" },
  { id: "4", service: "Payout to Bank", client: "", date: "Mar 17", amount: 450, type: "payout" },
  { id: "5", service: "Painting Job", client: "Tom H.", date: "Mar 16", amount: 210, type: "earning" },
  { id: "6", service: "Roofing Repair", client: "Emma S.", date: "Mar 14", amount: 350, type: "earning" },
];

const ProviderEarnings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const totalEarnings = transactions.filter((t) => t.type === "earning").reduce((s, t) => s + t.amount, 0);

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-20">
      <div className="px-6 pt-8 pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Earnings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your income</p>
      </div>

      <div className="px-6 space-y-5">
        {/* Balance Card */}
        {loading ? (
          <div className="rounded-2xl bg-secondary p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-3 w-40" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-gradient-orange p-6 shadow-orange">
            <p className="text-sm font-medium text-accent-foreground/80">Available Balance</p>
            <p className="mt-1 font-display text-3xl font-bold text-accent-foreground">$505.00</p>
            <p className="mt-2 text-sm text-accent-foreground/70">Next payout: Friday, Mar 21</p>
          </motion.div>
        )}

        {/* Stats row */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-card p-3 text-center">
              <p className="text-lg font-bold text-foreground">$955</p>
              <p className="text-[10px] text-muted-foreground">This Week</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3 text-center">
              <p className="text-lg font-bold text-foreground">$3,420</p>
              <p className="text-[10px] text-muted-foreground">This Month</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-lg font-bold text-green-500">+18%</p>
              </div>
              <p className="text-[10px] text-muted-foreground">vs Last Week</p>
            </div>
          </motion.div>
        )}

        {/* Period toggle */}
        <div className="flex gap-1 rounded-full bg-secondary p-1">
          {(["week", "month", "all"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`flex-1 rounded-full py-2 text-xs font-medium capitalize transition-colors ${period === p ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
              {p === "all" ? "All Time" : `This ${p}`}
            </button>
          ))}
        </div>

        {/* Transactions */}
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Transactions</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-card p-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-20" /></div>
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
          ) : (
            <AnimatedList className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.type === "earning" ? "bg-green-500/10" : "bg-primary/10"}`}>
                    {t.type === "earning" ? <ArrowDownRight className="h-4 w-4 text-green-500" /> : <ArrowUpRight className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.service}</p>
                    <p className="text-xs text-muted-foreground">{t.client ? `${t.client} • ` : ""}{t.date}</p>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === "earning" ? "text-green-500" : "text-primary"}`}>
                    {t.type === "earning" ? "+" : "-"}${t.amount}
                  </span>
                </div>
              ))}
            </AnimatedList>
          )}
        </div>
      </div>

      <BottomNav variant="provider" items={[
        { icon: Map, label: "Map", path: "/provider/map" },
        { icon: Briefcase, label: "Jobs", path: "/provider/jobs" },
        { icon: DollarSign, label: "Earnings", path: "/provider/earnings", active: true },
        { icon: User, label: "Profile", path: "/provider/profile" },
      ]} />
    </PageTransition>
  );
};

export default ProviderEarnings;
