import { useNavigate } from "react-router-dom";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const mockJobs = [
  { id: "1042", service: "Electrical Repair", client: "Sarah M.", provider: "John D.", status: "in_progress", date: "Mar 20" },
  { id: "1041", service: "Plumbing Fix", client: "Mike R.", provider: "Angela W.", status: "completed", date: "Mar 19" },
  { id: "1040", service: "HVAC Maintenance", client: "Lisa T.", provider: "Carlos M.", status: "pending", date: "Mar 19" },
  { id: "1039", service: "Painting", client: "Tom H.", provider: "—", status: "unassigned", date: "Mar 18" },
];

const statusColors: Record<string, string> = {
  in_progress: "bg-primary/15 text-primary",
  completed: "bg-green-500/15 text-green-500",
  pending: "bg-accent/15 text-accent",
  unassigned: "bg-destructive/15 text-destructive",
};

const AdminJobs = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="font-display text-xl font-bold text-foreground">Jobs Management</h1>
      </div>
      <div className="px-6">
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Job</TableHead>
                <TableHead className="text-muted-foreground">Provider</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockJobs.map((j) => (
                <TableRow key={j.id} className="border-border">
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">#{j.id} — {j.service}</p>
                    <p className="text-xs text-muted-foreground">{j.client} • {j.date}</p>
                  </TableCell>
                  <TableCell><span className="text-sm text-foreground">{j.provider}</span></TableCell>
                  <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[j.status]}`}>{j.status.replace("_", " ")}</span></TableCell>
                  <TableCell><MoreVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminJobs;
