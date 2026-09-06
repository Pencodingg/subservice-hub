import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "user";

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

async function getRole(userId: string): Promise<AppRole> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) return "user";
  return (data ?? []).some((r) => r.role === "admin") ? "admin" : "user";
}

export function useAuth() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery<Session | null>({
    queryKey: ["auth-session"],
    queryFn: getSession,
    staleTime: 30_000,
  });

  const userId = sessionQuery.data?.user.id ?? null;

  const roleQuery = useQuery({
    queryKey: ["auth-role", userId],
    queryFn: () => getRole(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void queryClient.invalidateQueries({ queryKey: ["auth-session"] });
      void queryClient.invalidateQueries({ queryKey: ["auth-role"] });
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const role: AppRole = roleQuery.data ?? "user";

  return {
    session: sessionQuery.data ?? null,
    user: sessionQuery.data?.user ?? null,
    email: sessionQuery.data?.user.email ?? null,
    role,
    isAdmin: role === "admin",
    loading: sessionQuery.isPending || (Boolean(userId) && roleQuery.isPending),
  };
}

export async function ensureUserRecords(userId: string, email: string | null) {
  await supabase.from("profiles").upsert({ id: userId, email }, { onConflict: "id" });
  const { data } = await supabase.from("user_roles").select("id").eq("user_id", userId).limit(1);
  if (!data || data.length === 0) {
    await supabase.from("user_roles").insert({ user_id: userId, role: "user" });
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}
