import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type SongSocialStatsRow = {
  song_id: number;
  likes_count: number;
  comments_count: number;
};

export function useSongSocialStats(songIds: number[]) {
  const qc = useQueryClient();
  const stableIds = [...new Set(songIds)].sort((a, b) => a - b);

  useEffect(() => {
    if (stableIds.length === 0) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ["song-social-stats"] });
      }, 250);
    };

    const channel = supabase
      .channel(`admin:song-social:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "song_likes" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "song_comments" },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [qc, stableIds.join(",")]);

  return useQuery<Map<number, SongSocialStatsRow>>({
    queryKey: ["song-social-stats", stableIds],
    queryFn: async () => {
      if (stableIds.length === 0) return new Map<number, SongSocialStatsRow>();

      const { data, error } = await supabase.rpc("get_song_social_counts", {
        p_song_ids: stableIds,
      });

      if (error) throw error;

      return new Map<number, SongSocialStatsRow>(
        ((data ?? []) as any[]).map((row) => [
          Number(row.song_id),
          {
            song_id: Number(row.song_id),
            likes_count: Number(row.likes_count ?? 0),
            comments_count: Number(row.comments_count ?? 0),
          },
        ]),
      );
    },
    staleTime: 10_000,
  });
}
