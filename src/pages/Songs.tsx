import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { SongForm } from "@/features/songs/SongForm";
import { useSongSocialStats } from "@/features/songs/useSongSocialStats";
import { useSongs } from "@/features/songs/useSongs";

export default function SongsPage() {
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);
  const [editingSongId, setEditingSongId] = useState<number | null>(null);
  const [editInitialValues, setEditInitialValues] = useState<{
    title: string;
    artist: string;
    cover_url?: string;
    lyrics?: string;
    lyrics_lrc?: string;
  } | null>(null);

  const pageSize = 8;
  const { songs, createSong, setPublished, updateSong, deleteSong, uploadProgress, getSongDetails } = useSongs({
    page,
    pageSize,
    search,
    publishedFilter,
  });

  const rows = songs.data?.rows ?? [];
  const socialStats = useSongSocialStats(rows.map((song) => song.id));
  const total = songs.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  function resetEditMode() {
    setEditingSongId(null);
    setEditInitialValues(null);
  }

  async function handleStartEdit(songId: number) {
    try {
      const details = await getSongDetails(songId);
      setEditingSongId(songId);
      setEditInitialValues({
        title: details.title,
        artist: details.artist,
        cover_url: details.cover_url ?? "",
        lyrics: details.lyrics ?? "",
        lyrics_lrc: details.lyrics_lrc ?? "",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      toast.error(e.message ?? "Impossible de charger le détail du morceau");
    }
  }

  const isEditing = editingSongId !== null && editInitialValues !== null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="theme-title-gradient-soft text-xl font-bold">
          Morceaux
        </h1>
        <p className="theme-text-muted text-sm">
          Upload direct avec drag and drop, édition via formulaire, publication et suppression.
        </p>
        <p className="theme-text-muted mt-1 text-xs">
          Notification push automatique: création publiée ou publication d&apos;un brouillon.
        </p>
      </div>

      <SongForm
        mode={isEditing ? "edit" : "create"}
        initialValues={isEditing ? editInitialValues : undefined}
        loading={isEditing ? updateSong.isPending : createSong.isPending}
        uploadProgress={uploadProgress}
        onCancelEdit={isEditing ? resetEditMode : undefined}
        onSubmit={async (values) => {
          if (isEditing) {
            if (!editingSongId) return;
            await updateSong.mutateAsync({
              songId: editingSongId,
              title: values.title.trim(),
              artist: values.artist.trim(),
              cover_url: values.cover_url?.trim() || undefined,
              lyrics: values.lyrics?.trim() || undefined,
              lyrics_lrc: values.lyrics_lrc?.trim() || undefined,
            });
            resetEditMode();
            return;
          }

          if (!values.file) {
            toast.error("Fichier audio requis");
            return;
          }

          await createSong.mutateAsync({
            title: values.title.trim(),
            artist: values.artist.trim(),
            cover_url: values.cover_url?.trim() || undefined,
            lyrics: values.lyrics?.trim() || undefined,
            lyrics_lrc: values.lyrics_lrc?.trim() || undefined,
            file: values.file,
          });
          setPage(1);
        }}
      />

      <div className="theme-section grid gap-2 rounded-[24px] border p-3 md:grid-cols-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Recherche titre / artiste"
          className="theme-input rounded-xl px-3 py-2 text-sm"
        />
        <select
          value={publishedFilter}
          onChange={(e) => {
            setPublishedFilter(e.target.value as "all" | "published" | "draft");
            setPage(1);
          }}
          className="theme-input rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">Tous</option>
          <option value="published">Publiés</option>
          <option value="draft">Brouillons</option>
        </select>
        <div className="theme-text-muted flex items-center justify-end text-xs">{total} résultat(s)</div>
      </div>

      {songs.isLoading ? (
        <p className="theme-text-muted text-sm">Chargement des morceaux...</p>
      ) : songs.error ? (
        <EmptyState title="Échec du chargement des morceaux" description="Vérifie les policies RLS et le rôle admin." />
      ) : (songs.data?.total ?? 0) === 0 && !search.trim() && publishedFilter === "all" ? (
        <EmptyState title="Aucun morceau pour le moment" description="Ajoute ton premier morceau ci-dessus." />
      ) : total === 0 ? (
        <EmptyState title="Aucun résultat" description="Ajuste la recherche ou le filtre." />
      ) : (
        <>
          <div className="glass overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="theme-table-head">
                  <tr>
                    <th className="hidden px-3 py-3 font-semibold tracking-wide sm:table-cell">ID</th>
                    <th className="px-3 py-3 font-semibold tracking-wide">Morceau</th>
                    <th className="hidden px-3 py-3 font-semibold tracking-wide md:table-cell">Cover URL</th>
                    <th className="hidden px-3 py-3 font-semibold tracking-wide lg:table-cell">Engagement</th>
                    <th className="px-3 py-3 font-semibold tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="theme-table-body divide-y divide-white/8">
                  {rows.map((song) => (
                    <tr
                      key={song.id}
                      className={editingSongId === song.id ? "bg-violet-500/10 theme-text-soft" : "theme-text-soft"}
                    >
                      <td className="hidden px-3 py-3 sm:table-cell">{song.id}</td>
                      <td className="px-3 py-3">
                        <div className="min-w-[150px]">
                          <p className="theme-text-main font-semibold">{song.title}</p>
                          <p className="theme-text-muted text-xs">{song.artist}</p>
                        </div>
                      </td>
                      <td className="theme-text-muted hidden max-w-[220px] truncate px-3 py-3 text-xs md:table-cell">
                        {song.cover_url?.trim() || "-"}
                      </td>
                      <td className="hidden px-3 py-3 lg:table-cell">
                        <div className="flex min-w-[130px] flex-wrap gap-2">
                          <span className="inline-flex rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs font-semibold text-fuchsia-300">
                            {socialStats.data?.get(song.id)?.likes_count ?? 0} likes
                          </span>
                          <span className="inline-flex rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300">
                            {socialStats.data?.get(song.id)?.comments_count ?? 0} commentaires
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex min-w-[132px] flex-col gap-2 sm:min-w-[180px] sm:flex-row sm:flex-wrap">
                          {!song.is_published ? (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await setPublished.mutateAsync({
                                    songId: song.id,
                                    isPublished: true,
                                  });
                                } catch {
                                  toast.error("Échec de mise à jour du statut de publication");
                                }
                              }}
                              disabled={setPublished.isPending}
                              className="theme-button-success rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                            >
                              {setPublished.isPending ? "Publication..." : "Publier"}
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleStartEdit(song.id)}
                            className="theme-button-brand rounded-xl px-3 py-2 text-xs font-semibold"
                          >
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              const ok = window.confirm(`Supprimer "${song.title}" ?`);
                              if (!ok) return;
                              await deleteSong.mutateAsync({
                                songId: song.id,
                                storagePath: song.storage_path,
                              });
                              if (editingSongId === song.id) {
                                resetEditMode();
                              }
                            }}
                            disabled={deleteSong.isPending}
                            className="theme-button-danger rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                          >
                            {deleteSong.isPending ? "Suppression..." : "Supprimer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="theme-button-secondary rounded-xl px-3 py-1 text-sm disabled:opacity-50"
            >
              Préc
            </button>
            <span className="theme-text-muted text-sm">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="theme-button-secondary rounded-xl px-3 py-1 text-sm disabled:opacity-50"
            >
              Suiv
            </button>
          </div>
        </>
      )}
    </div>
  );
}
