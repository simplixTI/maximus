import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, Star, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBooking, useUpdateBookingStatus, useReviewForBooking } from "@/hooks/data";
import ReviewModal from "@/components/shared/ReviewModal";
import { useBookingProviderLocation } from "@/hooks/tracking";
import { useUnreadMessageCount } from "@/hooks/chat";
import { toast } from "sonner";

const providerIcon = L.divIcon({
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(249,115,22,0.4);border:3px solid #000;">
    <div style="width:10px;height:10px;border-radius:50%;background:#fff;"></div>
  </div>`,
});

const clientIcon = L.divIcon({
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  html: `<div style="width:24px;height:24px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
});

const STATUS_STEPS = ["confirmed", "en_route", "arrived", "in_progress", "completed"] as const;
type Status = (typeof STATUS_STEPS)[number];

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

const ClientTracking = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const unreadMessages = useUnreadMessageCount(id);
  const existingReview = useReviewForBooking(id);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const bookingQ = useBooking(id);
  const { location: providerLoc } = useBookingProviderLocation(id);
  const cancelMut = useUpdateBookingStatus();

  const status = ((bookingQ.data?.status as Status | undefined) ?? "confirmed") as Status;
  const stepIndex = STATUS_STEPS.indexOf(status);
  const req = (bookingQ.data as { request?: { address?: string } } | null | undefined)?.request;

  const center = useMemo(() => {
    if (providerLoc) return { lat: providerLoc.lat, lng: providerLoc.lng };
    return { lat: 40.7128, lng: -74.006 };
  }, [providerLoc]);

  const doCancel = async () => {
    if (!id) return;
    try {
      await cancelMut.mutateAsync({ booking_id: id, status: "cancelled" });
      toast.success("Booking cancelled");
      setCancelOpen(false);
      navigate("/client/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cancel failed");
    }
  };

  if (bookingQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="relative h-[55vh]">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {providerLoc && (
            <>
              <Marker position={[providerLoc.lat, providerLoc.lng]} icon={providerIcon}>
                <Popup>Your provider</Popup>
              </Marker>
              <Recenter lat={providerLoc.lat} lng={providerLoc.lng} />
            </>
          )}
          <Marker position={[center.lat, center.lng]} icon={clientIcon}>
            <Popup>You</Popup>
          </Marker>
        </MapContainer>
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-8 z-[500] flex h-10 w-10 items-center justify-center rounded-full bg-card/90 backdrop-blur text-foreground shadow-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-1 -mt-6 rounded-t-3xl border-t border-border bg-card px-6 pt-6 pb-8 z-10"
      >
        {status !== "completed" && status !== "cancelled" && (
          <div className="mb-5 flex items-center gap-1">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors duration-500 ${i <= stepIndex ? "bg-accent" : "bg-border"}`} />
                <p className={`mt-1 text-center text-[9px] font-medium transition-colors capitalize ${i <= stepIndex ? "text-accent" : "text-muted-foreground"}`}>
                  {s.replace("_", " ")}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-lg font-bold text-accent">
            {providerLoc ? "P" : "…"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">
              {providerLoc ? "Your provider" : "Finding a provider…"}
            </p>
            <div className="flex items-center gap-1 text-sm min-w-0">
              <Star className="h-3 w-3 fill-accent text-accent shrink-0" />
              <span className="text-foreground">Verified</span>
              {req?.address && (
                <>
                  <span className="mx-1 text-border">•</span>
                  <span className="text-muted-foreground truncate">{req.address}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {status !== "completed" && (
          <motion.div initial={{ scale: 1.05 }} animate={{ scale: 1 }} className="mt-3 rounded-xl bg-accent/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Current status</p>
            <p className="text-2xl font-bold text-accent capitalize">{status.replace("_", " ")}</p>
          </motion.div>
        )}

        <div className="mt-4 flex gap-3">
          <Button variant="outline" className="h-12 flex-1 gap-2 rounded-xl border-border text-foreground">
            <Phone className="h-4 w-4" /> Call
          </Button>
          <Button
            onClick={() => navigate(`/chat/${id}`)}
            className="relative h-12 flex-1 gap-2 rounded-xl bg-accent text-accent-foreground"
          >
            <MessageCircle className="h-4 w-4" /> Message
            {unreadMessages > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
                <span className="relative tabular-nums">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              </span>
            )}
          </Button>
        </div>

        {status === "completed" && (() => {
          const providerId = (bookingQ.data as { provider_id?: string | null } | null | undefined)?.provider_id;
          const alreadyReviewed = !!existingReview.data;
          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 to-accent/[0.03] p-4"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {alreadyReviewed ? "Thanks for reviewing!" : "How was the service?"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {alreadyReviewed
                      ? "Your feedback helps other clients pick great providers."
                      : "Take 10 seconds to rate and share a note."}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setReviewOpen(true)}
                disabled={alreadyReviewed || !providerId}
                className="mt-3 h-11 w-full gap-2 rounded-xl bg-gradient-orange font-display font-semibold text-accent-foreground shadow-orange disabled:opacity-50"
              >
                <Star className="h-4 w-4 fill-current" />
                {alreadyReviewed ? "Already reviewed" : "Rate & Review"}
              </Button>
            </motion.div>
          );
        })()}

        {status !== "completed" && status !== "cancelled" && (
          <Button
            variant="ghost"
            onClick={() => setCancelOpen(true)}
            className="mt-3 h-10 w-full text-destructive hover:bg-destructive/10"
          >
            Cancel Service
          </Button>
        )}
      </motion.div>

      <ReviewModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        providerName="your provider"
        bookingId={id}
        revieweeId={(bookingQ.data as { provider_id?: string | null } | null | undefined)?.provider_id ?? undefined}
      />

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Cancel Service?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure? Cancellation fees may apply if the provider is already en route.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setCancelOpen(false)} className="flex-1 rounded-xl border-border text-foreground">
              Keep
            </Button>
            <Button
              onClick={doCancel}
              disabled={cancelMut.isPending}
              className="flex-1 rounded-xl bg-destructive text-destructive-foreground"
            >
              {cancelMut.isPending ? "Cancelling…" : "Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientTracking;
