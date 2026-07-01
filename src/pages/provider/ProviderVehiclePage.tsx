import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

const ProviderVehicle = () => {
  const navigate = useNavigate();
  const [hasVehicle, setHasVehicle] = useState(true);
  const [form, setForm] = useState({ plate: "ABC 1234", make: "Ford", model: "F-150", year: "2022" });

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="font-display text-xl font-bold text-foreground">Vehicle Information</h1>
      </div>
      <div className="px-6 space-y-5">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-foreground">I have a vehicle</span>
          </div>
          <Switch checked={hasVehicle} onCheckedChange={setHasVehicle} />
        </div>
        {hasVehicle && (
          <div className="space-y-4">
            {[
              { label: "License Plate", key: "plate" as const },
              { label: "Make", key: "make" as const },
              { label: "Model", key: "model" as const },
              { label: "Year", key: "year" as const },
            ].map((field) => (
              <div key={field.key} className="space-y-2">
                <Label className="text-foreground">{field.label}</Label>
                <Input value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="h-12 rounded-xl border-border bg-secondary text-foreground" />
              </div>
            ))}
          </div>
        )}
        <Button onClick={() => { toast({ title: "Vehicle info updated" }); navigate(-1); }} className="h-14 w-full rounded-2xl bg-accent font-semibold text-accent-foreground">Save Changes</Button>
      </div>
    </div>
  );
};

export default ProviderVehicle;
