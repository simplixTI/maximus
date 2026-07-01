import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import StepProperty from "@/components/request/StepProperty";
import StepIntent from "@/components/request/StepIntent";
import StepDetails from "@/components/request/StepDetails";
import StepSchedule from "@/components/request/StepSchedule";

export interface ServiceRequestData {
  propertyType: string;
  intentType: string;
  categories: string[];
  description: string;
  urgency: string;
  photos: File[];
  scheduledDate: Date | undefined;
  scheduledTime: string;
}

const STEPS = ["Property", "Intent", "Details", "Schedule"];

const ServiceRequest = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ServiceRequestData>({
    propertyType: "",
    intentType: "",
    categories: [],
    description: "",
    urgency: "",
    photos: [],
    scheduledDate: undefined,
    scheduledTime: "",
  });

  const update = (partial: Partial<ServiceRequestData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => {
    if (step === 0) navigate(-1);
    else setStep((s) => s - 1);
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={back} className="rounded-xl p-2 hover:bg-secondary">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="font-display text-lg font-semibold text-foreground">
            {STEPS[step]}
          </h2>
          <span className="ml-auto text-sm text-muted-foreground">
            {step + 1}/{STEPS.length}
          </span>
        </div>
        <Progress value={progress} className="mt-3 h-1.5" />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          {step === 0 && (
            <StepProperty
              selected={data.propertyType}
              onSelect={(v) => { update({ propertyType: v }); next(); }}
            />
          )}
          {step === 1 && (
            <StepIntent
              selected={data.intentType}
              onSelect={(v) => { update({ intentType: v }); next(); }}
            />
          )}
          {step === 2 && (
            <StepDetails data={data} update={update} onNext={next} />
          )}
          {step === 3 && (
            <StepSchedule data={data} update={update} navigate={navigate} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ServiceRequest;
