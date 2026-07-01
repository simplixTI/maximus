import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Car } from "lucide-react";

interface Props { onNext: () => void; }

const StepVehicle = ({ onNext }: Props) => {
  const [hasVehicle, setHasVehicle] = useState(false);
  const [form, setForm] = useState({ plate: "", make: "", model: "", year: "" });

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="font-display text-xl font-bold text-foreground">Vehicle Information</h3>
        <p className="text-sm text-muted-foreground">Do you have a service vehicle?</p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <Car className="h-6 w-6 text-accent" />
          <div>
            <p className="font-semibold text-foreground">I own a vehicle</p>
            <p className="text-sm text-muted-foreground">Used for service calls</p>
          </div>
        </div>
        <Switch checked={hasVehicle} onCheckedChange={setHasVehicle} />
      </div>

      {hasVehicle && (
        <div className="space-y-4 pt-2">
          {[
            { key: "plate", label: "License Plate Number", placeholder: "ABC-1234" },
            { key: "make", label: "Vehicle Make", placeholder: "e.g. Ford" },
            { key: "model", label: "Vehicle Model", placeholder: "e.g. F-150" },
            { key: "year", label: "Vehicle Year", placeholder: "e.g. 2022", type: "number" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <Label className="mb-1.5 text-sm text-muted-foreground">{label}</Label>
              <Input
                type={type || "text"}
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="h-12 rounded-xl border-border bg-card text-foreground placeholder:text-muted-foreground"
              />
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={onNext}
        className="mt-6 h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange"
      >
        Continue
      </Button>
    </div>
  );
};

export default StepVehicle;
