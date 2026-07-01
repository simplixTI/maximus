import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Essential",
    monthly: 29,
    features: ["2 service requests/month", "Standard support", "Basic scheduling"],
  },
  {
    name: "Plus",
    monthly: 59,
    popular: true,
    features: ["5 service requests/month", "Priority support", "Flexible scheduling", "10% discount on services"],
  },
  {
    name: "Premium",
    monthly: 99,
    features: ["Unlimited requests", "24/7 VIP support", "Same-day scheduling", "20% discount on services", "Dedicated account manager"],
  },
];

const ClientMembership = () => {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [currentPlan] = useState("Plus");

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Membership Plans</h1>
      </div>

      <div className="px-6">
        {/* Toggle */}
        <div className="mx-auto mb-6 flex w-fit items-center gap-3 rounded-full bg-secondary p-1">
          <button onClick={() => setAnnual(false)} className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${!annual ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
            Monthly
          </button>
          <button onClick={() => setAnnual(true)} className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${annual ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
            Annual <span className="text-xs opacity-80">-20%</span>
          </button>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => {
            const price = annual ? Math.round(plan.monthly * 0.8) : plan.monthly;
            const isCurrent = plan.name === currentPlan;
            return (
              <div key={plan.name} className={`relative rounded-2xl border p-5 ${plan.popular ? "border-accent bg-accent/5" : "border-border bg-card"}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-5 flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    <Crown className="h-3 w-3" /> Most Popular
                  </span>
                )}
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
                    <p className="text-2xl font-bold text-foreground">
                      ${price}<span className="text-sm font-normal text-muted-foreground">/{annual ? "mo" : "mo"}</span>
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">Current</span>
                  )}
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => toast({ title: isCurrent ? "Already on this plan" : `Switched to ${plan.name}` })}
                  variant={isCurrent ? "outline" : "default"}
                  className={`mt-4 h-12 w-full rounded-xl font-semibold ${isCurrent ? "border-border text-muted-foreground" : "bg-accent text-accent-foreground"}`}
                >
                  {isCurrent ? "Current Plan" : "Select Plan"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ClientMembership;
