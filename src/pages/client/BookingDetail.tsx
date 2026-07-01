import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Phone, MessageCircle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/shared/PageTransition";
import ReviewModal from "@/components/shared/ReviewModal";

const bookingsData: Record<string, { service: string; provider: string; initials: string; rating: number; jobs: number; address: string; date: string; status: string; statusColor: string; steps: { label: string; time: string; done: boolean }[]; fee: number; parts: number; platform: number }> = {
  "1": {
    service: "Electrical Repair", provider: "John Davis", initials: "JD", rating: 4.9, jobs: 127, address: "456 Oak Ave, Brooklyn, NY", date: "Mar 20, 2026", status: "In Progress", statusColor: "bg-primary/15 text-primary",
    steps: [
      { label: "Request Submitted", time: "Mar 20, 9:00 AM", done: true },
      { label: "Provider Assigned", time: "Mar 20, 9:15 AM", done: true },
      { label: "Provider En Route", time: "Mar 20, 9:45 AM", done: true },
      { label: "In Progress", time: "Mar 20, 10:00 AM", done: true },
      { label: "Completed", time: "—", done: false },
    ],
    fee: 120, parts: 35, platform: 15.5,
  },
  "2": {
    service: "Plumbing Fix", provider: "Angela Wu", initials: "AW", rating: 4.8, jobs: 98, address: "789 Pine St, Manhattan, NY", date: "Mar 18, 2026", status: "Completed", statusColor: "bg-green-500/15 text-green-500",
    steps: [
      { label: "Request Submitted", time: "Mar 18, 2:00 PM", done: true },
      { label: "Provider Assigned", time: "Mar 18, 2:10 PM", done: true },
      { label: "Provider En Route", time: "Mar 18, 2:30 PM", done: true },
      { label: "In Progress", time: "Mar 18, 3:00 PM", done: true },
      { label: "Completed", time: "Mar 18, 4:15 PM", done: true },
    ],
    fee: 95, parts: 20, platform: 11.5,
  },
  "3": {
    service: "HVAC Maintenance", provider: "Carlos Mendez", initials: "CM", rating: 4.7, jobs: 64, address: "321 Elm Dr, Queens, NY", date: "Mar 15, 2026", status: "Completed", statusColor: "bg-green-500/15 text-green-500",
    steps: [
      { label: "Request Submitted", time: "Mar 15, 9:00 AM", done: true },
      { label: "Provider Assigned", time: "Mar 15, 9:05 AM", done: true },
      { label: "Provider En Route", time: "Mar 15, 9:20 AM", done: true },
      { label: "In Progress", time: "Mar 15, 9:45 AM", done: true },
      { label: "Completed", time: "Mar 15, 11:00 AM", done: true },
    ],
    fee: 180, parts: 45, platform: 22.5,
  },
};

const BookingDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [reviewOpen, setReviewOpen] = useState(false);

  const booking = bookingsData[id || "1"] || bookingsData["1"];
  const total = booking.fee + booking.parts + booking.platform;

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Booking #{id}</h1>
      </div>

      <div className="px-6 space-y-5">
        {/* Service Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.statusColor}`}>{booking.status}</span>
            <span className="text-xs text-muted-foreground">{booking.date}</span>
          </div>
          <h2 className="mt-3 font-display text-lg font-bold text-foreground">{booking.service}</h2>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {booking.address}
          </div>
        </motion.div>

        {/* Provider */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-xl font-bold text-accent">{booking.initials}</div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{booking.provider}</p>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              <span className="text-sm text-foreground">{booking.rating}</span>
              <span className="text-xs text-muted-foreground">({booking.jobs} jobs)</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground"><Phone className="h-4 w-4" /></button>
            <button onClick={() => navigate(`/chat/${id}`)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><MessageCircle className="h-4 w-4" /></button>
          </div>
        </motion.div>

        {/* Status Timeline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display font-semibold text-foreground">Status</h3>
          <div className="space-y-0">
            {booking.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-3 w-3 rounded-full ${step.done ? "bg-accent" : "border-2 border-border bg-background"}`} />
                  {i < booking.steps.length - 1 && <div className={`w-0.5 flex-1 ${step.done ? "bg-accent/40" : "bg-border"}`} />}
                </div>
                <div className="pb-5">
                  <p className={`text-sm font-medium ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Invoice */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display font-semibold text-foreground">Invoice</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Service Fee</span><span className="text-foreground">${booking.fee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Parts</span><span className="text-foreground">${booking.parts.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span className="text-foreground">${booking.platform.toFixed(2)}</span></div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span className="text-foreground">Total</span><span className="text-accent">${total.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {booking.status === "In Progress" ? (
          <Button onClick={() => navigate(`/client/tracking/${id}`)} className="h-12 w-full gap-2 rounded-xl bg-accent text-accent-foreground font-semibold">
            <MapPin className="h-4 w-4" /> Track Provider Live
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button onClick={() => setReviewOpen(true)} variant="outline" className="h-12 flex-1 gap-2 rounded-xl border-border text-foreground">
              <Star className="h-4 w-4" /> Rate & Review
            </Button>
            <Button onClick={() => navigate("/client/request")} className="h-12 flex-1 gap-2 rounded-xl bg-accent text-accent-foreground">
              <RotateCcw className="h-4 w-4" /> Re-book
            </Button>
          </div>
        )}
      </div>

      <ReviewModal open={reviewOpen} onOpenChange={setReviewOpen} providerName={booking.provider} />
    </PageTransition>
  );
};

export default BookingDetail;
