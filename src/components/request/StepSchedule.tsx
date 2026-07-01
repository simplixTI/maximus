import { format } from "date-fns";
import { CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ServiceRequestData } from "@/pages/client/ServiceRequest";
import type { NavigateFunction } from "react-router-dom";

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM",
];

interface Props {
  data: ServiceRequestData;
  update: (partial: Partial<ServiceRequestData>) => void;
  navigate: NavigateFunction;
}

const StepSchedule = ({ data, update, navigate }: Props) => {
  const [submitted, setSubmitted] = useState(false);

  const isAsap = data.intentType === "asap";

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success("Service request submitted!");
    setTimeout(() => {
      if (isAsap) {
        navigate("/client/tracking/1");
      } else {
        navigate("/client/bookings");
      }
    }, 2000);
  };

  const canSubmit = isAsap || (data.scheduledDate && data.scheduledTime);

  if (submitted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-orange shadow-orange">
          <CheckCircle2 className="h-10 w-10 text-accent-foreground" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground">Request Submitted!</h3>
        <p className="mt-2 text-center text-muted-foreground">
          {isAsap
            ? "We're finding the nearest available provider for you."
            : "You'll receive a confirmation shortly."}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl font-bold text-foreground">
          {isAsap ? "Confirm Request" : "Pick a Date & Time"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAsap
            ? "We'll dispatch the nearest available provider"
            : "Choose your preferred schedule"}
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Property</span>
          <span className="text-sm font-medium capitalize text-foreground">{data.propertyType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Request Type</span>
          <span className="text-sm font-medium capitalize text-foreground">{data.intentType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Services</span>
          <span className="text-sm font-medium text-foreground text-right max-w-[60%]">
            {data.categories.join(", ")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Urgency</span>
          <span className="text-sm font-medium capitalize text-foreground">{data.urgency}</span>
        </div>
        {data.photos.length > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Photos</span>
            <span className="text-sm font-medium text-foreground">{data.photos.length} attached</span>
          </div>
        )}
      </div>

      {/* Date/Time picker — only if not ASAP */}
      {!isAsap && (
        <>
          <div>
            <Label className="mb-2 block text-sm text-muted-foreground">Preferred Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 w-full justify-start rounded-xl border-border bg-card text-left font-normal",
                    !data.scheduledDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.scheduledDate
                    ? format(data.scheduledDate, "PPP")
                    : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.scheduledDate}
                  onSelect={(d) => update({ scheduledDate: d })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="mb-2 block text-sm text-muted-foreground">Preferred Time</Label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => {
                const active = data.scheduledTime === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => update({ scheduledTime: slot })}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-medium transition-all ${
                      active
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-card text-muted-foreground hover:border-accent/50"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange disabled:opacity-50"
      >
        {isAsap ? "Request Now" : "Submit Request"}
      </Button>
    </div>
  );
};

export default StepSchedule;
