import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { broadcastPush } from "@/lib/pushNotifications";
import { toast } from "sonner";

export type SongRow = {
  id: number;
  title: string;
  artist: string;
  cover_url: string | null;
  lyrics_lrc?: string | null;
  storage_path: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type SongsFilters = {
  page: number;
  pageSize: number;
  search: string;
  publishedFilter: "all" | "published" | "draft";
};

export function useSongs(filters: SongsFilters) {
  const qc = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  function getSafeStoragePath(fileName: string) {
    const extMatch = fileName.toLowerCase().match(/\.[a-z0-9]+$/);
    const ext = extMatch ? extMatch[0] : ".m4a";
    return `songs/${crypto.randomUUID()}${ext}`;
  }

  const songs = useQuery<{ rows: SongRow[]; total: number }>({
    queryKey: ["songs", filters],
    queryFn: async () => {
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;

      let query = supabase
        .from("songs")
        .select("id,title,artist,cover_url,storage_path,is_published,created_at,updated_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false });

      if (filters.publishedFilter === "published") {
        query = query.eq("is_published", true);
      } else if (filters.publishedFilter === "draft") {
        query = query.eq("is_published", false);
      }

      const q = filters.search.trim();
      if (q) {
        query = query.or(`title.ilike.%${q}%,artist.ilike.%${q}%`);
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      return {
        rows: (data ?? []) as SongRow[],
        total: count ?? 0,
      };
    },
    refetchInterval: 12_000,
    refetchIntervalInBackground: true,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ["songs"] });
      }, 300);
    };

    const channel = supabase
      .channel(`admin:songs:${crypto.randomUUID()}`)
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

  const createSong = useMutation({
    mutationFn: async (payload: {
      title: string;
      artist: string;
      cover_url?: string;
      lyrics?: string;
      lyrics_lrc?: string;
      file: File;
    }) => {
      setUploadProgress(10);
      const path = getSafeStoragePath(payload.file.name);

      const { error: uploadError } = await supabase.storage
        .from("songs-private")
        .upload(path, payload.file);

      if (uploadError) {
        setUploadProgress(0);
        throw uploadError;
      }
      setUploadProgress(70);

      const { data: inserted, error: insertError } = await supabase
        .from("songs")
        .insert({
          title: payload.title,
          artist: payload.artist,
          cover_url: payload.cover_url ?? null,
          lyrics: payload.lyrics ?? null,
          lyrics_lrc: payload.lyrics_lrc ?? null,
          storage_path: path,
          is_published: true,
        })
        .select()
        .single();

      if (insertError) {
        await supabase.storage.from("songs-private").remove([path]);
        setUploadProgress(0);
        throw insertError;
      }

      setUploadProgress(100);
      return inserted as SongRow;
    },
    onSuccess: async (song) => {
      qc.invalidateQueries({ queryKey: ["songs"] });
      toast.success("Morceau cree");
      try {
        await broadcastPush({
          topic: "song_updates",
          title: "Nouveau son disponible",
          body: `${song.title} - ${song.artist}`,
          data: { song_id: String(song.id) },
        });
      } catch (_) {
        toast.error("Morceau cree, mais notif push non envoyee");
      }
      setTimeout(() => setUploadProgress(0), 600);
    },
    onError: (e: any) => {
      setUploadProgress(0);
      toast.error(e.message);
    },
  });

  const setPublished = useMutation({
    mutationFn: async (payload: { songId: number; isPublished: boolean }) => {
      const { error } = await supabase.rpc("admin_set_song_published", {
        p_song_id: payload.songId,
        p_is_published: payload.isPublished,
      });
      if (error) throw error;
    },
    onSuccess: async (_, vars) => {
      qc.invalidateQueries({ queryKey: ["songs"] });
      toast.success(vars.isPublished ? "Morceau publie" : "Morceau depublie");
      if (!vars.isPublished) return;

      const row = songs.data?.rows.find((item) => item.id === vars.songId);
      const title = row?.title ?? "Un nouveau son";
      const artist = row?.artist ?? "2Block";
      try {
        await broadcastPush({
          topic: "song_updates",
          title: "Nouveau son disponible",
          body: `${title} - ${artist}`,
          data: { song_id: String(vars.songId) },
        });
      } catch (_) {
        toast.error("Morceau publie, mais notif push non envoyee");
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSong = useMutation({
    mutationFn: async (payload: {
      songId: number;
      title: string;
      artist: string;
      cover_url?: string;
      lyrics?: string;
      lyrics_lrc?: string;
    }) => {
      const { data, error } = await supabase
        .from("songs")
        .update({
          title: payload.title,
          artist: payload.artist,
          cover_url: payload.cover_url ?? null,
          lyrics: payload.lyrics ?? null,
          lyrics_lrc: payload.lyrics_lrc ?? null,
        })
        .eq("id", payload.songId)
        .select("*")
        .single();
      if (error) throw error;
      return data as SongRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["songs"] });
      toast.success("Morceau mis a jour");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSong = useMutation({
    mutationFn: async (payload: { songId: number; storagePath: string }) => {
      const { error: deleteError } = await supabase
        .from("songs")
        .delete()
        .eq("id", payload.songId);
      if (deleteError) throw deleteError;

      if (payload.storagePath.trim()) {
        const { error: storageError } = await supabase.storage
          .from("songs-private")
          .remove([payload.storagePath]);
        if (storageError) throw storageError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["songs"] });
      toast.success("Morceau supprime");
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function getSongDetails(songId: number) {
    const { data, error } = await supabase
      .from("songs")
      .select("id,title,artist,cover_url,lyrics,lyrics_lrc")
      .eq("id", songId)
      .single();
    if (error) throw error;
    return data as {
      id: number;
      title: string;
      artist: string;
      cover_url: string | null;
      lyrics: string | null;
      lyrics_lrc: string | null;
    };
  }

  return { songs, createSong, setPublished, updateSong, deleteSong, uploadProgress, getSongDetails };
}
