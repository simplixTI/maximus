import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { q: "How do I cancel a booking?", a: "Go to your Bookings tab, select the booking, and tap 'Cancel'. Cancellations made 24h+ in advance are free." },
  { q: "How does payment work?", a: "We hold funds in escrow when you book. Payment is released to the provider only after the job is marked complete." },
  { q: "What if I'm not satisfied with the service?", a: "You can file a dispute within 48 hours of job completion. Our team will review and mediate." },
  { q: "How are providers vetted?", a: "All providers undergo background checks, license verification, and insurance validation before approval." },
];

const ClientSupport = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Help & Support</h1>
      </div>

      <div className="px-6 space-y-6">
        {/* Emergency */}
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <Phone className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-foreground">Emergency Line</p>
            <p className="text-xs text-muted-foreground">1-800-MAXIMUS (24/7)</p>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">FAQ</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between p-4 text-left">
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-border px-4 py-3">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Contact Us</h2>
          <div className="space-y-3">
            <Input placeholder="Subject" className="h-12 rounded-xl border-border bg-secondary text-foreground" />
            <Textarea placeholder="Describe your issue..." className="min-h-[120px] rounded-xl border-border bg-secondary text-foreground" />
            <Button onClick={() => toast({ title: "Message sent", description: "We'll get back to you within 24 hours." })} className="h-12 w-full rounded-xl bg-accent font-semibold text-accent-foreground">
              Send Message
            </Button>
          </div>
        </div>

        <Button variant="outline" className="h-12 w-full gap-2 rounded-xl border-border text-foreground">
          <MessageCircle className="h-4 w-4" />
          Start Live Chat
        </Button>
      </div>
    </div>
  );
};

export default ClientSupport;
