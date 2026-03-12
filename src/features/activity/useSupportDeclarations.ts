import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type SupportDeclarationRow = {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  amount_fcfa: number;
  channel: string;
  app_version: string | null;
  created_at: string;
};

type SupportDeclarationRawRow = {
  id: number;
  user_id: string;
  amount_fcfa: number;
  channel: string;
  app_version: string | null;
  created_at: string;
};

type ProfileNameRow = {
  id: string;
  email: string;
  full_name: string | null;
};

export type SupportDeclarationFilters = {
  page: number;
  pageSize: number;
};

function fallbackNameFromEmail(email: string) {
  const candidate = email.split("@")[0]?.trim();
  return candidate || "Utilisateur";
}

async function attachUserNames(rows: SupportDeclarationRawRow[]) {
  if (rows.length === 0) return [] as SupportDeclarationRow[];

  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name")
    .in("id", userIds);

  if (profileError) throw profileError;

  const profileMap = new Map<string, ProfileNameRow>(
    ((profileRows ?? []) as ProfileNameRow[]).map((profile) => [profile.id, profile]),
  );

  return rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    const userEmail = profile?.email ?? "--";
    const userName = profile?.full_name?.trim()
      || fallbackNameFromEmail(userEmail);

    return {
      ...row,
      user_email: userEmail,
      user_name: userName,
    };
  });
}

export function useSupportDeclarations(filters: SupportDeclarationFilters) {
  const qc = useQueryClient();

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ["support-declarations"] });
      }, 300);
    };

    const channel = supabase
      .channel(`admin:support:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_declarations" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery<{ rows: SupportDeclarationRow[]; total: number }>({
    queryKey: ["support-declarations", filters],
    queryFn: async () => {
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;

      const { data, error, count } = await supabase
        .from("support_declarations")
        .select("id,user_id,amount_fcfa,channel,app_version,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const rows = await attachUserNames((data ?? []) as SupportDeclarationRawRow[]);
      return {
        rows,
        total: count ?? 0,
      };
    },
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });
}
