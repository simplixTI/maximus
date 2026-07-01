import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCreateReview } from "@/hooks/data";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerName?: string;
  bookingId?: string;
  revieweeId?: string;
}

const ReviewModal = ({ open, onOpenChange, providerName = "Provider", bookingId, revieweeId }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const mutation = useCreateReview();

  const submit = async () => {
    if (!rating) return;
    if (!bookingId || !revieweeId) {
      toast.error("Missing booking or provider info");
      return;
    }
    try {
      await mutation.mutateAsync({
        booking_id: bookingId,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Review submitted — thank you!");
      onOpenChange(false);
      setRating(0);
      setComment("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit review");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Rate {providerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(s)}
                aria-label={`Rate ${s} stars`}
              >
                <Star className={`h-8 w-8 transition-colors ${s <= (hover || rating) ? "fill-accent text-accent" : "text-border"}`} />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="min-h-[100px] rounded-xl border-border bg-secondary text-foreground"
          />
          <Button
            onClick={submit}
            disabled={!rating || mutation.isPending}
            className="h-12 w-full rounded-xl bg-accent font-semibold text-accent-foreground disabled:opacity-50"
          >
            {mutation.isPending ? "Submitting…" : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
