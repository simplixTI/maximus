import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, Camera, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { uploadFile, publicUrl } from "@/hooks/upload";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Props { onNext: () => void; }

const StepPersonal = ({ onNext }: Props) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ legalName: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoPick = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    if (!user) {
      toast.error("Sign in required to upload");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    try {
      const path = await uploadFile("avatars", user.id, file);
      setPhotoPath(path);
      await supabase.from("profiles").update({ avatar_url: publicUrl("avatars", path) }).eq("id", user.id);
      if (errors.photo) setErrors((e) => ({ ...e, photo: "" }));
      toast.success("Profile photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setPhotoPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!photoPath) e.photo = "Profile photo required";
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <button
          type="button"
          onClick={handlePhotoPick}
          disabled={uploading}
          className={`group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-all ${
            errors.photo
              ? "border-destructive bg-destructive/10"
              : photoPath
              ? "border-emerald-500/70 bg-emerald-500/5"
              : "border-accent bg-secondary hover:bg-accent/10"
          } disabled:opacity-60`}
          aria-label={photoPath ? "Change profile photo" : "Upload profile photo"}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
          ) : uploading ? (
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
          ) : (
            <Camera className="h-8 w-8 text-accent" />
          )}
          {photoPath && !uploading && (
            <span className="pointer-events-none absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-emerald-500 shadow">
              <Check className="h-3 w-3 text-background" />
            </span>
          )}
          {photoPath && !uploading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-semibold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
              Change
            </div>
          )}
        </button>
        <span
          className={`mt-2 text-xs ${
            errors.photo ? "text-destructive" : photoPath ? "text-emerald-500" : "text-accent"
          }`}
        >
          {uploading
            ? "Uploading…"
            : errors.photo
            ? errors.photo
            : photoPath
            ? "Photo uploaded"
            : "Profile photo required *"}
        </span>
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
