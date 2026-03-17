import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/useAuth";

export default function ArtistProfilePage() {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [bio, setBio] = useState("");

  useEffect(() => {
    setName(profile?.artist_name?.trim() || profile?.full_name?.trim() || "");
    setPhotoUrl(profile?.artist_photo_url?.trim() || "");
    setBio(profile?.artist_bio?.trim() || "");
  }, [profile]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    let nextPhotoUrl = photoUrl.trim() || null;

    if (photoFile) {
      const extMatch = photoFile.name.toLowerCase().match(/\.[a-z0-9]+$/);
      const ext = extMatch ? extMatch[0] : ".jpg";
      const path = `artists/${user.id}/${crypto.randomUUID()}${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("artist-photos")
        .upload(path, photoFile, { upsert: true });
      if (uploadError) {
        setSaving(false);
        toast.error(uploadError.message);
        return;
      }
      const { data: publicData } = supabase.storage.from("artist-photos").getPublicUrl(path);
      nextPhotoUrl = publicData?.publicUrl ?? null;
    }

    const payload = {
      artist_name: name.trim() || null,
      artist_photo_url: nextPhotoUrl,
      artist_bio: bio.trim() || null,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profil artiste mis a jour");
    setPhotoFile(null);
    setPhotoUrl(nextPhotoUrl || "");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="theme-title-gradient-soft text-xl font-bold">Profil artiste</h1>
        <p className="theme-text-muted text-sm">Nom, photo et bio publiques pour tes morceaux.</p>
      </div>

      <div className="theme-section rounded-[24px] border p-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom d'artiste"
          className="theme-input rounded-xl px-3 py-2 text-sm"
        />
        <div className="space-y-2">
          <label className="theme-text-soft block text-sm font-medium">Photo artiste (upload)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            className="theme-input rounded-xl px-3 py-2 text-sm"
          />
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Photo artiste"
              className="h-24 w-24 rounded-2xl object-cover ring-1 ring-white/10"
            />
          ) : null}
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio artiste (optionnel)"
          rows={5}
          className="theme-input rounded-xl px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
