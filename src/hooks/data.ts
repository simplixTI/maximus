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

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ["bookings", "one", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, status, created_at, started_at, completed_at, provider_id, client_id, request:service_requests(id, category, description, address, scheduled_at), quote:quotes(amount, scope), client:profiles(full_name, email, phone)"
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

type NextBookingStatus = "en_route" | "arrived" | "in_progress" | "completed" | "cancelled";

export function useUpdateBookingStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { booking_id: string; status: NextBookingStatus; notes?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const patch: Record<string, unknown> = { status: input.status };
      if (input.status === "in_progress") patch.started_at = new Date().toISOString();
      if (input.status === "completed") patch.completed_at = new Date().toISOString();

      const { data: booking, error } = await supabase
        .from("bookings")
        .update(patch)
        .eq("id", input.booking_id)
        .select("id, client_id, request:service_requests(category), client:profiles(email, phone, full_name)")
        .single();
      if (error) throw error;

      await supabase.from("booking_status_events").insert({
        booking_id: input.booking_id,
        status: input.status,
        notes: input.notes ?? null,
      });

      const client = booking.client as { email?: string; phone?: string; full_name?: string } | null;
      const req = booking.request as { category?: string } | null;
      const providerName = (user.user_metadata?.full_name as string | undefined) ?? "Your provider";

      const smsMap: Partial<Record<NextBookingStatus, "provider_en_route" | "provider_arrived" | "job_completed">> = {
        en_route: "provider_en_route",
        arrived: "provider_arrived",
        completed: "job_completed",
      };
      const notifMap: Partial<Record<NextBookingStatus, { title: string; body: string; type: "provider_en_route" | "provider_arrived" | "job_completed" | "booking_confirmed" }>> = {
        en_route: { type: "provider_en_route", title: "Provider on the way", body: `${providerName} is heading to you.` },
        arrived: { type: "provider_arrived", title: "Provider arrived", body: `${providerName} has arrived.` },
        in_progress: { type: "booking_confirmed", title: "Work started", body: "The job is now in progress." },
        completed: { type: "job_completed", title: "Job completed", body: "Please rate your experience in the app." },
        cancelled: { type: "booking_confirmed", title: "Booking cancelled", body: "This booking was cancelled." },
      };

      if (booking.client_id) {
        const notif = notifMap[input.status];
        if (notif) {
          insertNotification({ user_id: booking.client_id, type: notif.type, title: notif.title, body: notif.body });
        }
      }
      const smsTemplate = smsMap[input.status];
      if (smsTemplate && client?.phone) {
        sendTransactionalSMS({
          to: client.phone,
          template: smsTemplate,
          data: { provider: providerName, category: req?.category ?? "service" },
        });
      }
      if (input.status === "completed" && client?.email) {
        sendTransactionalEmail({
          to: client.email,
          template: "generic",
          subject: "Job completed",
          data: { body: `Your ${req?.category ?? "service"} is complete. Please rate your provider in the app.` },
        });
      }
      return booking.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["earnings"] });
    },
  });
}

export function useProviderJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookings", "provider", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, status, created_at, started_at, completed_at, request:service_requests(id, category, description, address, scheduled_at), quote:quotes(amount), client:profiles(full_name, phone)"
        )
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProviderEarnings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["earnings", "provider", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, status, quote:quotes(amount)")
        .eq("provider_id", user!.id);
      if (error) throw error;
      const rows = data ?? [];
      let total = 0;
      let completed = 0;
      let active = 0;
      for (const b of rows) {
        const amount = Number((b.quote as { amount?: number } | null)?.amount ?? 0);
        if (b.status === "completed") {
          completed += 1;
          total += amount;
        } else if (b.status !== "cancelled") {
          active += 1;
        }
      }
      return { total, completed, active };
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

async function findNearestProvider(request_id: string): Promise<string | null> {
  const { data: req } = await supabase
    .from("service_requests")
    .select("location")
    .eq("id", request_id)
    .maybeSingle();

  const loc = (req as { location?: { coordinates?: [number, number] } } | null)?.location;
  if (loc?.coordinates && loc.coordinates.length === 2) {
    const [lng, lat] = loc.coordinates;
    const { data: matches } = await supabase.rpc("providers_within_radius", {
      lat,
      lng,
      radius_m: 50000,
    });
    if (matches && matches.length > 0) return matches[0].provider_id;
  }

  const { data: fallback } = await supabase
    .from("provider_profiles")
    .select("user_id")
    .eq("verified", true)
    .eq("online", true)
    .order("rating_avg", { ascending: false })
    .limit(1)
    .maybeSingle();
  return fallback?.user_id ?? null;
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

      const providerId = await findNearestProvider(quote.request_id);

      const { data: booking, error: bErr } = await supabase
        .from("bookings")
        .insert({
          request_id: quote.request_id,
          quote_id: quote.id,
          client_id: user.id,
          provider_id: providerId,
          status: providerId ? "confirmed" : "confirmed",
        })
        .select("id")
        .single();
      if (bErr) throw bErr;

      await supabase.from("service_requests").update({ status: providerId ? "matched" : "paid" }).eq("id", quote.request_id);

      if (providerId) {
        insertNotification({
          user_id: providerId,
          type: "provider_assigned",
          title: "New job assigned",
          body: "A client has booked you. Open the app to review details.",
        });
        supabase.from("profiles").select("email, phone").eq("id", providerId).maybeSingle().then(({ data: prov }) => {
          const p = prov as { email?: string; phone?: string } | null;
          if (p?.email) sendTransactionalEmail({ to: p.email, template: "generic", subject: "New job assigned", data: { body: "You have a new Maximus job. Open the app to review." } });
          if (p?.phone) sendTransactionalSMS({ to: p.phone, template: "provider_assigned" });
        });
      }
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

export function useCreateReview() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      booking_id: string;
      reviewee_id: string;
      rating: number;
      comment?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("reviews").insert({
        booking_id: input.booking_id,
        reviewer_id: user.id,
        reviewee_id: input.reviewee_id,
        rating: input.rating,
        comment: input.comment ?? null,
      });
      if (error) throw error;
      insertNotification({
        user_id: input.reviewee_id,
        type: "generic",
        title: "You got a new review",
        body: `${input.rating}★${input.comment ? ` — "${input.comment.slice(0, 60)}"` : ""}`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useReviewForBooking(booking_id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reviews", "booking", booking_id, user?.id],
    enabled: !!booking_id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment")
        .eq("booking_id", booking_id!)
        .eq("reviewer_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export type { ServiceRequestRow, BookingRow, QuoteRow };
