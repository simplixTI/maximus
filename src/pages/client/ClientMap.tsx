import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Calendar, Map, User, Star, Phone, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/layout/BottomNav";
import MockMap, { MapMarker } from "@/components/shared/MockMap";

const providers: MapMarker[] = [
  { id: "u", lat: 40.7128, lng: -74.006, label: "You", type: "user", detail: "Your location" },
  { id: "1", lat: 40.7155, lng: -74.002, label: "John D.", type: "provider", detail: "Electrician • ⭐ 4.9 • 0.3 mi" },
  { id: "2", lat: 40.7095, lng: -74.009, label: "Angela W.", type: "provider", detail: "Plumber • ⭐ 4.8 • 0.5 mi" },
  { id: "3", lat: 40.718, lng: -74.012, label: "Carlos M.", type: "provider", detail: "HVAC Tech • ⭐ 4.7 • 0.8 mi" },
  { id: "4", lat: 40.706, lng: -73.998, label: "Lisa T.", type: "provider", detail: "Painter • ⭐ 4.6 • 1.1 mi" },
  { id: "5", lat: 40.72, lng: -73.995, label: "David K.", type: "provider", detail: "General • ⭐ 4.9 • 1.3 mi" },
];

const providerDetails = [
  { id: "1", name: "John Davis", skill: "Electrician", rating: 4.9, jobs: 127, distance: "0.3 mi", eta: "8 min" },
  { id: "2", name: "Angela Wu", skill: "Plumber", rating: 4.8, jobs: 98, distance: "0.5 mi", eta: "12 min" },
  { id: "3", name: "Carlos Mendez", skill: "HVAC Technician", rating: 4.7, jobs: 64, distance: "0.8 mi", eta: "15 min" },
  { id: "4", name: "Lisa Torres", skill: "Painter", rating: 4.6, jobs: 43, distance: "1.1 mi", eta: "20 min" },
  { id: "5", name: "David Kim", skill: "General Contractor", rating: 4.9, jobs: 210, distance: "1.3 mi", eta: "22 min" },
];

const ClientMap = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const detail = providerDetails.find((p) => p.id === selected);

  return (
    <div className="relative flex min-h-screen flex-col bg-background pb-20">
      {/* Map */}
      <MockMap
        markers={providers}
        center={[40.7128, -74.006]}
        zoom={14}
        className="h-[60vh]"
        onMarkerClick={(m) => m.type === "provider" && setSelected(m.id)}
      />

      {/* Provider list */}
      <div className="flex-1 -mt-4 rounded-t-3xl border-t border-border bg-background px-6 pt-5 z-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          Nearby Providers <span className="text-sm font-normal text-muted-foreground">({providers.length - 1})</span>
        </h2>
        <div className="space-y-2">
          {providerDetails.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${selected === p.id ? "border-accent bg-accent/5" : "border-border bg-card"}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {p.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{p.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{p.skill}</span>
                  <span>•</span>
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  <span>{p.rating}</span>
                  <span>•</span>
                  <span>{p.distance}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-accent">ETA {p.eta}</p>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected provider bottom sheet */}
      <AnimatePresence>
        {detail && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-16 left-0 right-0 z-30 mx-4 rounded-2xl border border-accent/30 bg-card p-5 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-lg font-bold text-accent">
                {detail.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <p className="font-display font-semibold text-foreground">{detail.name}</p>
                <p className="text-sm text-muted-foreground">{detail.skill}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                    <span className="text-sm font-medium text-foreground">{detail.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">({detail.jobs} jobs)</span>
                  <span className="text-xs text-muted-foreground">• {detail.distance}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setSelected(null)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-foreground transition-all hover:bg-secondary">
                Close
              </button>
              <button onClick={() => navigate("/client/request")} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90">
                Request Service
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav variant="client" items={[
        { icon: Home, label: "Home", path: "/client/dashboard" },
        { icon: Calendar, label: "Bookings", path: "/client/bookings" },
        { icon: Map, label: "Map", path: "/client/map", active: true },
        { icon: User, label: "Profile", path: "/client/profile" },
      ]} />
    </div>
  );
};

export default ClientMap;
