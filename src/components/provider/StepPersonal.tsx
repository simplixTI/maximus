import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, Camera } from "lucide-react";

interface Props { onNext: () => void; }

const StepPersonal = ({ onNext }: Props) => {
  const [form, setForm] = useState({ legalName: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.legalName.trim()) e.legalName = "Required";
    if (form.phone.replace(/\D/g, "").length < 10) e.phone = "Valid phone required";
    if (!form.email.includes("@")) e.email = "Valid email required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="font-display text-xl font-bold text-foreground">Personal Information</h3>
        <p className="text-sm text-muted-foreground">Your identity and contact details</p>
      </div>

      {/* Profile Photo (required) */}
      <div className="mb-6 flex flex-col items-center">
        <button className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-accent bg-secondary transition-colors hover:bg-accent/10">
          <Camera className="h-8 w-8 text-accent" />
        </button>
        <span className="mt-2 text-xs text-accent">Profile photo required *</span>
      </div>

      {[
        { key: "legalName", label: "Full Legal Name", placeholder: "As it appears on your ID", icon: User },
        { key: "phone", label: "Phone Number", placeholder: "(555) 123-4567", icon: Phone, type: "tel" },
        { key: "email", label: "Email Address", placeholder: "you@company.com", icon: Mail, type: "email" },
      ].map(({ key, label, placeholder, icon: Icon, type }) => (
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
        onClick={() => { if (validate()) onNext(); }}
        className="mt-6 h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange"
      >
        Continue
      </Button>
    </div>
  );
};

export default StepPersonal;
