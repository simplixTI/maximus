import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface QuoteResponseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuoteResponseModal = ({ open, onOpenChange }: QuoteResponseModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Quote Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-xl bg-secondary p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Service</span><span className="text-foreground">Electrical Repair</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Provider</span><span className="text-foreground">John Davis</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Scope</span><span className="text-foreground">3 outlet replacements + wiring inspection</span></div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span className="text-foreground">Total</span><span className="text-accent text-lg">$185.00</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { onOpenChange(false); toast({ title: "Quote declined" }); }} className="flex-1 rounded-xl border-border text-foreground">Decline</Button>
            <Button variant="outline" onClick={() => { onOpenChange(false); toast({ title: "Revision requested" }); }} className="flex-1 rounded-xl border-accent text-accent">Revise</Button>
            <Button onClick={() => { onOpenChange(false); toast({ title: "Quote accepted!" }); }} className="flex-1 rounded-xl bg-accent text-accent-foreground">Accept</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteResponseModal;
