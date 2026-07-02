import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/lib/database.types";

const READ_EVENT = "maximus:chat-read";
const lastReadKey = (id: string) => `chat:${id}:lastRead`;

export function markChatRead(bookingId: string) {
  try {
    localStorage.setItem(lastReadKey(bookingId), String(Date.now()));
    window.dispatchEvent(new CustomEvent(READ_EVENT, { detail: bookingId }));
  } catch {
    /* ignore */
  }
}

export function useUnreadMessageCount(bookingId: string | undefined): number {
  const { user } = useAuth();
  const messagesQ = useChatMessages(bookingId);
  const [, setTick] = useState(0);

  useEffect(() => {
    const onRead = (e: Event) => {
      const evt = e as CustomEvent<string>;
      if (!bookingId || evt.detail === bookingId) setTick((n) => n + 1);
    };
    window.addEventListener(READ_EVENT, onRead);
    return () => window.removeEventListener(READ_EVENT, onRead);
  }, [bookingId]);

  if (!bookingId || !user) return 0;
  const messages = messagesQ.data ?? [];
  const raw = typeof window !== "undefined" ? localStorage.getItem(lastReadKey(bookingId)) : null;
  const lastRead = raw ? Number(raw) : 0;
  return messages.filter(
    (m) => m.sender_id !== user.id && new Date(m.created_at).getTime() > lastRead,
  ).length;
}

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
