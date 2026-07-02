import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, MessageCircle, CheckCircle, Navigation, Star, Loader2, XCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import PageTransition from "@/components/shared/PageTransition";
import { useBooking, useUpdateBookingStatus, useDeclineJob } from "@/hooks/data";

const STATUS_FLOW = ["confirmed", "en_route", "arrived", "in_progress", "completed"] as const;
type Status = (typeof STATUS_FLOW)[number];

const NEXT_LABEL: Record<Status, string> = {
  confirmed: "Start Trip (En Route)",
  en_route: "I've Arrived",
  arrived: "Start Work",
  in_progress: "Complete Job",
  completed: "Complete Job",
};

const NEXT_STATUS: Partial<Record<Status, Status>> = {
  confirmed: "en_route",
  en_route: "arrived",
  arrived: "in_progress",
  in_progress: "completed",
};

const ProviderJobDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const bookingQ = useBooking(id);
  const update = useUpdateBookingStatus();
  const decline = useDeclineJob();
  const [declineOpen, setDeclineOpen] = useState(false);

  const status = ((bookingQ.data?.status as Status | undefined) ?? "confirmed") as Status;
  const stepIndex = useMemo(() => Math.max(0, STATUS_FLOW.indexOf(status)), [status]);
  const client = (bookingQ.data as { client?: { full_name?: string; phone?: string } } | undefined | null)?.client;
  const req = (bookingQ.data as { request?: { category?: string; description?: string; address?: string } } | undefined | null)?.request;
  const amount = ((bookingQ.data as { quote?: { amount?: number } } | undefined | null)?.quote?.amount) ?? 0;
  const initials = (client?.full_name ?? "").split(" ").filter(Boolean).map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const advance = async () => {
    if (!id) return;
    const next = NEXT_STATUS[status];
    if (!next) {
      toast("Job already completed");
      return;
    }
    try {
      await update.mutateAsync({ booking_id: id, status: next });
      toast.success(`Status: ${next.replace("_", " ")}`);
      if (next === "completed") navigate("/provider/earnings");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  if (bookingQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!bookingQ.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Job not found.
      </div>
    );
  }

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="font-display text-xl font-bold text-foreground">Job details</h1>
        <span
          className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
            status === "completed" ? "bg-green-500/15 text-green-500" : "bg-accent/15 text-accent"
          }`}
        >
          {status.replace("_", " ")}
        </span>
      </div>

      <div className="px-6 space-y-4">
        <div className="flex items-center gap-1">
          {STATUS_FLOW.slice(1).map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors duration-500 ${i < stepIndex ? "bg-accent" : "bg-border"}`} />
              <p className={`mt-1 text-center text-[9px] font-medium capitalize ${i < stepIndex ? "text-accent" : "text-muted-foreground"}`}>
                {s.replace("_", " ")}
              </p>
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-bold text-accent">
              {initials || "?"}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{client?.full_name ?? "Client"}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-accent text-accent" /> Residential Client
              </div>
            </div>
            {client?.phone && (
              <a href={`tel:${client.phone}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                <Phone className="h-4 w-4" />
              </a>
            )}
            <button onClick={() => navigate(`/chat/${id}`)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold text-foreground capitalize">{req?.category ?? "Service"}</h3>
          {req?.description && <p className="mt-1 text-sm text-muted-foreground">{req.description}</p>}
          {req?.address && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {req.address}
            </div>
          )}
          {req?.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(req.address)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" className="mt-3 h-10 gap-2 rounded-xl border-border text-foreground">
                <Navigation className="h-4 w-4" /> Open in Maps
              </Button>
            </a>
          )}
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="text-sm text-muted-foreground">Pay</span>
          <span className="text-xl font-bold text-accent">${Number(amount).toFixed(2)}</span>
        </div>

        {/* Invitation banner — only until first action */}
        {status === "confirmed" && (
          <div className="flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/[0.06] px-4 py-3">
            <Sparkles className="h-4 w-4 shrink-0 text-accent" />
            <p className="text-xs text-foreground">
              <span className="font-semibold text-accent">New job invitation.</span>{" "}
              Accept to start, or decline to release it.
            </p>
          </div>
        )}

        <Button
          onClick={advance}
          disabled={update.isPending || status === "completed"}
          className="h-14 w-full rounded-2xl bg-accent font-display text-lg font-semibold text-accent-foreground transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          {status === "completed" ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" /> Job completed
            </>
          ) : update.isPending ? (
            "Updating…"
          ) : status === "confirmed" ? (
            "Accept & Start Trip"
          ) : (
            NEXT_LABEL[status]
          )}
        </Button>

        {status === "confirmed" && (
          <Button
            variant="outline"
            onClick={() => setDeclineOpen(true)}
            disabled={decline.isPending}
            className="h-12 w-full gap-2 rounded-2xl border-destructive/30 bg-transparent text-destructive transition-all hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
          >
            <XCircle className="h-4 w-4" />
            Decline job
          </Button>
        )}
      </div>

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display">Decline this job?</DialogTitle>
            <p className="text-xs text-muted-foreground">
              The job returns to the queue and admin gets notified to reassign. Client is kept in the loop.
            </p>
          </DialogHeader>
          <div className="space-y-2">
            {[
              { key: "not_available", label: "I'm not available at that time" },
              { key: "outside_area", label: "Outside my service area" },
              { key: "not_my_expertise", label: "Not my expertise / not a fit" },
              { key: "other", label: "Other reason" },
            ].map((r) => (
              <button
                key={r.key}
                onClick={async () => {
                  if (!id) return;
                  try {
                    await decline.mutateAsync({ booking_id: id, reason: r.key });
                    toast.success("Job declined — admin notified");
                    setDeclineOpen(false);
                    navigate("/provider/jobs", { replace: true });
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed to decline");
                  }
                }}
                disabled={decline.isPending}
                className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-3 text-left text-sm text-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/5 disabled:opacity-40"
              >
                {r.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default ProviderJobDetail;
