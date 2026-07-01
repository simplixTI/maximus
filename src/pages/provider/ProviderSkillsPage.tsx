import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const allSkills = [
  { name: "Electrical", license: "Electrical License", hasLicense: true },
  { name: "Plumbing", license: "Plumbing License", hasLicense: true },
  { name: "HVAC", license: "EPA 608 Cert", hasLicense: false },
  { name: "Carpentry", license: null, hasLicense: false },
  { name: "Painting", license: null, hasLicense: false },
  { name: "Roofing", license: null, hasLicense: false },
  { name: "Landscaping", license: null, hasLicense: false },
  { name: "General Maintenance", license: null, hasLicense: false },
];

const ProviderSkills = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>(["Electrical", "Plumbing"]);

  const toggle = (name: string) => {
    setSelected((prev) => prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="font-display text-xl font-bold text-foreground">Skills & Services</h1>
      </div>
      <div className="px-6 space-y-3">
        {allSkills.map((skill) => {
          const isSelected = selected.includes(skill.name);
          return (
            <div key={skill.name} className={`rounded-2xl border p-4 transition-colors ${isSelected ? "border-accent bg-accent/5" : "border-border bg-card"}`}>
              <button onClick={() => toggle(skill.name)} className="flex w-full items-center justify-between">
                <span className="text-sm font-medium text-foreground">{skill.name}</span>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${isSelected ? "bg-accent" : "border border-border"}`}>
                  {isSelected && <CheckCircle className="h-4 w-4 text-accent-foreground" />}
                </div>
              </button>
              {isSelected && skill.license && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-secondary p-3">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{skill.license}: </span>
                  {skill.hasLicense ? (
                    <span className="text-xs text-green-500 font-medium">Uploaded ✓</span>
                  ) : (
                    <button className="text-xs text-accent font-medium">Upload</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <Button onClick={() => { toast({ title: "Skills updated" }); navigate(-1); }} className="h-14 w-full rounded-2xl bg-accent font-semibold text-accent-foreground mt-4">Save Changes</Button>
      </div>
    </div>
  );
};

export default ProviderSkills;
