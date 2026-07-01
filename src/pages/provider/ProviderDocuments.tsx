import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Clock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const docs = [
  { name: "Driver's License (Front)", status: "verified", expiry: "Dec 2027" },
  { name: "Driver's License (Back)", status: "verified", expiry: "Dec 2027" },
  { name: "General Liability Insurance", status: "verified", expiry: "Jun 2026" },
  { name: "Workers' Comp Insurance", status: "pending", expiry: "—" },
  { name: "Electrical License", status: "expired", expiry: "Jan 2026" },
];

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  verified: { icon: CheckCircle, color: "text-green-500", label: "Verified" },
  pending: { icon: Clock, color: "text-accent", label: "Pending" },
  expired: { icon: AlertTriangle, color: "text-destructive", label: "Expired" },
};

const ProviderDocuments = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="font-display text-xl font-bold text-foreground">Documents & Licenses</h1>
      </div>
      <div className="px-6 space-y-3">
        {docs.map((doc) => {
          const cfg = statusConfig[doc.status];
          return (
            <div key={doc.name} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <cfg.icon className={`h-3 w-3 ${cfg.color}`} />
                  <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                  {doc.expiry !== "—" && <span className="text-xs text-muted-foreground">• Exp: {doc.expiry}</span>}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-accent"><Upload className="h-4 w-4" /></Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProviderDocuments;
