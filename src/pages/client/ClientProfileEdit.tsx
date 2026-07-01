import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const ClientProfileEdit = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "Test Client",
    phone: "+1 (555) 123-4567",
    email: "client@test.com",
    address: "123 Main St, New York, NY 10001",
  });

  const handleSave = () => {
    toast({ title: "Profile updated", description: "Your changes have been saved." });
    navigate("/client/profile");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Edit Profile</h1>
      </div>

      <div className="px-6 space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Tap to change photo</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Full Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 rounded-xl border-border bg-secondary text-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Phone Number</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 rounded-xl border-border bg-secondary text-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-xl border-border bg-secondary text-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-12 rounded-xl border-border bg-secondary text-foreground" />
          </div>
        </div>

        <Button onClick={handleSave} className="h-14 w-full rounded-2xl bg-accent font-display text-lg font-semibold text-accent-foreground">
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ClientProfileEdit;
