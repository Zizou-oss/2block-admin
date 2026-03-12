import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type ActivityRow = {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  song_title: string;
  song_artist: string;
  seconds_listened: number;
  started_at: string;
  is_offline: boolean;
};

type ActivityRawRow = {
  id: number;
  user_id: string;
  user_email: string;
  song_title: string;
  song_artist: string;
  seconds_listened: number;
  started_at: string;
  is_offline: boolean;
};

type ProfileNameRow = {
  id: string;
  email: string;
  full_name: string | null;
};

export type ActivityFilters = {
  page: number;
  pageSize: number;
  userEmail?: string;
  songQuery?: string;
  isOffline?: "all" | "online" | "offline";
  dateFrom?: string;
  dateTo?: string;
};

function fallbackNameFromEmail(email: string) {
  const candidate = email.split("@")[0]?.trim();
  return candidate || "Utilisateur";
}

async function attachUserNames(rows: ActivityRawRow[]) {
  if (rows.length === 0) return [] as ActivityRow[];

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
    const userName = profile?.full_name?.trim()
      || fallbackNameFromEmail(profile?.email || row.user_email);
    return {
      ...row,
      user_name: userName,
    };
  });
}

function buildActivityQuery(filters: ActivityFilters) {
  let query = supabase
    .from("admin_listening_events_detailed")
    .select("*", { count: "exact" })
    .order("started_at", { ascending: false });

  if (filters.userEmail?.trim()) {
    query = query.ilike("user_email", `%${filters.userEmail.trim()}%`);
  }
  if (filters.songQuery?.trim()) {
    query = query.or(
      `song_title.ilike.%${filters.songQuery.trim()}%,song_artist.ilike.%${filters.songQuery.trim()}%`,
    );
  }
  if (filters.isOffline === "offline") {
    query = query.eq("is_offline", true);
  } else if (filters.isOffline === "online") {
    query = query.eq("is_offline", false);
  }
  if (filters.dateFrom) {
    query = query.gte("started_at", `${filters.dateFrom}T00:00:00`);
  }
  if (filters.dateTo) {
    query = query.lte("started_at", `${filters.dateTo}T23:59:59`);
  }
  return query;
}

export function useActivity(filters: ActivityFilters) {
  const qc = useQueryClient();

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ["activity"] });
      }, 300);
    };

    const channel = supabase
      .channel(`admin:activity:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listening_events" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "songs" },
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

  return useQuery<{ rows: ActivityRow[]; total: number }>({
    queryKey: ["activity", filters],
    queryFn: async () => {
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;

      const query = buildActivityQuery(filters);

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      const withNames = await attachUserNames((data ?? []) as ActivityRawRow[]);
      return {
        rows: withNames,
        total: count ?? 0,
      };
    },
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });
}

export async function fetchActivityForExport(filters: ActivityFilters, limit = 5000) {
  const query = buildActivityQuery({ ...filters, page: 1, pageSize: limit });
  const { data, error } = await query.range(0, Math.max(0, limit - 1));
  if (error) throw error;
  return attachUserNames((data ?? []) as ActivityRawRow[]);
}
