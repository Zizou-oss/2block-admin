import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Chrome } from "lucide-react";

import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase";

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [artistName, setArtistName] = useState("");
  const [artistPhotoFile, setArtistPhotoFile] = useState<File | null>(null);
  const [artistBio, setArtistBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      toast.error("Email et mot de passe requis");
      return;
    }

    if (mode === "signup") {
      if (!artistName.trim()) {
        toast.error("Nom d'artiste requis");
        return;
      }
      if (!artistPhotoFile) {
        toast.error("Photo artiste requise");
        return;
      }
      if (trimmedPassword.length < 8) {
        toast.error("Mot de passe trop court (min 8 caracteres)");
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            role: "artist",
            full_name: artistName.trim(),
            artist_name: artistName.trim(),
            artist_bio: artistBio.trim() || null,
          },
        },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (artistPhotoFile && data.session?.user) {
        const userId = data.session.user.id;
        const extMatch = artistPhotoFile.name.toLowerCase().match(/\.[a-z0-9]+$/);
        const ext = extMatch ? extMatch[0] : ".jpg";
        const path = `artists/${userId}/${crypto.randomUUID()}${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("artist-photos")
          .upload(path, artistPhotoFile, { upsert: true });
        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from("artist-photos")
            .getPublicUrl(path);
          const publicUrl = publicData?.publicUrl ?? null;
          if (publicUrl) {
            await supabase.from("profiles").update({ artist_photo_url: publicUrl }).eq("id", userId);
          }
        } else {
          toast.error("Upload photo impossible. Reessaye apres confirmation.");
        }
      }
      toast.success("Compte artiste créé. Vérifie ton email pour confirmer.");
      setMode("login");
      return;
    }

    setLoading(true);
    const { error } = await login(trimmedEmail, trimmedPassword);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bienvenue");
    navigate("/");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="theme-section rounded-2xl border p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
              mode === "login"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                : "theme-button-secondary"
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
              mode === "signup"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                : "theme-button-secondary"
            }`}
          >
            Créer un compte
          </button>
        </div>
      </div>

      {mode === "signup" ? (
        <div className="space-y-3">
          <div>
            <label className="theme-text-soft mb-1 block text-sm font-medium">Nom d&apos;artiste</label>
            <input
              type="text"
              required
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="theme-input w-full rounded-xl px-3 py-2.5"
            />
          </div>
          <div>
            <label className="theme-text-soft mb-1 block text-sm font-medium">Photo artiste (obligatoire)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setArtistPhotoFile(e.target.files?.[0] ?? null)}
              className="theme-input w-full rounded-xl px-3 py-2.5"
            />
          </div>
          <div>
            <label className="theme-text-soft mb-1 block text-sm font-medium">Bio (optionnel)</label>
            <textarea
              value={artistBio}
              onChange={(e) => setArtistBio(e.target.value)}
              rows={3}
              className="theme-input w-full rounded-xl px-3 py-2.5"
            />
          </div>
        </div>
      ) : null}

      <div>
        <label className="theme-text-soft mb-1 block text-sm font-medium">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="theme-input w-full rounded-xl px-3 py-2.5"
        />
      </div>
      <div>
        <label className="theme-text-soft mb-1 block text-sm font-medium">Mot de passe</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="theme-input w-full rounded-xl px-3 py-2.5"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 disabled:opacity-50"
      >
        {loading
          ? mode === "signup"
            ? "Création..."
            : "Connexion..."
          : mode === "signup"
            ? "Créer mon compte artiste"
            : "Se connecter"}
      </button>

      {mode === "login" ? (
        <>
          <div className="theme-text-muted flex items-center gap-3 text-xs uppercase tracking-[0.24em]">
            <span className="h-px flex-1 bg-white/10" />
            <span>ou</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="theme-button-secondary inline-flex w-full items-center justify-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <Chrome size={18} />
            Continuer avec Google
          </button>
        </>
      ) : (
        <p className="theme-text-muted text-xs">
          La creation d&apos;un compte artiste se fait ici par email pour enregistrer le profil et la photo.
        </p>
      )}

      {mode === "signup" ? (
        <p className="theme-text-muted text-xs">
          Un email de confirmation sera envoyé pour activer ton espace artiste.
        </p>
      ) : null}
    </form>
  );
}
