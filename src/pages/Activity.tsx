import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { fetchActivityForExport, useActivity } from "@/features/activity/useActivity";
import { useSongCommentsModeration } from "@/features/activity/useSongCommentsModeration";
import { useSupportDeclarations } from "@/features/activity/useSupportDeclarations";

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const [supportPage, setSupportPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [userEmail, setUserEmail] = useState("");
  const [songQuery, setSongQuery] = useState("");
  const [isOffline, setIsOffline] = useState<"all" | "online" | "offline">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const pageSize = 20;

  const filters = useMemo(
    () => ({
      page,
      pageSize,
      userEmail,
      songQuery,
      isOffline,
      dateFrom,
      dateTo,
    }),
    [page, userEmail, songQuery, isOffline, dateFrom, dateTo],
  );

  const { data, isLoading, error } = useActivity(filters);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const supportPageSize = 10;
  const {
    data: supportData,
    isLoading: isSupportLoading,
    error: supportError,
  } = useSupportDeclarations({
    page: supportPage,
    pageSize: supportPageSize,
  });
  const supportRows = supportData?.rows ?? [];
  const supportTotal = supportData?.total ?? 0;
  const supportTotalPages = Math.max(1, Math.ceil(supportTotal / supportPageSize));
  const commentsPageSize = 8;
  const {
    comments,
    deleteComment,
  } = useSongCommentsModeration({
    page: commentsPage,
    pageSize: commentsPageSize,
  });
  const commentRows = comments.data?.rows ?? [];
  const commentsTotal = comments.data?.total ?? 0;
  const commentsTotalPages = Math.max(1, Math.ceil(commentsTotal / commentsPageSize));

  function resetPageOnFilterChange() {
    setPage(1);
  }

  async function exportCsv() {
    setExporting(true);
    const exportRows = await fetchActivityForExport(filters).catch((e: any) => {
      toast.error(e.message ?? "Export impossible");
      return [];
    });
    setExporting(false);
    if (exportRows.length === 0) {
      toast.error("Aucune ligne a exporter");
      return;
    }

    const header = ["user_name", "user_email", "song_title", "song_artist", "seconds_listened", "started_at", "is_offline"];
    const lines = exportRows.map((r) =>
      [
        r.user_name,
        r.user_email,
        r.song_title,
        r.song_artist,
        String(r.seconds_listened),
        r.started_at,
        String(r.is_offline),
      ]
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `activite_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exporte");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="theme-title-gradient-soft text-xl font-bold">
          Activite
        </h1>
        <p className="theme-text-muted text-sm">Qui a ecoute quoi et quand.</p>
      </div>

      <div className="theme-section grid gap-2 rounded-[24px] border p-3 md:grid-cols-6">
        <input
          value={userEmail}
          onChange={(e) => {
            setUserEmail(e.target.value);
            resetPageOnFilterChange();
          }}
          placeholder="Email utilisateur"
          className="theme-input rounded-xl px-2 py-2 text-sm"
        />
        <input
          value={songQuery}
          onChange={(e) => {
            setSongQuery(e.target.value);
            resetPageOnFilterChange();
          }}
          placeholder="Titre/artiste"
          className="theme-input rounded-xl px-2 py-2 text-sm"
        />
        <select
          value={isOffline}
          onChange={(e) => {
            setIsOffline(e.target.value as "all" | "online" | "offline");
            resetPageOnFilterChange();
          }}
          className="theme-input rounded-xl px-2 py-2 text-sm"
        >
          <option value="all">Tous</option>
          <option value="online">En ligne uniquement</option>
          <option value="offline">Sync hors ligne uniquement</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            resetPageOnFilterChange();
          }}
          className="theme-input rounded-xl px-2 py-2 text-sm"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            resetPageOnFilterChange();
          }}
          className="theme-input rounded-xl px-2 py-2 text-sm"
        />
        <button
          type="button"
          onClick={exportCsv}
          disabled={exporting}
          className="theme-button-secondary inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
        >
          <Download size={14} />
          {exporting ? "Export..." : "Exporter CSV"}
        </button>
      </div>

      {isLoading ? (
        <p className="theme-text-muted text-sm">Chargement de l'activite...</p>
      ) : error ? (
        <EmptyState title="Impossible de charger l'activite" />
      ) : rows.length === 0 ? (
        <EmptyState title="Aucune activite pour le moment" />
      ) : (
        <>
          <DataTable headers={["Date", "Utilisateur", "Morceau", "Duree", "Mode"]}>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="theme-text-muted px-4 py-3 text-xs">
                  {new Date(row.started_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="theme-text-main font-medium">{row.user_name}</div>
                  <div className="theme-text-muted text-xs">{row.user_email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="theme-text-main font-medium">{row.song_title}</div>
                  <div className="theme-text-muted text-xs">{row.song_artist}</div>
                </td>
                <td className="theme-text-soft px-4 py-3 font-medium">
                  {formatSeconds(row.seconds_listened)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      row.is_offline ? "bg-amber-500/15 text-amber-300" : "bg-sky-500/15 text-sky-300"
                    }`}
                  >
                    {row.is_offline ? "sync hors ligne" : "en ligne"}
                  </span>
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="theme-text-main text-lg font-semibold">Soutiens declarés</h2>
            <p className="theme-text-muted text-sm">
              Declaration utilisateur apres un soutien USSD. Ce tableau n'est pas une preuve operateur.
            </p>
          </div>
          <div className="theme-badge theme-text-soft w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
            {supportTotal} declaration{supportTotal > 1 ? "s" : ""}
          </div>
        </div>

        {isSupportLoading ? (
          <p className="theme-text-muted text-sm">Chargement des soutiens...</p>
        ) : supportError ? (
          <EmptyState title="Impossible de charger les soutiens declarés" />
        ) : supportRows.length === 0 ? (
          <EmptyState
            title="Aucun soutien declaré"
            description="Les confirmations envoyees depuis l'application apparaitront ici."
          />
        ) : (
          <>
            <DataTable headers={["Date", "Utilisateur", "Montant", "Canal", "Version"]}>
              {supportRows.map((row) => (
                <tr key={row.id}>
                  <td className="theme-text-muted px-4 py-3 text-xs">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="theme-text-main font-medium">{row.user_name}</div>
                    <div className="theme-text-muted text-xs">{row.user_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {formatFcfa(row.amount_fcfa)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs font-semibold uppercase text-fuchsia-300">
                      {row.channel}
                    </span>
                  </td>
                  <td className="theme-text-soft px-4 py-3 text-sm font-medium">
                    {row.app_version || "--"}
                  </td>
                </tr>
              ))}
            </DataTable>
            <Pagination
              page={supportPage}
              totalPages={supportTotalPages}
              onChange={setSupportPage}
            />
          </>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="theme-text-main text-lg font-semibold">Commentaires des morceaux</h2>
            <p className="theme-text-muted text-sm">
              Modération simple des avis publiés depuis l'application.
            </p>
          </div>
          <div className="theme-badge theme-text-soft w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
            {commentsTotal} commentaire{commentsTotal > 1 ? "s" : ""}
          </div>
        </div>

        {comments.isLoading ? (
          <p className="theme-text-muted text-sm">Chargement des commentaires...</p>
        ) : comments.error ? (
          <EmptyState title="Impossible de charger les commentaires" />
        ) : commentRows.length === 0 ? (
          <EmptyState
            title="Aucun commentaire pour le moment"
            description="Les commentaires envoyés depuis l'application apparaîtront ici."
          />
        ) : (
          <>
            <DataTable headers={["Date", "Utilisateur", "Morceau", "Commentaire", "Action"]}>
              {commentRows.map((row) => (
                <tr key={row.id}>
                  <td className="theme-text-muted px-4 py-3 text-xs">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="theme-text-main font-medium">{row.user_name}</div>
                    <div className="theme-text-muted text-xs">{row.user_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="theme-text-main font-medium">{row.song_title}</div>
                    <div className="theme-text-muted text-xs">{row.song_artist}</div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="theme-text-soft max-w-[360px] whitespace-pre-wrap text-sm">
                      {row.body}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = window.confirm("Supprimer ce commentaire ?");
                        if (!ok) return;
                        await deleteComment.mutateAsync(row.id);
                      }}
                      disabled={deleteComment.isPending}
                      className="theme-button-danger rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      {deleteComment.isPending ? "Suppression..." : "Supprimer"}
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>
            <Pagination
              page={commentsPage}
              totalPages={commentsTotalPages}
              onChange={setCommentsPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

function formatSeconds(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function formatFcfa(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}
