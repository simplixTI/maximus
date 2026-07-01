import { useNavigate } from "react-router-dom";
import { Home, Calendar, Map, User, MapPin, ChevronRight, Clock, FileText, Check, X } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import ListSkeleton from "@/components/shared/ListSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import PageTransition from "@/components/shared/PageTransition";
import AnimatedList from "@/components/shared/AnimatedList";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMyBookings, useMyPendingQuotes, useAcceptQuote } from "@/hooks/data";
import { formatDistanceToNow } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-primary/15 text-primary",
  en_route: "bg-primary/15 text-primary",
  arrived: "bg-primary/15 text-primary",
  in_progress: "bg-primary/15 text-primary",
  completed: "bg-green-500/15 text-green-500",
  cancelled: "bg-destructive/15 text-destructive",
};

const ClientBookings = () => {
  const navigate = useNavigate();
  const bookingsQ = useMyBookings();
  const quotesQ = useMyPendingQuotes();
  const acceptMutation = useAcceptQuote();

  const bookings = bookingsQ.data ?? [];
  const quotes = quotesQ.data ?? [];
  const loading = bookingsQ.isLoading || quotesQ.isLoading;

  const handleAccept = async (q: { id: string; request_id: string }) => {
    try {
      await acceptMutation.mutateAsync({ id: q.id, request_id: q.request_id });
      toast.success("Quote accepted — booking confirmed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to accept quote");
    }
  };

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background pb-20">
      <div className="px-6 pt-8 pb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quotes, active jobs, and history</p>
      </div>

      {quotes.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-accent">
            Quotes to Review ({quotes.length})
          </h2>
          <AnimatedList className="space-y-3">
            {quotes.map((q) => {
              const req = q.request as { id: string; category: string; description: string; address: string };
              return (
                <div key={q.id} className="rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 to-transparent p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold text-foreground capitalize">{req.category}</p>
                    </div>
                    <p className="font-display text-2xl font-bold text-accent">${Number(q.amount).toFixed(0)}</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{req.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{q.scope}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      onClick={() => handleAccept({ id: q.id, request_id: req.id })}
                      disabled={acceptMutation.isPending}
                      className="h-10 flex-1 gap-1.5 rounded-xl bg-gradient-orange font-semibold text-accent-foreground shadow-orange"
                    >
                      <Check className="h-4 w-4" /> Accept & Book
                    </Button>
                    <Button variant="outline" className="h-10 rounded-xl border-border">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </AnimatedList>
        </div>
      )}

      <div className="px-6">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          All Bookings
        </h2>
        {loading ? (
          <ListSkeleton count={3} variant="job" />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No bookings yet"
            description="Your service requests and bookings will appear here once you request your first service."
            actionLabel="Request a Service"
            onAction={() => navigate("/client/request")}
          />
        ) : (
          <AnimatedList className="space-y-3">
            {bookings.map((b) => {
              const req = (b as { request?: { category?: string; address?: string } }).request;
              return (
                <button
                  key={b.id}
                  onClick={() => navigate(`/client/bookings/${b.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-accent/30 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground capitalize">{req?.category ?? "Service"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                    </p>
                    {req?.address && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{req.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[b.status] ?? "bg-secondary text-foreground"}`}>
                      {b.status.replace("_", " ")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </AnimatedList>
        )}
      </div>

      <BottomNav variant="client" items={[
        { icon: Home, label: "Home", path: "/client/dashboard" },
        { icon: Calendar, label: "Bookings", path: "/client/bookings", active: true },
        { icon: Map, label: "Map", path: "/client/map" },
        { icon: User, label: "Profile", path: "/client/profile" },
      ]} />
    </PageTransition>
  );
};

export default ClientBookings;
