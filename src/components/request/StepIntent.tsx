import { Zap, FileText, Search } from "lucide-react";

const INTENTS = [
  {
    id: "asap",
    label: "I need it ASAP",
    desc: "Emergency or urgent service needed now",
    icon: Zap,
    accent: true,
  },
  {
    id: "quote",
    label: "Get a Quote",
    desc: "Receive pricing before committing",
    icon: FileText,
    accent: false,
  },
  {
    id: "inspection",
    label: "Book an Inspection",
    desc: "Have a professional assess the issue",
    icon: Search,
    accent: false,
  },
];

interface Props {
  selected: string;
  onSelect: (value: string) => void;
}

const StepIntent = ({ selected, onSelect }: Props) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-display text-xl font-bold text-foreground">What do you need?</h3>
      <p className="mt-1 text-sm text-muted-foreground">Choose how you'd like to proceed</p>
    </div>

    <div className="flex flex-col gap-3">
      {INTENTS.map((intent) => {
        const Icon = intent.icon;
        const active = selected === intent.id;
        return (
          <button
            key={intent.id}
            onClick={() => onSelect(intent.id)}
            className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-5 text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
              active
                ? "border-accent bg-accent/10 shadow-orange"
                : intent.accent
                ? "border-accent/30 bg-card hover:border-accent"
                : "border-border bg-card hover:border-accent/50"
            }`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              intent.accent ? "bg-gradient-orange" : "bg-secondary"
            }`}>
              <Icon className={`h-6 w-6 ${intent.accent ? "text-accent-foreground" : "text-accent"}`} />
            </div>
            <div>
              <div className="font-display font-semibold text-foreground">{intent.label}</div>
              <div className="mt-0.5 text-sm text-muted-foreground">{intent.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default StepIntent;
