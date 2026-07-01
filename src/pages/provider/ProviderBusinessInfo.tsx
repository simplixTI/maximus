import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const ProviderBusinessInfo = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company: "Davis Electrical Services",
    ein: "12-3456789",
    address: "100 Commerce St, New York, NY 10001",
    employees: "5",
  });

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="font-display text-xl font-bold text-foreground">Business Information</h1>
      </div>
      <div className="px-6 space-y-5">
        <div className="flex items-center gap-2 rounded-xl bg-green-500/10 p-3">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-500 font-medium">Verified Business</span>
        </div>
        <div className="space-y-4">
          {[
            { label: "Company Name", key: "company" as const },
            { label: "EIN (Tax ID)", key: "ein" as const },
            { label: "Business Address", key: "address" as const },
            { label: "Number of Employees", key: "employees" as const },
          ].map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="text-foreground">{field.label}</Label>
              <Input value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="h-12 rounded-xl border-border bg-secondary text-foreground" />
            </div>
          ))}
        </div>
        <Button onClick={() => { toast({ title: "Business info updated" }); navigate(-1); }} className="h-14 w-full rounded-2xl bg-accent font-semibold text-accent-foreground">Save Changes</Button>
      </div>
    </div>
  );
};

export default ProviderBusinessInfo;
