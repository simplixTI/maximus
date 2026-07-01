import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const mockUsers = [
  { id: "1", name: "Sarah Mitchell", email: "sarah@test.com", role: "client", status: "active", joined: "Mar 1" },
  { id: "2", name: "John Davis", email: "john@test.com", role: "provider", status: "active", joined: "Feb 15" },
  { id: "3", name: "Lisa Torres", email: "lisa@test.com", role: "client", status: "active", joined: "Mar 10" },
  { id: "4", name: "Mike Rodriguez", email: "mike@test.com", role: "provider", status: "suspended", joined: "Jan 20" },
  { id: "5", name: "Admin User", email: "admin@maximus.com", role: "admin", status: "active", joined: "Jan 1" },
];

const roleColors: Record<string, string> = { client: "bg-primary/15 text-primary", provider: "bg-accent/15 text-accent", admin: "bg-destructive/15 text-destructive" };
const statusColors: Record<string, string> = { active: "bg-green-500/15 text-green-500", suspended: "bg-destructive/15 text-destructive" };

const AdminUsers = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = mockUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="font-display text-xl font-bold text-foreground">User Management</h1>
      </div>
      <div className="px-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="h-11 rounded-xl border-border bg-secondary pl-10 text-foreground" />
        </div>
        <div className="flex gap-2">
          {["all", "client", "provider", "admin"].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${roleFilter === r ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} className="border-border">
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleColors[u.role]}`}>{u.role}</span></TableCell>
                  <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[u.status]}`}>{u.status}</span></TableCell>
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

export default AdminUsers;
