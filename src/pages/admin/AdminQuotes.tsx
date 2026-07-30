import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, FileText, MapPin, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { usePendingRequests, useSentQuotes, useCreateQuote } from "@/hooks/data";
import PhotoGallery from "@/components/shared/PhotoGallery";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-primary/15 text-primary",
  accepted: "bg-green-500/15 text-green-500",
  declined: "bg-destructive/15 text-destructive",
  revision_requested: "bg-yellow-500/15 text-yellow-500",
  expired: "bg-muted text-muted-foreground",
};

const fmtUsd = (n: number): string =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

type ClientProfile = {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

/** Combine service_requests.address with client_profiles.city/state/zip for
 *  a fuller ops view. Falls back gracefully when parts are missing. */
function locationLines(reqAddress: string | null | undefined, cp: ClientProfile | null | undefined) {
  const primary =
    reqAddress && reqAddress !== "Address on file"
      ? reqAddress
      : cp?.address || reqAddress || "";
  const cityLine = [cp?.city, cp?.state, cp?.zip].filter(Boolean).join(", ");
  return { primary, cityLine };
}

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

                    {/* Location — full address + city/state/zip (from client_profile join) */}
                    {(() => {
                      const cp = (client as { client_profile?: ClientProfile } | null)
                        ?.client_profile ?? null;
                      const loc = locationLines(q.address, cp);
                      if (!loc.primary && !loc.cityLine) return null;
                      return (
                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-accent mt-0.5" />
                          <div className="min-w-0 flex-1">
                            {loc.primary && (
                              <p className="truncate text-xs font-medium text-foreground">{loc.primary}</p>
                            )}
                            {loc.cityLine && (
                              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                {loc.cityLine}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {Array.isArray((q as { photos?: string[] }).photos) && ((q as { photos?: string[] }).photos?.length ?? 0) > 0 && (
                      <div className="mt-3">
                        <PhotoGallery
                          paths={(q as { photos?: string[] }).photos ?? []}
                          label="Client photos"
                          compact
                        />
                      </div>
                    )}

                    {/* Client budget target — the anchor for pricing decisions */}
                    {(() => {
                      const budget = (q as { estimated_budget?: number | string | null })
                        .estimated_budget;
                      const budgetNum =
                        budget == null
                          ? null
                          : typeof budget === "string"
                            ? parseFloat(budget)
                            : budget;
                      if (budgetNum == null || Number.isNaN(budgetNum) || budgetNum <= 0) {
                        return (
                          <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-border bg-background/30 px-3 py-2 text-[11px] text-muted-foreground">
                            <Target className="h-3.5 w-3.5" />
                            No budget provided by client
                          </div>
                        );
                      }
                      return (
                        <div className="mt-3 relative overflow-hidden rounded-xl border border-accent/30 bg-accent/[0.04] px-4 py-3">
                          <div
                            aria-hidden
                            className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/20 opacity-60 blur-2xl"
                          />
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Target className="h-3.5 w-3.5 text-accent" />
                              <span className="font-display text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                                Client Budget
                              </span>
                            </div>
                            <div className="flex items-baseline gap-0.5 tabular-nums">
                              <span className="font-display text-lg font-light text-accent leading-none">$</span>
                              <span className="font-display text-2xl font-bold text-accent leading-none">
                                {fmtUsd(budgetNum)}
                              </span>
                            </div>
                          </div>
                          <p className="relative mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                            Client's declared range. Match, price above with justification, or come in below to win.
                          </p>
                        </div>
                      );
                    })()}

                    <div className="mt-3 space-y-2">
                      <Input
                        value={form.amount}
                        onChange={(e) => setForm(q.id, "amount", e.target.value)}
                        placeholder="Amount ($)"
                        type="number"
                        className="h-10 rounded-lg border-border bg-secondary text-foreground"
                      />

                      {/* Live delta vs client budget — appears only when both are set */}
                      {(() => {
                        const budget = (q as { estimated_budget?: number | string | null })
                          .estimated_budget;
                        const budgetNum =
                          budget == null
                            ? null
                            : typeof budget === "string"
                              ? parseFloat(budget)
                              : budget;
                        const amount = parseFloat(form.amount);
                        if (
                          budgetNum == null ||
                          Number.isNaN(budgetNum) ||
                          budgetNum <= 0 ||
                          Number.isNaN(amount) ||
                          amount <= 0
                        )
                          return null;
                        const diff = amount - budgetNum;
                        const pct = (diff / budgetNum) * 100;
                        if (Math.abs(diff) < 0.5) {
                          return (
                            <p className="pl-1 text-[11px] font-medium text-accent tabular-nums">
                              ✓ Matches client budget exactly
                            </p>
                          );
                        }
                        const over = diff > 0;
                        return (
                          <p
                            className={cn(
                              "pl-1 text-[11px] font-medium tabular-nums",
                              over ? "text-destructive/90" : "text-emerald-500",
                            )}
                          >
                            {over ? "▲" : "▼"} ${fmtUsd(Math.abs(diff))} ({pct.toFixed(1)}%){" "}
                            {over ? "above" : "below"} client budget
                          </p>
                        );
                      })()}

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
