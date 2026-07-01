import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const pendingQuotes = [
  { id: "1", client: "Sarah Mitchell", service: "Electrical Repair", desc: "3 outlets not working in kitchen", submitted: "Mar 20", status: "pending" },
  { id: "2", client: "Tom Harris", service: "Painting", desc: "Full interior paint for 2BR apartment", submitted: "Mar 19", status: "pending" },
];

const sentQuotes = [
  { id: "3", client: "Lisa Torres", service: "HVAC Maintenance", amount: "$180", status: "accepted" },
  { id: "4", client: "Mike Rodriguez", service: "Plumbing", amount: "$95", status: "rejected" },
];

const AdminQuotes = () => {
  const navigate = useNavigate();
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteScope, setQuoteScope] = useState("");

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="font-display text-xl font-bold text-foreground">Quotes Management</h1>
      </div>
      <div className="px-6 space-y-6">
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Pending Requests</h2>
          <div className="space-y-3">
            {pendingQuotes.map((q) => (
              <div key={q.id} className="rounded-2xl border border-accent/20 bg-card p-5">
                <div className="flex justify-between">
                  <p className="font-semibold text-foreground">{q.client}</p>
                  <span className="text-xs text-muted-foreground">{q.submitted}</span>
                </div>
                <p className="text-sm text-accent mt-0.5">{q.service}</p>
                <p className="text-xs text-muted-foreground mt-1">{q.desc}</p>
                <div className="mt-3 space-y-2">
                  <Input value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} placeholder="Amount ($)" className="h-10 rounded-lg border-border bg-secondary text-foreground" />
                  <Textarea value={quoteScope} onChange={(e) => setQuoteScope(e.target.value)} placeholder="Scope description..." className="min-h-[60px] rounded-lg border-border bg-secondary text-foreground" />
                  <Button onClick={() => toast({ title: "Quote sent!" })} size="sm" className="gap-1 rounded-lg bg-accent text-accent-foreground"><Send className="h-3.5 w-3.5" /> Send Quote</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Sent Quotes</h2>
          <div className="space-y-2">
            {sentQuotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{q.client} — {q.service}</p>
                  <p className="text-xs text-muted-foreground">{q.amount}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${q.status === "accepted" ? "bg-green-500/15 text-green-500" : "bg-destructive/15 text-destructive"}`}>{q.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuotes;
