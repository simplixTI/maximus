import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type ServiceTypeRow = Database["public"]["Tables"]["service_types"]["Row"];
export type ServiceTypeInsert = Database["public"]["Tables"]["service_types"]["Insert"];
export type ServiceTypeUpdate = Database["public"]["Tables"]["service_types"]["Update"];

/**
 * Client-facing hook — only returns active types, sorted for display. RLS
 * ensures anon + non-admin auth users only see active rows.
 */
export function useServiceTypes() {
  return useQuery<ServiceTypeRow[]>({
    queryKey: ["service-types", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_types")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ServiceTypeRow[];
    },
    staleTime: 60_000,
  });
}

/**
 * Admin-facing hook — includes inactive types so ops can toggle them back on.
 * RLS lets admins see everything.
 */
export function useAllServiceTypes() {
  return useQuery<ServiceTypeRow[]>({
    queryKey: ["service-types", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_types")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ServiceTypeRow[];
    },
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["service-types"] });
}

export function useCreateServiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ServiceTypeInsert) => {
      const { data, error } = await supabase
        .from("service_types")
        .insert(input)
        .select("*")
        .single();
      if (error) throw error;
      return data as ServiceTypeRow;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateServiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ServiceTypeUpdate }) => {
      const { data, error } = await supabase
        .from("service_types")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as ServiceTypeRow;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteServiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}

/**
 * Convert a display label into a URL-safe slug that satisfies the DB check
 * constraint (lowercase, digits and hyphens only).
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
