import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, X, AlertCircle } from "lucide-react";

interface Props { onNext: () => void; }

const SKILLS = [
  { id: "hvac", label: "HVAC", icon: "❄️", requiresLicense: "EPA 608 Certification" },
  { id: "plumbing", label: "Plumbing", icon: "🔧", requiresLicense: "Plumbing License" },
  { id: "electrical", label: "Electrical", icon: "⚡", requiresLicense: "Electrical License" },
  { id: "landscaping", label: "Landscaping / Lawn", icon: "🌿" },
  { id: "pool", label: "Pool Cleaning", icon: "🏊" },
  { id: "airduct", label: "Air Duct Cleaning", icon: "💨" },
  { id: "pressure", label: "Pressure Washing", icon: "🚿" },
  { id: "handyman", label: "General Handyman", icon: "🔨" },
  { id: "painting", label: "Painting", icon: "🎨" },
  { id: "flooring", label: "Flooring", icon: "🏠" },
  { id: "roofing", label: "Roofing", icon: "🏗️" },
  { id: "pest", label: "Pest Control", icon: "🐛" },
];

const StepSkills = ({ onNext }: Props) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<Record<string, string>>({});

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const skillsRequiringLicense = SKILLS.filter((s) => s.requiresLicense && selected.includes(s.id));
  const allLicensesUploaded = skillsRequiringLicense.every((s) => licenses[s.id]);

  const handleLicenseUpload = (skillId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLicenses((l) => ({ ...l, [skillId]: file.name }));
  };

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="font-display text-xl font-bold text-foreground">Skills & Licenses</h3>
        <p className="text-sm text-muted-foreground">Select all services you can provide</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SKILLS.map((skill) => (
          <button
            key={skill.id}
            onClick={() => toggle(skill.id)}
            className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
              selected.includes(skill.id)
                ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                : "border-border bg-card hover:border-accent/50"
            }`}
          >
            <Checkbox checked={selected.includes(skill.id)} className="pointer-events-none" />
            <span className="text-lg">{skill.icon}</span>
            <span className="text-sm font-medium text-foreground">{skill.label}</span>
          </button>
        ))}
      </div>

      {/* License uploads for selected skills that require them */}
      {skillsRequiringLicense.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3">
            <AlertCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <p className="text-xs text-accent">
              The following skills require a license upload to proceed.
            </p>
          </div>

          {skillsRequiringLicense.map((skill) => (
            <div key={skill.id} className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-sm font-medium text-foreground">
                {skill.icon} {skill.requiresLicense}
              </p>
              {licenses[skill.id] ? (
                <div className="flex items-center gap-2 rounded-lg bg-secondary p-2">
                  <FileText className="h-4 w-4 text-accent" />
                  <span className="flex-1 truncate text-sm text-foreground">{licenses[skill.id]}</span>
                  <button onClick={() => setLicenses((l) => { const n = { ...l }; delete n[skill.id]; return n; })}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 hover:border-accent">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload license</span>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleLicenseUpload(skill.id, e)} className="hidden" />
                </label>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={onNext}
        disabled={selected.length === 0 || !allLicensesUploaded}
        className="mt-6 h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange disabled:opacity-50"
      >
        Submit Application
      </Button>
    </div>
  );
};

export default StepSkills;
