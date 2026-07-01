import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const mockCards = [
  { id: "1", last4: "4242", brand: "Visa", expiry: "12/27", isDefault: true },
  { id: "2", last4: "8888", brand: "Mastercard", expiry: "06/26", isDefault: false },
];

const ClientPayments = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState(mockCards);
  const [open, setOpen] = useState(false);

  const setDefault = (id: string) => {
    setCards(cards.map((c) => ({ ...c, isDefault: c.id === id })));
    toast({ title: "Default card updated" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Payment Methods</h1>
      </div>

      <div className="px-6 space-y-4">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setDefault(card.id)}
            className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent/50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
              <CreditCard className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">{card.brand} •••• {card.last4}</p>
              <p className="text-xs text-muted-foreground">Expires {card.expiry}</p>
            </div>
            {card.isDefault && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                <Check className="h-3 w-3 text-accent-foreground" />
              </span>
            )}
          </button>
        ))}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-14 w-full gap-2 rounded-2xl border-dashed border-border text-muted-foreground">
              <Plus className="h-5 w-5" />
              Add New Card
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Payment Method</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-foreground">Card Number</Label>
                <Input placeholder="1234 5678 9012 3456" className="h-12 rounded-xl border-border bg-secondary text-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-foreground">Expiry</Label>
                  <Input placeholder="MM/YY" className="h-12 rounded-xl border-border bg-secondary text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">CVV</Label>
                  <Input placeholder="123" className="h-12 rounded-xl border-border bg-secondary text-foreground" />
                </div>
              </div>
              <Button onClick={() => { setOpen(false); toast({ title: "Card added successfully" }); }} className="h-12 w-full rounded-xl bg-accent font-semibold text-accent-foreground">
                Add Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ClientPayments;
