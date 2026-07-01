import { useState } from "react";
import { Camera, X, AlertTriangle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ServiceRequestData } from "@/pages/client/ServiceRequest";

const CATEGORIES = [
  "Plumbing", "Electrical", "HVAC", "Roofing", "Painting",
  "Flooring", "Landscaping", "Cleaning", "Pest Control",
  "Carpentry", "Appliance Repair", "General Maintenance",
];

const URGENCY_LEVELS = [
  { id: "emergency", label: "Emergency", desc: "Within hours", icon: AlertTriangle, color: "text-destructive" },
  { id: "urgent", label: "Urgent", desc: "Within 24h", icon: AlertCircle, color: "text-accent" },
  { id: "standard", label: "Standard", desc: "Within a week", icon: Clock, color: "text-muted-foreground" },
];

interface Props {
  data: ServiceRequestData;
  update: (partial: Partial<ServiceRequestData>) => void;
  onNext: () => void;
}

const StepDetails = ({ data, update, onNext }: Props) => {
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    const cats = data.categories.includes(cat)
      ? data.categories.filter((c) => c !== cat)
      : [...data.categories, cat];
    update({ categories: cats });
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    update({ photos: [...data.photos, ...files] });
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setPhotoPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (idx: number) => {
    update({ photos: data.photos.filter((_, i) => i !== idx) });
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const isValid = data.categories.length > 0 && data.description.trim().length >= 10 && data.urgency;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl font-bold text-foreground">Service Details</h3>
        <p className="mt-1 text-sm text-muted-foreground">Tell us what you need help with</p>
      </div>

      {/* Categories */}
      <div>
        <Label className="mb-2 block text-sm text-muted-foreground">Service Categories</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = data.categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-card text-muted-foreground hover:border-accent/50"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <Label className="mb-2 block text-sm text-muted-foreground">
          Describe the issue <span className="text-xs">({data.description.length}/500)</span>
        </Label>
        <Textarea
          placeholder="E.g. Kitchen faucet leaking, water pooling under sink..."
          value={data.description}
          onChange={(e) => update({ description: e.target.value.slice(0, 500) })}
          className="min-h-[100px] rounded-xl border-border bg-card text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Urgency */}
      <div>
        <Label className="mb-2 block text-sm text-muted-foreground">Urgency Level</Label>
        <div className="flex gap-2">
          {URGENCY_LEVELS.map((level) => {
            const Icon = level.icon;
            const active = data.urgency === level.id;
            return (
              <button
                key={level.id}
                onClick={() => update({ urgency: level.id })}
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                  active
                    ? "border-accent bg-accent/10"
                    : "border-border bg-card hover:border-accent/50"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-accent" : level.color}`} />
                <span className="text-xs font-medium text-foreground">{level.label}</span>
                <span className="text-[10px] text-muted-foreground">{level.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Photos */}
      <div>
        <Label className="mb-2 block text-sm text-muted-foreground">Photos (optional)</Label>
        <div className="flex flex-wrap gap-3">
          {photoPreviews.map((src, idx) => (
            <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-xl border border-border">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => removePhoto(idx)}
                className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5"
              >
                <X className="h-3.5 w-3.5 text-foreground" />
              </button>
            </div>
          ))}
          <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary transition-colors hover:border-accent">
            <Camera className="h-6 w-6 text-muted-foreground" />
            <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
          </label>
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid}
        className="h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange disabled:opacity-50"
      >
        Continue
      </Button>
    </div>
  );
};

export default StepDetails;
