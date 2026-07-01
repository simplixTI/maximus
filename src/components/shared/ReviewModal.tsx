import { useState } from "react";
import { Star, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerName?: string;
}

const ReviewModal = ({ open, onOpenChange, providerName = "Provider" }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const submit = () => {
    toast({ title: "Review submitted!", description: "Thank you for your feedback." });
    onOpenChange(false);
    setRating(0);
    setComment("");
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
              <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)}>
                <Star className={`h-8 w-8 transition-colors ${s <= (hover || rating) ? "fill-accent text-accent" : "text-border"}`} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." className="min-h-[100px] rounded-xl border-border bg-secondary text-foreground" />
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Camera className="h-4 w-4" /> Add Photo
          </button>
          <Button onClick={submit} disabled={!rating} className="h-12 w-full rounded-xl bg-accent font-semibold text-accent-foreground disabled:opacity-50">
            Submit Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
