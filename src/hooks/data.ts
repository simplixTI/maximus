import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/lib/database.types";
import { sendTransactionalEmail } from "@/lib/email";
import { sendTransactionalSMS } from "@/lib/sms";
import { insertNotification } from "@/hooks/notifications";

type ServiceRequestRow = Database["public"]["Tables"]["service_requests"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type QuoteRow = Database["public"]["Tables"]["quotes"]["Row"];

export function useMyBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookings", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, status, created_at, started_at, completed_at, provider_id, request:service_requests(id, category, description, address), quote:quotes(amount)"
        )
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyServiceRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["service_requests", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, category, description, address, status, estimated_cost, created_at")
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ServiceRequestRow[];
    },
  });
}

export function useCreateServiceRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      category: string;
      description: string;
      address: string;
      scheduled_at?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("service_requests")
        .insert({
          client_id: user.id,
          category: input.category,
          description: input.description,
          address: input.address,
          scheduled_at: input.scheduled_at ?? null,
          status: "quoted",
        })
        .select("id")
        .single();
      if (error) throw error;
      if (user.email) {
        sendTransactionalEmail({
          to: user.email,
          template: "request_received",
          data: { category: input.category },
        });
      }
      const phone = (user.phone as string | undefined) ?? (user.user_metadata?.phone as string | undefined);
      if (phone) {
        sendTransactionalSMS({ to: phone, template: "request_received", data: { category: input.category } });
      }
      insertNotification({
        user_id: user.id,
        type: "request_received",
        title: "Request received",
        body: `We're preparing a quote for your ${input.category} request.`,
      });
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service_requests"] });
    },
  });
}

export function usePendingRequests() {
  return useQuery({
    queryKey: ["service_requests", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, category, description, address, created_at, client:profiles(full_name, email)")
        .in("status", ["draft", "quoted"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSentQuotes() {
  return useQuery({
    queryKey: ["quotes", "sent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("id, amount, status, created_at, request:service_requests(category, client:profiles(full_name))")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateQuote() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { request_id: string; amount: number; scope: string; notes?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("quotes")
        .insert({
          request_id: input.request_id,
          admin_id: user.id,
          amount: input.amount,
          scope: input.scope,
          notes: input.notes ?? null,
          status: "pending",
        })
        .select("id, request:service_requests(client_id, category, client:profiles(email, phone))")
        .single();
      if (error) throw error;
      const req = data.request as
        | { client_id?: string; category?: string; client?: { email?: string; phone?: string } }
        | null;
      const tplData = { amount: input.amount.toFixed(2), category: req?.category ?? "your request" };
      if (req?.client?.email) {
        sendTransactionalEmail({ to: req.client.email, template: "quote_sent", data: tplData });
      }
      if (req?.client?.phone) {
        sendTransactionalSMS({ to: req.client.phone, template: "quote_sent", data: tplData });
      }
      if (req?.client_id) {
        insertNotification({
          user_id: req.client_id,
          type: "quote_sent",
          title: `New quote: $${input.amount.toFixed(2)}`,
          body: `${req.category ?? "Your request"} — tap to review and accept.`,
        });
      }
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["service_requests"] });
    },
  });
}

export function useMyPendingQuotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["quotes", "mine-pending", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select(
          "id, amount, scope, notes, status, created_at, request:service_requests!inner(id, category, description, address, client_id)"
        )
        .eq("status", "pending")
        .eq("request.client_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAcceptQuote() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (quote: { id: string; request_id: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error: qErr } = await supabase
        .from("quotes")
        .update({ status: "accepted" })
        .eq("id", quote.id);
      if (qErr) throw qErr;

      const { data: booking, error: bErr } = await supabase
        .from("bookings")
        .insert({
          request_id: quote.request_id,
          quote_id: quote.id,
          client_id: user.id,
          status: "confirmed",
        })
        .select("id")
        .single();
      if (bErr) throw bErr;

      await supabase.from("service_requests").update({ status: "paid" }).eq("id", quote.request_id);
      if (user.email) {
        sendTransactionalEmail({ to: user.email, template: "quote_accepted" });
      }
      const phone = (user.phone as string | undefined) ?? (user.user_metadata?.phone as string | undefined);
      if (phone) {
        sendTransactionalSMS({ to: phone, template: "quote_accepted" });
      }
      insertNotification({
        user_id: user.id,
        type: "quote_accepted",
        title: "Booking confirmed",
        body: "Your quote was accepted. We're matching you with a provider now.",
      });
      return booking.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["service_requests"] });
    },
  });
}

export type { ServiceRequestRow, BookingRow, QuoteRow };
