import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/lib/database.types";

export type ChatMessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];

export function useChatMessages(bookingId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["chat", bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, booking_id, sender_id, content, created_at, sender:profiles(full_name)")
        .eq("booking_id", bookingId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!bookingId) return;
    const channel: RealtimeChannel = supabase
      .channel(`chat:${bookingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `booking_id=eq.${bookingId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["chat", bookingId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, qc]);

  return query;
}

export function useSendMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { booking_id: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("chat_messages").insert({
        booking_id: input.booking_id,
        sender_id: user.id,
        content: input.content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["chat", vars.booking_id] });
    },
  });
}
