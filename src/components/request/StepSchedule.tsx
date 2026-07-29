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
import { useCreateServiceRequest } from "@/hooks/data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM",
];

const BUDGET_PRESETS = [100, 250, 500, 1000, 2500];

const digitsOnly = (v: string) => v.replace(/\D+/g, "").slice(0, 7);
const formatUsd = (digits: string) =>
  digits ? Number(digits).toLocaleString("en-US") : "";

interface Props {
  data: ServiceRequestData;
  update: (partial: Partial<ServiceRequestData>) => void;
  navigate: NavigateFunction;
}

function combineDateAndSlot(date: Date | undefined, slot: string): string | null {
  if (!date) return null;
  const m = slot.match(/^(\d+):(\d+)\s(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (/pm/i.test(m[3]) && h !== 12) h += 12;
  if (/am/i.test(m[3]) && h === 12) h = 0;
  const d = new Date(date);
  d.setHours(h, min, 0, 0);
  return d.toISOString();
}

const StepSchedule = ({ data, update, navigate }: Props) => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const createRequest = useCreateServiceRequest();
  const { user } = useAuth();

  const isAsap = data.intentType === "asap";

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let address = "";
      if (user) {
        const { data: cp } = await supabase
          .from("client_profiles")
          .select("address")
          .eq("user_id", user.id)
          .maybeSingle();
        address = cp?.address ?? "Address on file";
      }
      const scheduled_at = isAsap ? null : combineDateAndSlot(data.scheduledDate, data.scheduledTime);
      await createRequest.mutateAsync({
        category: data.categories[0] ?? "general",
        description:
          data.description ||
          `${data.propertyType} · ${data.categories.join(", ")} · urgency: ${data.urgency}`,
        address,
        scheduled_at,
        photos: data.photos,
        estimated_budget: Number(data.budgetEstimate),
      });
      setSubmitted(true);
      toast.success("Request submitted — waiting for quote");
      setTimeout(() => navigate("/client/bookings"), 1800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const budgetOk = Number(data.budgetEstimate) > 0;
  const canSubmit = budgetOk && (isAsap || (data.scheduledDate && data.scheduledTime));

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

      {/* Budget estimate — required, always shown (ASAP + scheduled) */}
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border bg-card p-5 transition-colors",
          budgetOk ? "border-accent/40" : "border-border",
        )}
      >
        {/* Ambient glow when active — pure CSS, no animation cost when idle */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl transition-opacity",
            budgetOk ? "bg-accent/20 opacity-100" : "opacity-0",
          )}
        />

        <div className="relative flex items-center justify-between">
          <Label
            htmlFor="budget-estimate"
            className="font-display text-sm font-medium text-foreground"
          >
            Budget estimate
          </Label>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest transition-colors",
              budgetOk
                ? "bg-accent/15 text-accent"
                : "bg-destructive/15 text-destructive",
            )}
          >
            {budgetOk ? "Set" : "Required"}
          </span>
        </div>

        <div className="relative mt-4 flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-display text-4xl font-light leading-none transition-colors",
              budgetOk ? "text-accent" : "text-muted-foreground/60",
            )}
          >
            $
          </span>
          <input
            id="budget-estimate"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-required="true"
            aria-invalid={!budgetOk}
            value={formatUsd(data.budgetEstimate)}
            onChange={(e) => update({ budgetEstimate: digitsOnly(e.target.value) })}
            placeholder="0"
            className="w-full border-none bg-transparent p-0 font-display text-4xl font-light leading-none tracking-tight text-foreground outline-none placeholder:text-muted-foreground/30 tabular-nums focus:outline-none focus:ring-0"
          />
        </div>

        <div className="relative mt-1 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-accent/40 via-border to-transparent" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            USD
          </span>
        </div>

        <p className="relative mt-3 text-xs leading-relaxed text-muted-foreground">
          Helps us prepare a quote aligned with your budget. You can accept or
          negotiate when it arrives.
        </p>

        <div className="relative mt-4 flex flex-wrap gap-2">
          {BUDGET_PRESETS.map((v) => {
            const active = Number(data.budgetEstimate) === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => update({ budgetEstimate: String(v) })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium tabular-nums transition-all",
                  active
                    ? "border-accent bg-accent/15 text-accent shadow-[0_0_0_3px_hsl(var(--accent)/0.08)]"
                    : "border-border bg-background/50 text-muted-foreground hover:border-accent/50 hover:text-foreground",
                )}
              >
                ${v.toLocaleString("en-US")}
              </button>
            );
          })}
        </div>
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
        disabled={!canSubmit || submitting}
        className="h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange disabled:opacity-50"
      >
        {submitting ? "Submitting…" : isAsap ? "Request Now" : "Submit Request"}
      </Button>
    </div>
  );
};

export default StepSchedule;
