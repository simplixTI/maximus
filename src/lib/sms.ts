import { supabase } from "./supabase";

export type SmsTemplate = "quote_sent" | "quote_accepted" | "provider_en_route" | "generic";

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
