import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Clock } from "lucide-react";

interface Props { onNext: () => void; }

const StepBackground = ({ onNext }: Props) => {
  const [consented, setConsented] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl font-bold text-foreground">Background Check</h3>
        <p className="text-sm text-muted-foreground">Required for all service providers</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
          <ShieldCheck className="h-7 w-7 text-accent" />
        </div>
        <h4 className="mb-2 font-display font-semibold text-foreground">Checkr Background Verification</h4>
        <p className="mb-4 text-sm text-muted-foreground">
          We partner with Checkr to verify the background of all service providers. This helps us maintain trust and safety for our clients.
        </p>
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3">
          <Clock className="h-4 w-4 text-accent" />
          <span className="text-sm text-foreground">Verification typically takes 1-3 business days</span>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
        <Checkbox
          id="consent"
          checked={consented}
          onCheckedChange={(c) => setConsented(c === true)}
          className="mt-0.5"
        />
        <label htmlFor="consent" className="text-sm text-muted-foreground cursor-pointer">
          I authorize Maximus Solutions Group to conduct a background check through Checkr. I understand that this is a requirement to become an approved service provider.
        </label>
      </div>

      <Button
        onClick={onNext}
        disabled={!consented}
        className="h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange disabled:opacity-50"
      >
        Authorize & Continue
      </Button>
    </div>
  );
};

export default StepBackground;
