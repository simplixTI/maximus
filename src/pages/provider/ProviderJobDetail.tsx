import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, MessageCircle, Camera, Clock, CheckCircle, Navigation, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import PageTransition from "@/components/shared/PageTransition";

const jobsData: Record<string, { service: string; client: string; initials: string; rating: number; address: string; desc: string; pay: number }> = {
  "1": { service: "Electrical Repair", client: "Sarah Mitchell", initials: "SM", rating: 4.8, address: "456 Oak Ave, Brooklyn, NY 11201", desc: "Outlet replacement in kitchen — 3 outlets not working, possible wiring issue", pay: 120 },
  "2": { service: "Plumbing Fix", client: "Mike Rodriguez", initials: "MR", rating: 4.5, address: "789 Pine St, Manhattan, NY 10002", desc: "Kitchen faucet leaking and bathroom drain clogged", pay: 95 },
  "3": { service: "HVAC Maintenance", client: "Lisa Torres", initials: "LT", rating: 4.9, address: "321 Elm Dr, Queens, NY 11375", desc: "Annual AC tune-up and filter replacement for 2-unit system", pay: 180 },
};

const statuses = ["En Route", "Arrived", "Started", "Complete"] as const;

const ProviderJobDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentStatus, setCurrentStatus] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [beforePhoto, setBeforePhoto] = useState(false);
  const [afterPhoto, setAfterPhoto] = useState(false);

  const job = jobsData[id || "1"] || jobsData["1"];

  useEffect(() => {
    if (currentStatus >= 2 && currentStatus < 3) {
      const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [currentStatus]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const advanceStatus = () => {
    if (currentStatus < statuses.length - 1) {
      setCurrentStatus(currentStatus + 1);
      toast({ title: `Status: ${statuses[currentStatus + 1]}` });
    } else {
      toast({ title: "Job Completed! 🎉", description: `You earned $${job.pay}.00` });
      navigate("/provider/earnings");
    }
  };

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="font-display text-xl font-bold text-foreground">Job #{id}</h1>
        <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${currentStatus < 3 ? "bg-accent/15 text-accent" : "bg-green-500/15 text-green-500"}`}>
          {statuses[currentStatus]}
        </span>
      </div>

      <div className="px-6 space-y-4">
        {/* Status progress */}
        <div className="flex items-center gap-1">
          {statuses.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors duration-500 ${i <= currentStatus ? "bg-accent" : "bg-border"}`} />
              <p className={`mt-1 text-center text-[9px] font-medium ${i <= currentStatus ? "text-accent" : "text-muted-foreground"}`}>{s}</p>
            </div>
          ))}
        </div>

        {/* Client info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-bold text-accent">{job.initials}</div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{job.client}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-accent text-accent" />{job.rating} • Residential Client
              </div>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground"><Phone className="h-4 w-4" /></button>
            <button onClick={() => navigate(`/chat/${id}`)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><MessageCircle className="h-4 w-4" /></button>
          </div>
        </motion.div>

        {/* Service details */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold text-foreground">{job.service}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{job.desc}</p>
          <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />{job.address}
          </div>
          <Button variant="outline" onClick={() => toast({ title: "Opening Maps..." })} className="mt-3 h-10 gap-2 rounded-xl border-border text-foreground">
            <Navigation className="h-4 w-4" /> Open in Maps
          </Button>
        </div>

        {/* Timer */}
        {currentStatus >= 2 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center">
            <Clock className="mx-auto h-6 w-6 text-accent" />
            <p className="mt-1 text-3xl font-bold font-mono text-foreground">{formatTime(seconds)}</p>
            <p className="text-xs text-muted-foreground">Job Duration</p>
          </motion.div>
        )}

        {/* Photo upload */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setBeforePhoto(true); toast({ title: "Before photo captured 📸" }); }} className={`flex flex-col items-center gap-2 rounded-2xl border p-6 transition-all ${beforePhoto ? "border-green-500/30 bg-green-500/5" : "border-dashed border-border bg-card"}`}>
            {beforePhoto ? <CheckCircle className="h-6 w-6 text-green-500" /> : <Camera className="h-6 w-6 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">{beforePhoto ? "Before ✓" : "Before Photo"}</span>
          </button>
          <button onClick={() => { setAfterPhoto(true); toast({ title: "After photo captured 📸" }); }} className={`flex flex-col items-center gap-2 rounded-2xl border p-6 transition-all ${afterPhoto ? "border-green-500/30 bg-green-500/5" : "border-dashed border-border bg-card"}`}>
            {afterPhoto ? <CheckCircle className="h-6 w-6 text-green-500" /> : <Camera className="h-6 w-6 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">{afterPhoto ? "After ✓" : "After Photo"}</span>
          </button>
        </div>

        {/* Pay info */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="text-sm text-muted-foreground">Estimated Pay</span>
          <span className="text-xl font-bold text-accent">${job.pay}.00</span>
        </div>

        <Button onClick={advanceStatus} className="h-14 w-full rounded-2xl bg-accent font-display text-lg font-semibold text-accent-foreground transition-all hover:scale-[1.01] active:scale-[0.99]">
          {currentStatus < statuses.length - 1 ? (
            <>Mark as "{statuses[currentStatus + 1]}"</>
          ) : (
            <><CheckCircle className="mr-2 h-5 w-5" /> Complete Job</>
          )}
        </Button>
      </div>
    </PageTransition>
  );
};

export default ProviderJobDetail;
