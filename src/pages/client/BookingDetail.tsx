import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, MapPin, MessageCircle, RotateCcw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/shared/PageTransition";
import ReviewModal from "@/components/shared/ReviewModal";
import { useBooking, useReviewForBooking } from "@/hooks/data";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-primary/15 text-primary",
  en_route: "bg-primary/15 text-primary",
  arrived: "bg-primary/15 text-primary",
  in_progress: "bg-primary/15 text-primary",
  completed: "bg-green-500/15 text-green-500",
  cancelled: "bg-destructive/15 text-destructive",
};

const BookingDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [reviewOpen, setReviewOpen] = useState(false);
  const bookingQ = useBooking(id);
  const existingReviewQ = useReviewForBooking(id);

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
        Booking not found.
      </div>
    );
  }

  const b = bookingQ.data as unknown as {
    id: string;
    status: string;
    created_at: string;
    completed_at: string | null;
    provider_id: string | null;
    request: { category?: string; description?: string; address?: string } | null;
    quote: { amount?: number } | null;
  };
  const fee = Number(b.quote?.amount ?? 0);
  const alreadyReviewed = !!existingReviewQ.data;
  const canReview = b.status === "completed" && !!b.provider_id && !alreadyReviewed;
  const isActive = b.status !== "completed" && b.status !== "cancelled";

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Booking</h1>
      </div>

      <div className="px-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[b.status] ?? "bg-secondary text-foreground"}`}>
              {b.status.replace("_", " ")}
            </span>
            <span className="text-xs text-muted-foreground">{format(new Date(b.created_at), "MMM d, yyyy")}</span>
          </div>
          <h2 className="mt-3 font-display text-lg font-bold text-foreground capitalize">
            {b.request?.category ?? "Service"}
          </h2>
          {b.request?.description && (
            <p className="mt-1 text-sm text-muted-foreground">{b.request.description}</p>
          )}
          {b.request?.address && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {b.request.address}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-xl font-bold text-accent">
            {b.provider_id ? "P" : "…"}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              {b.provider_id ? "Assigned provider" : "Finding a provider…"}
            </p>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              <span className="text-sm text-foreground">Verified</span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/chat/${id}`)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="mb-3 font-display font-semibold text-foreground">Invoice</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Fee</span>
              <span className="text-foreground">${fee.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-accent">${fee.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {isActive ? (
          <Button onClick={() => navigate(`/client/tracking/${id}`)} className="h-12 w-full gap-2 rounded-xl bg-accent text-accent-foreground font-semibold">
            <MapPin className="h-4 w-4" /> Track Provider Live
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={() => setReviewOpen(true)}
              variant="outline"
              disabled={!canReview}
              className="h-12 flex-1 gap-2 rounded-xl border-border text-foreground disabled:opacity-60"
            >
              <Star className="h-4 w-4" />
              {alreadyReviewed ? "Reviewed" : "Rate & Review"}
            </Button>
            <Button
              onClick={() =>
                navigate("/client/request", {
                  state: {
                    rebookFrom: {
                      category: b.request?.category,
                      description: b.request?.description,
                      address: b.request?.address,
                    },
                  },
                })
              }
              className="h-12 flex-1 gap-2 rounded-xl bg-accent text-accent-foreground"
            >
              <RotateCcw className="h-4 w-4" /> Re-book
            </Button>
          </div>
        )}
      </div>

      <ReviewModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        providerName="your provider"
        bookingId={id}
        revieweeId={b.provider_id ?? undefined}
      />
    </PageTransition>
  );
};

export default BookingDetail;
