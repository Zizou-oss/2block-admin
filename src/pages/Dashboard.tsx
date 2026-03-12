import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Clock3, Download, Headphones, Sparkles, Users, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { useDashboardStats } from "@/features/analytics/useDashboardStats";

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="glass panel-spotlight kpi-card page-enter rounded-[26px] p-4">
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="theme-text-muted text-xs uppercase tracking-[0.18em]">{title}</p>
          <p className="theme-text-main mt-2 text-3xl font-extrabold">{value}</p>
          <p className="theme-text-muted mt-2 text-xs">{description}</p>
        </div>
        <div className="theme-accent-box flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const safeData = data ?? {
    totalEvents: 0,
    uniqueListeners: 0,
    totalSeconds: 0,
    totalDownloads: 0,
    perDay: [] as Array<{ date: string; value: number }>,
    songTrends: [] as Array<Record<string, number | string>>,
    trendSeries: [] as Array<{ key: string; label: string; color: string }>,
    topSongs: [] as Array<{ title: string; artist: string; plays: number; seconds: number }>,
  };

  return (
    <div className="page-enter space-y-6">
      <div className="panel-spotlight glass overflow-hidden rounded-[28px] p-5 md:p-6">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="soft-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
              <Sparkles size={12} />
              Vue d'ensemble
            </div>
            <h1 className="theme-title-gradient mt-4 text-3xl font-extrabold md:text-4xl">
              Tableau de bord 2Block
            </h1>
            <p className="theme-text-muted mt-3 max-w-xl text-sm leading-relaxed">
              Suivi des écoutes, de l'activité réelle et de la diffusion du catalogue dans une console alignée sur le site public.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="soft-pill rounded-2xl px-4 py-3">
              <p className="theme-text-muted text-[11px] uppercase tracking-[0.18em]">Etat</p>
              <p className="theme-text-main mt-1 text-sm font-semibold">Synchronisation active</p>
            </div>
            <div className="soft-pill rounded-2xl px-4 py-3">
              <p className="theme-text-muted text-[11px] uppercase tracking-[0.18em]">Focus</p>
              <p className="theme-text-main mt-1 text-sm font-semibold">Ecoutes et tendances</p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Donnees partielles chargees. Verifie les permissions Supabase du dashboard.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard title="Total ecoutes" value={safeData.totalEvents} description="Lecture cumulée consolidée" icon={Headphones} />
        <KpiCard title="Auditeurs uniques" value={safeData.uniqueListeners} description="Comptes actifs distincts" icon={Users} />
        <KpiCard title="Secondes ecoutees" value={safeData.totalSeconds} description="Temps global consommé" icon={Clock3} />
        <KpiCard title="Total telechargements" value={safeData.totalDownloads} description="Catalogue emporté hors ligne" icon={Download} />
      </div>

      <div className="glass panel-spotlight rounded-[28px] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="theme-text-main text-base font-semibold">Ecoutes par jour</h2>
          <span className="soft-pill rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            Lecture globale
          </span>
        </div>
        {safeData.perDay.length === 0 ? (
          <EmptyState title="Aucune statistique journaliere" />
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeData.perDay}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <XAxis dataKey="date" hide stroke="#8f88a8" />
                <YAxis stroke="#8f88a8" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(11, 7, 20, 0.96)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    color: "#f7f3ff",
                  }}
                  labelStyle={{ color: "#b6abc9" }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 4, 4]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="glass panel-spotlight rounded-[28px] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="theme-text-main text-base font-semibold">Evolution des ecoutes par morceau</h2>
          <span className="soft-pill rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            Tendances
          </span>
        </div>
        {safeData.songTrends.length === 0 || safeData.trendSeries.length === 0 ? (
          <EmptyState title="Pas assez de donnees pour la courbe des morceaux" />
        ) : (
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeData.songTrends} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <XAxis dataKey="date" hide stroke="#8f88a8" />
                <YAxis stroke="#8f88a8" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(11, 7, 20, 0.96)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    color: "#f7f3ff",
                  }}
                  labelStyle={{ color: "#b6abc9" }}
                />
                <Legend wrapperStyle={{ color: "#d9d4e7" }} />
                {safeData.trendSeries.map((series) => (
                  <Line
                    key={series.key}
                    type="natural"
                    dataKey={series.key}
                    name={series.label}
                    stroke={series.color}
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="glass panel-spotlight rounded-[28px] p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="theme-text-main text-base font-semibold">Top morceaux</h2>
          <span className="soft-pill rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            Classement live
          </span>
        </div>
        {safeData.topSongs.length === 0 ? (
          <EmptyState title="Aucune donnee d'ecoute" />
        ) : (
          <div className="space-y-2">
            {safeData.topSongs.map((song, index) => (
              <div
                key={`${song.title}-${song.artist}`}
                className="theme-surface-soft flex items-center justify-between rounded-2xl border border-white/8 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="theme-accent-box flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-extrabold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="theme-text-main text-sm font-semibold">{song.title}</p>
                    <p className="theme-text-muted text-xs">{song.artist}</p>
                  </div>
                </div>
                <div className="theme-text-muted text-right text-xs">
                  <p>{song.plays} ecoutes</p>
                  <p>{song.seconds}s ecoutees</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
