import { useEffect, useRef, useState } from "react";

export type SongFormValues = {
  title: string;
  artist: string;
  cover_url?: string;
  lyrics?: string;
  lyrics_lrc?: string;
  file?: File;
};

type SongFormMode = "create" | "edit";

type SongFormInitialValues = {
  title: string;
  artist: string;
  cover_url?: string;
  lyrics?: string;
  lyrics_lrc?: string;
};

export function SongForm({
  onSubmit,
  loading,
  uploadProgress = 0,
  mode = "create",
  initialValues,
  onCancelEdit,
}: {
  onSubmit: (values: SongFormValues) => Promise<void>;
  loading?: boolean;
  uploadProgress?: number;
  mode?: SongFormMode;
  initialValues?: SongFormInitialValues;
  onCancelEdit?: () => void;
}) {
  const formContainerRef = useRef<HTMLFormElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("2Block");
  const [coverUrl, setCoverUrl] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [lyricsLrc, setLyricsLrc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitle(initialValues?.title ?? "");
    setArtist(initialValues?.artist ?? "2Block");
    setCoverUrl(initialValues?.cover_url ?? "");
    setLyrics(initialValues?.lyrics ?? "");
    setLyricsLrc(initialValues?.lyrics_lrc ?? "");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [initialValues, mode]);

  useEffect(() => {
    if (mode !== "edit") return;
    formContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const t = setTimeout(() => titleInputRef.current?.focus(), 180);
    return () => clearTimeout(t);
  }, [mode, initialValues]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "create" && !file) return;
    await onSubmit({
      title: title.trim(),
      artist: artist.trim() || "2Block",
      cover_url: coverUrl.trim() || undefined,
      lyrics: lyrics.trim() || undefined,
      lyrics_lrc: lyricsLrc.trim() || undefined,
      file: file ?? undefined,
    });

    if (mode === "create") {
      setTitle("");
      setArtist("2Block");
      setCoverUrl("");
      setLyrics("");
      setLyricsLrc("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function onDropFile(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      if (fileInputRef.current) {
        fileInputRef.current.files = event.dataTransfer.files;
      }
    }
  }

  return (
    <form
      ref={formContainerRef}
      onSubmit={submit}
      className="theme-section grid gap-3 rounded-[28px] border p-4 md:grid-cols-2"
    >
      <div className="md:col-span-2 mb-1 flex items-center justify-between">
        <h2 className="theme-text-main text-sm font-semibold">
          {mode === "edit" ? "Modifier le morceau" : "Ajouter un nouveau morceau"}
        </h2>
        {mode === "edit" && onCancelEdit ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="theme-button-secondary rounded-xl px-2 py-1 text-xs"
          >
            Quitter l'édition
          </button>
        ) : null}
      </div>
      <input
        ref={titleInputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Titre"
        className="theme-input rounded-xl px-3 py-2"
      />
      <input
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        required
        placeholder="Artiste"
        className="theme-input rounded-xl px-3 py-2"
      />
      <input
        value={coverUrl}
        onChange={(e) => setCoverUrl(e.target.value)}
        placeholder="URL de cover (optionnel)"
        className="theme-input rounded-xl px-3 py-2"
      />
      <textarea
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        placeholder="Paroles (optionnel)"
        rows={5}
        className="theme-input rounded-xl px-3 py-2 md:col-span-2"
      />
      <textarea
        value={lyricsLrc}
        onChange={(e) => setLyricsLrc(e.target.value)}
        placeholder={"Paroles synchronisees LRC (optionnel)\n[00:12.50] Premiere ligne"}
        rows={6}
        className="theme-input rounded-xl px-3 py-2 md:col-span-2"
      />
      {mode === "create" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDropFile}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-[24px] border-2 border-dashed px-4 py-6 text-center md:col-span-2 ${
            isDragOver ? "border-violet-400 bg-violet-500/12" : "theme-surface-soft border-white/12"
          }`}
        >
          <p className="theme-text-main text-sm font-medium">Glisse-dépose ton fichier audio ici</p>
          <p className="theme-text-muted mt-1 text-xs">ou clique pour choisir un fichier (.mp3, .m4a, .wav...)</p>
          {file ? <p className="theme-sync-text mt-2 text-xs">Fichier: {file.name}</p> : null}
          <input
            ref={fileInputRef}
            id="song-file-input"
            type="file"
            accept=".mp3,.m4a,.wav,.aac,.ogg"
            required={mode === "create"}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </div>
      ) : null}
      <div className="md:col-span-2">
        {loading ? (
          <div className="mb-2">
            <div className="theme-text-muted mb-1 flex items-center justify-between text-xs">
              <span>Progression de l'upload</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="h-2 w-full rounded bg-white/[0.08]">
              <div
                className="h-2 rounded bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                style={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }}
              />
            </div>
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 disabled:opacity-50"
        >
          {loading
            ? mode === "edit"
              ? "Mise à jour..."
              : "Upload + enregistrement..."
            : mode === "edit"
              ? "Enregistrer les modifications"
              : "Uploader le morceau"}
        </button>
      </div>
    </form>
  );
}
