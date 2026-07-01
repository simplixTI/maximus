import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import StepBusiness from "@/components/provider/StepBusiness";
import StepPersonal from "@/components/provider/StepPersonal";
import StepVehicle from "@/components/provider/StepVehicle";
import StepDocuments from "@/components/provider/StepDocuments";
import StepBackground from "@/components/provider/StepBackground";
import StepSkills from "@/components/provider/StepSkills";
import { useUpsertProviderProfile, useSubmitProviderApplication } from "@/hooks/upload";
import { toast } from "sonner";

const STEP_LABELS = ["Business", "Personal", "Vehicle", "Documents", "Background", "Skills"];

const ProviderOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const upsertProfile = useUpsertProviderProfile();
  const submitApp = useSubmitProviderApplication();

  const progress = ((currentStep + 1) / STEP_LABELS.length) * 100;

  const next = async () => {
    if (currentStep < STEP_LABELS.length - 1) {
      setCurrentStep((s) => s + 1);
      return;
    }
    setSubmitting(true);
    try {
      await upsertProfile.mutateAsync({});
      await submitApp.mutateAsync();
      setComplete(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
    else navigate("/");
  };

  if (complete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex w-full max-w-sm flex-col items-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-orange shadow-orange">
            <Check className="h-10 w-10 text-accent-foreground" />
          </div>
          <h2 className="mb-2 font-display text-2xl font-bold text-foreground">Application Submitted!</h2>
          <p className="mb-8 text-center text-muted-foreground">
            Your application is under review. We'll notify you within 24-48 hours.
          </p>
          <div className="w-full rounded-2xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-3 w-3 animate-pulse rounded-full bg-accent" />
              <span className="font-semibold text-foreground">Pending Review</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Our team is reviewing your documents and credentials. You'll receive a notification once approved.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="mt-6 text-sm text-accent hover:underline"
          >
            Back to home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <button onClick={back} className="rounded-xl p-2 hover:bg-secondary">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="font-display text-lg font-semibold text-foreground">Provider Application</h2>
          <span className="ml-auto text-sm text-muted-foreground">
            {currentStep + 1}/{STEP_LABELS.length}
          </span>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-2 bg-secondary [&>div]:bg-gradient-orange" />

        {/* Step dots */}
        <div className="mt-3 flex justify-between">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  i < currentStep
                    ? "bg-accent text-accent-foreground"
                    : i === currentStep
                    ? "bg-accent text-accent-foreground ring-2 ring-accent/30"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-[10px] ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="px-6 py-6"
          >
            {currentStep === 0 && <StepBusiness onNext={next} />}
            {currentStep === 1 && <StepPersonal onNext={next} />}
            {currentStep === 2 && <StepVehicle onNext={next} />}
            {currentStep === 3 && <StepDocuments onNext={next} />}
            {currentStep === 4 && <StepBackground onNext={next} />}
            {currentStep === 5 && <StepSkills onNext={next} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProviderOnboarding;
