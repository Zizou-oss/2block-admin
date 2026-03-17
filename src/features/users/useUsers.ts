import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

type UserStatsRow = {
  user_id: string;
  email: string;
  songs_downloaded: number;
  listening_events: number;
  seconds_total: number;
  last_activity_at: string | null;
};

type ProfileNameRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
};

type UserStatsWithName = UserStatsRow & {
  user_name: string;
  role: string;
};

function fallbackNameFromEmail(email: string) {
  const candidate = email.split("@")[0]?.trim();
  return candidate || "Utilisateur";
}

export function useUsers() {
  const qc = useQueryClient();

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ["users-stats"] });
      }, 300);
    };

    const channel = supabase
      .channel(`admin:users:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listening_events" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "song_downloads" },
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

  return useQuery<UserStatsWithName[]>({
    queryKey: ["users-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_user_activity")
        .select("*")
        .order("seconds_total", { ascending: false });

      if (error) throw error;
      const rows = (data ?? []) as UserStatsRow[];
      if (rows.length === 0) return [];

      const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,full_name,role")
        .in("id", userIds);

      if (profileError) throw profileError;

      const profileMap = new Map<string, ProfileNameRow>(
        ((profileRows ?? []) as ProfileNameRow[]).map((profile) => [profile.id, profile]),
      );

      return rows.map((row) => {
        const profile = profileMap.get(row.user_id);
        const userName = profile?.full_name?.trim()
          || fallbackNameFromEmail(profile?.email || row.email);
        return {
          ...row,
          user_name: userName,
          role: profile?.role ?? "user",
        };
      });
    },
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });
}
