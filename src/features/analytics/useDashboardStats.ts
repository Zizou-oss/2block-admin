import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

type DashboardKpis = {
  total_events: number;
  unique_users: number;
  total_seconds: number;
  total_downloads: number;
};

type ListeningRow = {
  song_id: number;
  song_title: string;
  song_artist: string;
  day: string;
  plays_count: number;
  seconds_total: number;
};

type TopSongRow = {
  song_id: number;
  title: string;
  artist: string;
  plays_count: number;
  seconds_total: number;
};

function toIsoDay(value: string) {
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export function useDashboardStats() {
  const qc = useQueryClient();

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ["dashboard"] });
      }, 300);
    };

    const channel = supabase
      .channel(`admin:dashboard:${crypto.randomUUID()}`)
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
        { event: "*", schema: "public", table: "songs" },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
    const dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const [kpisRes, eventsRes, topRes] = await Promise.all([
      supabase.from("admin_dashboard_kpis").select("*").single(),
      supabase
        .from("admin_listening_events_daily")
        .select("day,song_id,song_title,song_artist,plays_count,seconds_total")
        .gte("day", dateFrom)
        .order("day", { ascending: true })
        .limit(20_000),
      supabase
        .from("admin_song_stats")
        .select("song_id,title,artist,plays_count,seconds_total")
          .order("plays_count", { ascending: false })
          .limit(10),
      ]);

      if (kpisRes.error && eventsRes.error && topRes.error) {
        throw kpisRes.error;
      }

      const kpis = (kpisRes.data as DashboardKpis | null) ?? {
        total_events: 0,
        unique_users: 0,
        total_seconds: 0,
        total_downloads: 0,
      };
      const listeningRows = (eventsRes.data ?? []) as ListeningRow[];
      const topRows = (topRes.data ?? []) as TopSongRow[];

      const perDayMap = listeningRows.reduce<Record<string, number>>((acc, row) => {
        const day = toIsoDay(row.day);
        acc[day] = (acc[day] ?? 0) + (row.plays_count ?? 0);
        return acc;
      }, {});

      const trendingSongs = topRows
        .filter((row) => (row.plays_count ?? 0) > 0)
        .slice(0, 5)
        .map((row) => ({
          songId: row.song_id,
          title: row.title,
          artist: row.artist,
        }));

      const trendPalette = ["#0f766e", "#f97316", "#2563eb", "#7c3aed", "#dc2626"];
      const trendSeries = trendingSongs.map((song, index) => ({
        key: `song_${song.songId}`,
        label: `${song.title} - ${song.artist}`,
        color: trendPalette[index % trendPalette.length],
      }));

      const trendSeriesBySongId = new Map<number, string>(
        trendSeries.map((series, index) => [trendingSongs[index].songId, series.key]),
      );
      const sortedDays = Object.keys(perDayMap).sort((a, b) => a.localeCompare(b));
      const trendRowsByDate = new Map<string, Record<string, number | string>>();

      for (const day of sortedDays) {
        const baseRow: Record<string, number | string> = { date: day };
        for (const series of trendSeries) {
          baseRow[series.key] = 0;
        }
        trendRowsByDate.set(day, baseRow);
      }

      for (const row of listeningRows) {
        const day = toIsoDay(row.day);
        const seriesKey = trendSeriesBySongId.get(row.song_id);
        if (!seriesKey) continue;
        const trendRow = trendRowsByDate.get(day);
        if (!trendRow) continue;
        trendRow[seriesKey] = Number(trendRow[seriesKey] ?? 0) + (row.plays_count ?? 0);
      }

      const topSongs = topRows.map((row) => ({
        title: row.title,
        artist: row.artist,
        plays: row.plays_count ?? 0,
        seconds: row.seconds_total ?? 0,
      }));

      return {
        totalEvents: kpis.total_events ?? 0,
        uniqueListeners: kpis.unique_users ?? 0,
        totalSeconds: kpis.total_seconds ?? 0,
        totalDownloads: kpis.total_downloads ?? 0,
        perDay: sortedDays.map((date) => ({
          date,
          value: perDayMap[date] ?? 0,
        })),
        songTrends: Array.from(trendRowsByDate.values()),
        trendSeries,
        topSongs,
      };
    },
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });
}
