import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Hash, MapPin, Users } from "lucide-react";

interface Props { onNext: () => void; }

const StepBusiness = ({ onNext }: Props) => {
  const [form, setForm] = useState({ companyName: "", ein: "", address: "", employees: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = "Required";
    if (!form.ein.trim()) e.ein = "Required";
    if (!form.address.trim()) e.address = "Required";
    if (!form.employees.trim()) e.employees = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate()) onNext(); };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const fieldConfig = [
    { key: "companyName", label: "Company Name", placeholder: "Maximus HVAC LLC", icon: Building2 },
    { key: "ein", label: "EIN (Tax ID)", placeholder: "XX-XXXXXXX", icon: Hash },
    { key: "address", label: "Business Address", placeholder: "123 Business Ave, City, State", icon: MapPin },
    { key: "employees", label: "Number of Employees", placeholder: "e.g. 5", icon: Users, type: "number" },
  ];

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="font-display text-xl font-bold text-foreground">Business Information</h3>
        <p className="text-sm text-muted-foreground">Tell us about your company</p>
      </div>

      {fieldConfig.map(({ key, label, placeholder, icon: Icon, type }) => (
        <div key={key}>
          <Label className="mb-1.5 text-sm text-muted-foreground">{label}</Label>
          <div className="relative">
            <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type={type || "text"}
              placeholder={placeholder}
              value={form[key as keyof typeof form]}
              onChange={(e) => update(key, e.target.value)}
              className="h-12 rounded-xl border-border bg-card pl-10 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          {errors[key] && <p className="mt-1 text-xs text-destructive">{errors[key]}</p>}
        </div>
      ))}

      <Button
        onClick={handleNext}
        className="mt-6 h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange"
      >
        Continue
      </Button>
    </div>
  );
};

export default StepBusiness;
