import { useEffect, useState } from "react";
import {
  Circle,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  User,
  Wrench,
  DollarSign,
  Clock,
  Send,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useBookingStatusEvents, useAdminSendClientMessage } from "@/hooks/data";
import { useNavigate } from "react-router-dom";

type Booking = {
  id: string;
  status: string;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  client_id: string;
  provider_id?: string | null;
  client?: {
    id?: string;
    full_name?: string;
    email?: string;
    phone?: string;
  } | null;
  provider?: {
    business_name?: string;
    rating_avg?: number;
    user?: { full_name?: string; phone?: string; email?: string } | null;
  } | null;
  request?: {
    id?: string;
    category?: string;
    description?: string;
    address?: string;
  } | null;
  quote?: { amount?: number | string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  confirmed: "hsl(213, 70%, 55%)",
  en_route: "hsl(38, 90%, 55%)",
  arrived: "hsl(268, 75%, 65%)",
  in_progress: "hsl(200, 80%, 60%)",
  completed: "hsl(150, 65%, 55%)",
  cancelled: "hsl(0, 84%, 60%)",
};

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const JobDetailDrawer = ({
  booking,
  open,
  onOpenChange,
}: {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const events = useBookingStatusEvents(booking?.id);
  const sendMsg = useAdminSendClientMessage();
  const [messages, setMessages] = useState<{ id: string; sender_id: string; content: string; created_at: string }[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("Update on your job");
  const [broadcastBody, setBroadcastBody] = useState("");

  useEffect(() => {
    if (!booking?.id || !open) return;
    let cancelled = false;
    supabase
      .from("chat_messages")
      .select("id, sender_id, content, created_at")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: true })
      .limit(20)
      .then(({ data }) => {
        if (!cancelled && data) setMessages(data);
      });

    const channel = supabase
      .channel(`admin-chat-${booking.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `booking_id=eq.${booking.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as never]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [booking?.id, open]);

  if (!booking) return null;
  const amount = typeof booking.quote?.amount === "string" ? parseFloat(booking.quote.amount) : booking.quote?.amount ?? 0;
  const clientName = booking.client?.full_name ?? "Client";
  const providerName = booking.provider?.user?.full_name ?? booking.provider?.business_name ?? "—";
  const eventList = events.data ?? [];

  const sendAdminChat = async () => {
    if (!msgInput.trim() || !user) return;
    const { error } = await supabase.from("chat_messages").insert({
      booking_id: booking.id,
      sender_id: user.id,
      content: `[Admin] ${msgInput.trim()}`,
    });
    if (error) toast.error(error.message);
    else setMsgInput("");
  };

  const sendBroadcast = async () => {
    if (!broadcastBody.trim() || !booking.client_id) return;
    await sendMsg.mutateAsync({
      client_id: booking.client_id,
      phone: booking.client?.phone,
      email: booking.client?.email,
      full_name: booking.client?.full_name,
      title: broadcastTitle,
      body: broadcastBody,
    });
    toast.success("Message sent to client");
    setBroadcastBody("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto border-l-border bg-background p-0">
        <SheetHeader className="border-b border-border bg-card/40 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Booking · {booking.id.slice(0, 8)}
              </p>
              <SheetTitle className="mt-0.5 font-display text-lg font-bold capitalize text-foreground">
                {booking.request?.category ?? "Service"}
              </SheetTitle>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {booking.request?.description ?? "—"}
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize"
              style={{
                background: `${STATUS_COLOR[booking.status] ?? "hsl(220, 15%, 15%)"}20`,
                color: STATUS_COLOR[booking.status] ?? "hsl(220, 10%, 60%)",
              }}
            >
              {booking.status.replace("_", " ")}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span className="font-medium text-foreground tabular-nums">${amount.toFixed(2)}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {relTime(booking.created_at)}
            </span>
            {booking.request?.address && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{booking.request.address}</span>
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card/60 p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <User className="h-3 w-3" /> Client
              </div>
              <p className="mt-1 text-sm font-medium text-foreground truncate">{clientName}</p>
              {booking.client?.phone && (
                <a
                  href={`tel:${booking.client.phone}`}
                  className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-accent"
                >
                  <Phone className="h-3 w-3" /> {booking.client.phone}
                </a>
              )}
              {booking.client?.email && (
                <a
                  href={`mailto:${booking.client.email}`}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-accent truncate"
                >
                  <Mail className="h-3 w-3" /> {booking.client.email}
                </a>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Wrench className="h-3 w-3" /> Provider
              </div>
              <p className="mt-1 text-sm font-medium text-foreground truncate">{providerName}</p>
              {booking.provider?.rating_avg !== undefined && booking.provider.rating_avg > 0 && (
                <p className="text-[11px] text-muted-foreground">★ {Number(booking.provider.rating_avg).toFixed(1)}</p>
              )}
              {booking.provider?.user?.phone && (
                <a
                  href={`tel:${booking.provider.user.phone}`}
                  className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-accent"
                >
                  <Phone className="h-3 w-3" /> {booking.provider.user.phone}
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Timeline</p>
            <div className="rounded-xl border border-border bg-card/60 p-4">
              {eventList.length === 0 ? (
                <p className="text-xs text-muted-foreground">No status changes yet.</p>
              ) : (
                <ol className="relative space-y-3">
                  {eventList.map((e, i) => {
                    const color = STATUS_COLOR[e.status] ?? "hsl(220, 10%, 60%)";
                    return (
                      <li key={e.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <Circle className="h-3 w-3 shrink-0" style={{ color, fill: color }} />
                          {i < eventList.length - 1 && (
                            <span className="mt-1 h-full w-px flex-1 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="text-xs font-medium capitalize text-foreground">
                            {e.status.replace("_", " ")}
                          </p>
                          {e.notes && <p className="text-[11px] text-muted-foreground">{e.notes}</p>}
                          <p className="text-[10px] text-muted-foreground">{relTime(e.created_at)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Chat</p>
              <button
                onClick={() => navigate(`/chat/${booking.id}`)}
                className="text-[11px] text-accent hover:underline"
              >
                Open full chat →
              </button>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-3">
              <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">No messages yet.</p>
                ) : (
                  messages.slice(-8).map((m) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-xs ${
                            isMe ? "bg-accent/15 text-foreground" : "bg-secondary text-foreground"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendAdminChat()}
                  placeholder="Send message as [Admin]…"
                  className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                />
                <Button
                  onClick={sendAdminChat}
                  disabled={!msgInput.trim()}
                  size="sm"
                  className="h-9 rounded-lg bg-accent px-3 text-accent-foreground disabled:opacity-40"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Notify client (SMS + email + in-app)
            </p>
            <div className="space-y-2 rounded-xl border border-border bg-card/60 p-3">
              <input
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Title"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
              />
              <Textarea
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="Message body…"
                className="min-h-[72px] rounded-lg border-border bg-background text-xs text-foreground"
              />
              <Button
                onClick={sendBroadcast}
                disabled={!broadcastBody.trim() || sendMsg.isPending}
                size="sm"
                className="gap-1.5 rounded-lg bg-gradient-orange text-accent-foreground"
              >
                <Send className="h-3.5 w-3.5" />
                {sendMsg.isPending ? "Sending…" : "Send to client"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default JobDetailDrawer;
