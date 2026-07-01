import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MockMap, { MapMarker } from "@/components/shared/MockMap";

const ClientTracking = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [eta, setEta] = useState(12);

  const trackingSteps = [
    { label: "Confirmed", active: step >= 0 },
    { label: "En Route", active: step >= 1 },
    { label: "Arrived", active: step >= 2 },
    { label: "In Progress", active: step >= 3 },
    { label: "Complete", active: step >= 4 },
  ];

  // Provider marker moves toward client
  const [providerLat, setProviderLat] = useState(40.718);
  const [providerLng, setProviderLng] = useState(-74.012);

  useEffect(() => {
    const interval = setInterval(() => {
      setProviderLat((l) => l - 0.0004);
      setProviderLng((l) => l + 0.0004);
      setEta((e) => Math.max(0, e - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-advance steps
  useEffect(() => {
    if (eta <= 8 && step < 1) setStep(1);
    if (eta <= 4 && step < 2) setStep(2);
    if (eta <= 1 && step < 3) setStep(3);
    if (eta <= 0 && step < 4) setStep(4);
  }, [eta]);

  const markers: MapMarker[] = [
    { id: "client", lat: 40.7128, lng: -74.006, label: "Your Location", type: "user" },
    { id: "provider", lat: providerLat, lng: providerLng, label: "John Davis", type: "provider", detail: "En Route • Ford F-150" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Map */}
      <div className="relative h-[55vh]">
        <MockMap markers={markers} center={[40.715, -74.008]} zoom={14} className="h-full" />
        <button onClick={() => navigate(-1)} className="absolute left-4 top-8 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 backdrop-blur text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom card */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-1 -mt-6 rounded-t-3xl border-t border-border bg-card px-6 pt-6 pb-8 z-10"
      >
        {/* Status bar */}
        <div className="mb-5 flex items-center gap-1">
          {trackingSteps.map((s, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors duration-500 ${s.active ? "bg-accent" : "bg-border"}`} />
              <p className={`mt-1 text-center text-[9px] font-medium transition-colors ${s.active ? "text-accent" : "text-muted-foreground"}`}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-lg font-bold text-accent">JD</div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">John Davis</p>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span className="text-foreground">4.9</span>
              <span className="mx-1 text-border">•</span>
              <span className="text-muted-foreground">White Ford F-150 • ABC 1234</span>
            </div>
          </div>
        </div>

        <motion.div
          key={eta}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className="mt-3 rounded-xl bg-accent/10 p-3 text-center"
        >
          <p className="text-xs text-muted-foreground">Estimated Arrival</p>
          <p className="text-2xl font-bold text-accent">{eta > 0 ? `${eta} min` : "Arrived!"}</p>
        </motion.div>

        <div className="mt-4 flex gap-3">
          <Button variant="outline" className="h-12 flex-1 gap-2 rounded-xl border-border text-foreground">
            <Phone className="h-4 w-4" /> Call
          </Button>
          <Button onClick={() => navigate(`/chat/${id}`)} className="h-12 flex-1 gap-2 rounded-xl bg-accent text-accent-foreground">
            <MessageCircle className="h-4 w-4" /> Message
          </Button>
        </div>

        <Button variant="ghost" onClick={() => setCancelOpen(true)} className="mt-3 h-10 w-full text-destructive hover:bg-destructive/10">
          Cancel Service
        </Button>
      </motion.div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Cancel Service?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? Cancellation fees may apply if the provider is already en route.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setCancelOpen(false)} className="flex-1 rounded-xl border-border text-foreground">Keep</Button>
            <Button onClick={() => { setCancelOpen(false); navigate("/client/dashboard"); }} className="flex-1 rounded-xl bg-destructive text-destructive-foreground">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientTracking;
