import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useChatMessages, useSendMessage, markChatRead } from "@/hooks/chat";

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookingId } = useParams();
  const messagesQ = useChatMessages(bookingId);
  const sendMut = useSendMessage();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const messages = messagesQ.data ?? [];

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    if (bookingId) markChatRead(bookingId);
  }, [messages.length, bookingId]);

  const send = async () => {
    if (!input.trim() || !bookingId) return;
    try {
      await sendMut.mutateAsync({ booking_id: bookingId, content: input });
      setInput("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    }
  };

  const otherName = (() => {
    const first = messages.find((m) => m.sender_id !== user?.id);
    return (first?.sender as { full_name?: string } | null)?.full_name ?? "Chat";
  })();
  const initials = otherName.split(" ").filter(Boolean).map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">{initials}</div>
          <div>
            <p className="text-sm font-semibold text-foreground">{otherName}</p>
            <p className="text-[10px] text-green-500">Live</p>
          </div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messagesQ.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="pt-12 text-center text-sm text-muted-foreground">
            No messages yet. Say hi 👋
          </div>
        ) : (
          messages.map((msg) => {
            const mine = msg.sender_id === user?.id;
            const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${mine ? "bg-accent text-accent-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"}`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-accent-foreground/60" : "text-muted-foreground"}`}>{time}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message..."
            className="h-11 flex-1 rounded-xl border-border bg-secondary text-foreground"
            disabled={sendMut.isPending}
          />
          <button
            onClick={send}
            disabled={sendMut.isPending || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground disabled:opacity-60"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
