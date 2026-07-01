import { supabase } from "./supabase";

export type SmsTemplate =
  | "welcome"
  | "request_received"
  | "quote_sent"
  | "quote_accepted"
  | "booking_confirmed"
  | "provider_assigned"
  | "provider_en_route"
  | "provider_arrived"
  | "job_completed"
  | "generic";

interface SendArgs {
  to: string;
  template: SmsTemplate;
  data?: Record<string, unknown>;
  body?: string;
}

export async function sendTransactionalSMS(args: SendArgs): Promise<void> {
  if (!args.to) return;
  const { error } = await supabase.functions.invoke("send-sms", { body: args });
  if (error) {
    console.warn("[sms] send-sms failed:", error.message);
  }
}
