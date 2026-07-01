import { supabase } from "./supabase";

export type EmailTemplate = "quote_sent" | "quote_accepted" | "request_received" | "generic";

interface SendArgs {
  to: string | string[];
  template: EmailTemplate;
  data?: Record<string, unknown>;
  subject?: string;
  html?: string;
  reply_to?: string;
}

export async function sendTransactionalEmail(args: SendArgs): Promise<void> {
  const { error } = await supabase.functions.invoke("send-email", { body: args });
  if (error) {
    console.warn("[email] send-email failed:", error.message);
  }
}
