import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

export type SongCommentModerationRow = {
  id: number;
  song_id: number;
  song_title: string;
  song_artist: string;
  user_id: string;
  user_name: string;
  user_email: string;
  body: string;
  created_at: string;
};

type SongCommentRawRow = {
  id: number;
  song_id: number;
  user_id: string;
  body: string;
  created_at: string;
};

type ProfileNameRow = {
  id: string;
  email: string;
  full_name: string | null;
};

type SongNameRow = {
  id: number;
  title: string;
  artist: string;
};

export type SongCommentModerationFilters = {
  page: number;
  pageSize: number;
};

function fallbackNameFromEmail(email: string) {
  const candidate = email.split("@")[0]?.trim();
  return candidate || "Utilisateur";
}

async function attachNames(rows: SongCommentRawRow[]) {
  if (rows.length === 0) return [] as SongCommentModerationRow[];

  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const songIds = Array.from(new Set(rows.map((row) => row.song_id)));

  const [{ data: profileRows, error: profileError }, { data: songRows, error: songError }] =
    await Promise.all([
      supabase.from("profiles").select("id,email,full_name").in("id", userIds),
      supabase.from("songs").select("id,title,artist").in("id", songIds),
    ]);

  if (profileError) throw profileError;
  if (songError) throw songError;

  const profileMap = new Map<string, ProfileNameRow>(
    ((profileRows ?? []) as ProfileNameRow[]).map((profile) => [profile.id, profile]),
  );
  const songMap = new Map<number, SongNameRow>(
    ((songRows ?? []) as SongNameRow[]).map((song) => [song.id, song]),
  );

  return rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    const song = songMap.get(row.song_id);
    const userEmail = profile?.email ?? "--";
    const userName = profile?.full_name?.trim() || fallbackNameFromEmail(userEmail);

    return {
      ...row,
      user_email: userEmail,
      user_name: userName,
      song_title: song?.title ?? `#${row.song_id}`,
      song_artist: song?.artist ?? "--",
    };
  });
}

export function useSongCommentsModeration(filters: SongCommentModerationFilters) {
  const qc = useQueryClient();

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ["song-comments-moderation"] });
      }, 300);
    };

    const channel = supabase
      .channel(`admin:song-comments:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "song_comments" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "songs" },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const comments = useQuery<{ rows: SongCommentModerationRow[]; total: number }>({
    queryKey: ["song-comments-moderation", filters],
    queryFn: async () => {
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;

      const { data, error, count } = await supabase
        .from("song_comments")
        .select("id,song_id,user_id,body,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const rows = await attachNames((data ?? []) as SongCommentRawRow[]);
      return {
        rows,
        total: count ?? 0,
      };
    },
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: number) => {
      const { error } = await supabase.rpc("delete_song_comment", {
        p_comment_id: commentId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["song-comments-moderation"] });
      void qc.invalidateQueries({ queryKey: ["song-social-stats"] });
      toast.success("Commentaire supprimé");
    },
    onError: (e: any) => toast.error(e.message ?? "Suppression impossible"),
  });

  return {
    comments,
    deleteComment,
  };
}
