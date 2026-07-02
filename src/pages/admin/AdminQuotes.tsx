import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { usePendingRequests, useSentQuotes, useCreateQuote } from "@/hooks/data";
import PhotoGallery from "@/components/shared/PhotoGallery";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-primary/15 text-primary",
  accepted: "bg-green-500/15 text-green-500",
  declined: "bg-destructive/15 text-destructive",
  revision_requested: "bg-yellow-500/15 text-yellow-500",
  expired: "bg-muted text-muted-foreground",
};

const AdminQuotes = () => {
  const navigate = useNavigate();
  const pendingQ = usePendingRequests();
  const sentQ = useSentQuotes();
  const createQuote = useCreateQuote();

  const [forms, setForms] = useState<Record<string, { amount: string; scope: string }>>({});
  const setForm = (id: string, field: "amount" | "scope", value: string) =>
    setForms((f) => ({ ...f, [id]: { amount: f[id]?.amount ?? "", scope: f[id]?.scope ?? "", [field]: value } }));

  const send = async (request_id: string) => {
    const form = forms[request_id];
    if (!form?.amount || !form.scope) {
      toast.error("Amount and scope are required");
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await createQuote.mutateAsync({ request_id, amount, scope: form.scope });
      setForms((f) => ({ ...f, [request_id]: { amount: "", scope: "" } }));
      toast.success("Quote sent to client");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send quote");
    }
  };

  const pending = pendingQ.data ?? [];
  const sent = sentQ.data ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Quotes Management</h1>
      </div>
      <div className="px-6 space-y-6">
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
            Pending Requests {pending.length > 0 && <span className="text-accent">({pending.length})</span>}
          </h2>
          {pendingQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : pending.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
              <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((q) => {
                const client = q.client as { full_name?: string; email?: string } | null;
                const form = forms[q.id] ?? { amount: "", scope: "" };
                return (
                  <div key={q.id} className="rounded-2xl border border-accent/20 bg-card p-5">
                    <div className="flex justify-between gap-3">
                      <p className="font-semibold text-foreground">
                        {client?.full_name || client?.email || "Client"}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-accent mt-0.5 capitalize">{q.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">{q.description}</p>
                    {q.address && <p className="text-xs text-muted-foreground mt-1">📍 {q.address}</p>}
                    {Array.isArray((q as { photos?: string[] }).photos) && ((q as { photos?: string[] }).photos?.length ?? 0) > 0 && (
                      <div className="mt-3">
                        <PhotoGallery
                          paths={(q as { photos?: string[] }).photos ?? []}
                          label="Client photos"
                          compact
                        />
                      </div>
                    )}
                    <div className="mt-3 space-y-2">
                      <Input
                        value={form.amount}
                        onChange={(e) => setForm(q.id, "amount", e.target.value)}
                        placeholder="Amount ($)"
                        type="number"
                        className="h-10 rounded-lg border-border bg-secondary text-foreground"
                      />
                      <Textarea
                        value={form.scope}
                        onChange={(e) => setForm(q.id, "scope", e.target.value)}
                        placeholder="Scope description..."
                        className="min-h-[60px] rounded-lg border-border bg-secondary text-foreground"
                      />
                      <Button
                        onClick={() => send(q.id)}
                        disabled={createQuote.isPending}
                        size="sm"
                        className="gap-1 rounded-lg bg-accent text-accent-foreground"
                      >
                        <Send className="h-3.5 w-3.5" /> {createQuote.isPending ? "Sending…" : "Send Quote"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Recent Quotes</h2>
          {sentQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : sent.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-center text-xs text-muted-foreground">
              No quotes sent yet
            </div>
          ) : (
            <div className="space-y-2">
              {sent.map((q) => {
                const req = q.request as { category?: string; client?: { full_name?: string } } | null;
                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {req?.client?.full_name ?? "Client"} — <span className="capitalize">{req?.category ?? "service"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">${Number(q.amount).toFixed(2)}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[q.status] ?? "bg-secondary text-foreground"}`}
                    >
                      {q.status === "pending" ? "Awaiting client" : q.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminQuotes;
