import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const pendingProviders = [
  { id: "1", name: "Carlos Mendez", company: "Mendez HVAC Services", skills: ["HVAC", "Electrical"], submitted: "Mar 18", docs: 4 },
  { id: "2", name: "Angela Wu", company: "Wu Plumbing Co.", skills: ["Plumbing"], submitted: "Mar 19", docs: 3 },
  { id: "3", name: "David Kim", company: "Kim General Contractors", skills: ["Carpentry", "Painting", "Roofing"], submitted: "Mar 20", docs: 5 },
];

const AdminApprovals = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="font-display text-xl font-bold text-foreground">Provider Approvals</h1>
        <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">{pendingProviders.length} pending</span>
      </div>
      <div className="px-6 space-y-3">
        {pendingProviders.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.company}</p>
              </div>
              <span className="text-xs text-muted-foreground">{p.submitted}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.skills.map((s) => (
                <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground">{s}</span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              {p.docs} documents uploaded
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-xl border-border text-foreground"><Eye className="h-3.5 w-3.5" /> Review</Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: `${p.name} rejected` })} className="gap-1 rounded-xl border-destructive/30 text-destructive"><XCircle className="h-3.5 w-3.5" /></Button>
              <Button size="sm" onClick={() => toast({ title: `${p.name} approved!` })} className="gap-1 rounded-xl bg-green-600 text-white"><CheckCircle className="h-3.5 w-3.5" /> Approve</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminApprovals;
