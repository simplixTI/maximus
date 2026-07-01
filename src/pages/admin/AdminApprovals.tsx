import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { usePendingProviders, useApproveProvider, useRejectProvider } from "@/hooks/data";
import { signedUrl } from "@/hooks/upload";

const AdminApprovals = () => {
  const navigate = useNavigate();
  const pendingQ = usePendingProviders();
  const approve = useApproveProvider();
  const reject = useRejectProvider();
  const [expanded, setExpanded] = useState<string | null>(null);

  const pending = pendingQ.data ?? [];

  const openDoc = async (path: string) => {
    try {
      const url = await signedUrl("provider-docs", path, 60 * 60);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open document");
    }
  };

  const doApprove = async (id: string, name: string) => {
    try {
      await approve.mutateAsync(id);
      toast.success(`${name} approved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approve failed");
    }
  };

  const doReject = async (id: string, name: string) => {
    try {
      await reject.mutateAsync({ provider_id: id });
      toast(`${name} rejected — provider was notified`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reject failed");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Provider Approvals</h1>
        <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
          {pending.length} pending
        </span>
      </div>

      <div className="px-6 space-y-3">
        {pendingQ.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <CheckCircle className="mx-auto h-6 w-6 text-green-500" />
            <p className="mt-2 text-sm text-muted-foreground">All caught up — no pending applications</p>
          </div>
        ) : (
          pending.map((p) => {
            const row = p as unknown as {
              user_id: string;
              business_name: string | null;
              ein: string | null;
              city: string | null;
              state: string | null;
              bio: string | null;
              created_at: string;
              profile: { full_name?: string; email?: string; phone?: string } | null;
              documents: { id: string; type: string; file_url: string; status: string; created_at: string }[];
              skills: { id: string; skill: string; license_status: string }[];
            };
            const name = row.profile?.full_name ?? row.profile?.email ?? "Provider";
            const isExpanded = expanded === row.user_id;
            return (
              <div key={row.user_id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {row.business_name || "No business name"} · {row.profile?.email}
                    </p>
                    {(row.city || row.state) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[row.city, row.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </span>
                </div>

                {row.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {row.skills.map((s) => (
                      <span key={s.id} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground capitalize">
                        {s.skill}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setExpanded(isExpanded ? null : row.user_id)}
                  className="mt-3 flex items-center gap-2 text-xs text-accent hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {row.documents.length} document{row.documents.length !== 1 ? "s" : ""} · {isExpanded ? "Hide" : "View"}
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-2">
                    {row.documents.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No documents uploaded.</p>
                    ) : (
                      row.documents.map((d) => (
                        <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-secondary px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground capitalize">{d.type.replace(/_/g, " ")}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })} · {d.status}
                            </p>
                          </div>
                          <button
                            onClick={() => openDoc(d.file_url)}
                            className="flex items-center gap-1 rounded-lg bg-card px-2 py-1 text-xs text-accent hover:bg-accent/10"
                          >
                            Open <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reject.isPending}
                    onClick={() => doReject(row.user_id, name)}
                    className="flex-1 gap-1 rounded-xl border-destructive/30 text-destructive"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={approve.isPending}
                    onClick={() => doApprove(row.user_id, name)}
                    className="flex-1 gap-1 rounded-xl bg-green-600 text-white"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminApprovals;
