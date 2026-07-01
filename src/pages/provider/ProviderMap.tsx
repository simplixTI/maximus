import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Briefcase, DollarSign, User, Star, Clock, MapPin, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/layout/BottomNav";
import MockMap, { MapMarker } from "@/components/shared/MockMap";

const jobMarkers: MapMarker[] = [
  { id: "u", lat: 40.7128, lng: -74.006, label: "You", type: "user", detail: "Your location" },
  { id: "j1", lat: 40.716, lng: -74.001, label: "Electrical Repair", type: "job", detail: "$120 • 0.4 mi • Residential" },
  { id: "j2", lat: 40.709, lng: -74.01, label: "Plumbing Fix", type: "job", detail: "$95 • 0.7 mi • Commercial" },
  { id: "j3", lat: 40.72, lng: -74.008, label: "HVAC Maintenance", type: "job", detail: "$180 • 1.0 mi • Residential" },
];

const jobDetails = [
  { id: "j1", service: "Electrical Repair", client: "Sarah M.", address: "456 Oak Ave, Brooklyn", distance: "0.4 mi", pay: "$120", urgency: "ASAP", rating: 4.8 },
  { id: "j2", service: "Plumbing Fix", client: "Mike R.", address: "789 Pine St, Manhattan", distance: "0.7 mi", pay: "$95", urgency: "Scheduled", rating: 4.5 },
  { id: "j3", service: "HVAC Maintenance", client: "Lisa T.", address: "321 Elm Dr, Queens", distance: "1.0 mi", pay: "$180", urgency: "Standard", rating: 4.9 },
];

const ProviderMap = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [incomingJob, setIncomingJob] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  const detail = jobDetails.find((j) => j.id === selected);

  const handleAccept = (id: string) => {
    setIncomingJob(null);
    toast({ title: "Job Accepted!", description: "Navigate to the client location." });
    navigate(`/provider/jobs/${id.replace("j", "")}`);
  };

  const handleDecline = () => {
    setIncomingJob(null);
    toast({ title: "Job declined", description: "Sent to next nearest provider." });
  };

  // Simulate incoming job
  const simulateIncoming = (id: string) => {
    setIncomingJob(id);
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setIncomingJob(null);
          toast({ title: "Job auto-declined", description: "Time expired. Sent to next provider." });
          return 30;
        }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background pb-20">
      <MockMap
        markers={jobMarkers}
        center={[40.7128, -74.006]}
        zoom={14}
        className="h-[55vh]"
        onMarkerClick={(m) => m.type === "job" && setSelected(m.id)}
      />

      {/* Job list */}
      <div className="flex-1 -mt-4 rounded-t-3xl border-t border-border bg-background px-6 pt-5 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Nearby Jobs <span className="text-sm font-normal text-muted-foreground">({jobDetails.length})</span>
          </h2>
        </div>
        <div className="space-y-2">
          {jobDetails.map((j) => (
            <button
              key={j.id}
              onClick={() => { setSelected(j.id); simulateIncoming(j.id); }}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${selected === j.id ? "border-accent bg-accent/5" : "border-border bg-card"}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <MapPin className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{j.service}</p>
                <p className="text-xs text-muted-foreground">{j.client} • {j.distance}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-accent">{j.pay}</p>
                <span className={`text-[10px] font-medium ${j.urgency === "ASAP" ? "text-destructive" : "text-muted-foreground"}`}>{j.urgency}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Incoming Job Alert — Uber-style */}
      <AnimatePresence>
        {incomingJob && detail && (
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-accent/30 rounded-t-3xl px-6 pt-6 pb-8 shadow-2xl"
          >
            {/* Countdown ring */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">New Job Request</p>
                <p className="font-display text-xl font-bold text-foreground">{detail.service}</p>
              </div>
              <div className="relative flex h-14 w-14 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                  <circle
                    cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--accent))" strokeWidth="3"
                    strokeDasharray={150.8}
                    strokeDashoffset={150.8 - (countdown / 30) * 150.8}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="text-lg font-bold text-accent">{countdown}</span>
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-secondary p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Client</span>
                <span className="text-foreground font-medium">{detail.client} <span className="text-xs text-muted-foreground">⭐ {detail.rating}</span></span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Location</span>
                <span className="text-foreground font-medium">{detail.distance} away</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Address</span>
                <span className="text-foreground font-medium text-right text-xs">{detail.address}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-muted-foreground">Estimated Pay</span>
                <span className="text-accent text-lg font-bold">{detail.pay}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleDecline} variant="outline" className="h-14 flex-1 rounded-2xl border-border text-lg font-semibold text-foreground">
                Decline
              </Button>
              <Button onClick={() => handleAccept(incomingJob)} className="h-14 flex-1 rounded-2xl bg-green-600 text-lg font-semibold text-white animate-pulse">
                Accept
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav variant="provider" items={[
        { icon: Map, label: "Map", path: "/provider/map", active: true },
        { icon: Briefcase, label: "Jobs", path: "/provider/jobs" },
        { icon: DollarSign, label: "Earnings", path: "/provider/earnings" },
        { icon: User, label: "Profile", path: "/provider/profile" },
      ]} />
    </div>
  );
};

export default ProviderMap;
