import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { insertNotification } from "@/hooks/notifications";

type Bucket = "avatars" | "provider-docs" | "job-photos";

function randomToken() {
  return Math.random().toString(36).slice(2, 10);
}

function safeName(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadFile(bucket: Bucket, folder: string, file: File): Promise<string> {
  const path = `${folder}/${Date.now()}-${randomToken()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export function publicUrl(bucket: Bucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function signedUrl(bucket: Bucket, path: string, expiresIn = 60 * 60) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export function useUpsertProviderProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      business_name?: string;
      ein?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      bio?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("provider_profiles")
        .upsert({ user_id: user.id, ...input });
      if (error) throw error;
      await supabase.from("profiles").update({ role: "provider" }).eq("id", user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider_profiles"] });
    },
  });
}

export function useAddProviderDocument() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: string; file: File; expires_at?: string | null }) => {
      if (!user) throw new Error("Not authenticated");
      const path = await uploadFile("provider-docs", user.id, input.file);
      const { error } = await supabase.from("provider_documents").insert({
        provider_id: user.id,
        type: input.type,
        file_url: path,
        status: "pending",
        expires_at: input.expires_at ?? null,
      });
      if (error) throw error;
      return path;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider_documents"] });
      qc.invalidateQueries({ queryKey: ["provider", "pending"] });
    },
  });
}

export function useAddProviderSkill() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { skill: string; license?: File }) => {
      if (!user) throw new Error("Not authenticated");
      let license_url: string | null = null;
      if (input.license) {
        license_url = await uploadFile("provider-docs", user.id, input.license);
      }
      const { error } = await supabase.from("provider_skills").insert({
        provider_id: user.id,
        skill: input.skill,
        license_url,
        license_status: license_url ? "pending" : "verified",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider_skills"] });
    },
  });
}

export function useSubmitProviderApplication() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
      const list = (admins ?? []) as { id: string }[];
      for (const a of list) {
        insertNotification({
          user_id: a.id,
          type: "generic",
          title: "New provider application",
          body: "A provider submitted their onboarding for review.",
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider", "pending"] });
    },
  });
}
