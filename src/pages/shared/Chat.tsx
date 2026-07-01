import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Input } from "@/components/ui/input";

const mockMessages = [
  { id: "1", sender: "provider", text: "Hi! I'm on my way to your location.", time: "9:45 AM" },
  { id: "2", sender: "client", text: "Great, thank you! The gate code is 1234.", time: "9:46 AM" },
  { id: "3", sender: "provider", text: "Got it. ETA about 15 minutes.", time: "9:47 AM" },
  { id: "4", sender: "client", text: "Perfect. I'll be at the front door.", time: "9:48 AM" },
];

const Chat = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), sender: "client", text: input, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">JD</div>
          <div>
            <p className="text-sm font-semibold text-foreground">John Davis</p>
            <p className="text-[10px] text-green-500">Online</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.sender === "client" ? "bg-accent text-accent-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"}`}>
              <p className="text-sm">{msg.text}</p>
              <p className={`mt-1 text-[10px] ${msg.sender === "client" ? "text-accent-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message..."
            className="h-11 flex-1 rounded-xl border-border bg-secondary text-foreground"
          />
          <button onClick={send} className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
