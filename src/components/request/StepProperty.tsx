import { Home, Building2, Factory, Warehouse } from "lucide-react";

const PROPERTY_TYPES = [
  { id: "residential", label: "Residential", desc: "House, apartment, condo", icon: Home },
  { id: "commercial", label: "Commercial", desc: "Office, retail, restaurant", icon: Building2 },
  { id: "industrial", label: "Industrial", desc: "Warehouse, factory, plant", icon: Factory },
  { id: "multi-family", label: "Multi-Family", desc: "Duplex, townhome, complex", icon: Warehouse },
];

interface Props {
  selected: string;
  onSelect: (value: string) => void;
}

const StepProperty = ({ selected, onSelect }: Props) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-display text-xl font-bold text-foreground">What type of property?</h3>
      <p className="mt-1 text-sm text-muted-foreground">Select the property that needs service</p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {PROPERTY_TYPES.map((type) => {
        const Icon = type.icon;
        const active = selected === type.id;
        return (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all hover:scale-[1.02] active:scale-[0.98] ${
              active
                ? "border-accent bg-accent/10 shadow-orange"
                : "border-border bg-card hover:border-accent/50"
            }`}
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${
              active ? "bg-accent/20" : "bg-secondary"
            }`}>
              <Icon className={`h-7 w-7 ${active ? "text-accent" : "text-muted-foreground"}`} />
            </div>
            <div>
              <div className="font-display text-sm font-semibold text-foreground">{type.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{type.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default StepProperty;
