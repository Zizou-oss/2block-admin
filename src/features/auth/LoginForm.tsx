import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase";

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [artistName, setArtistName] = useState("");
  const [artistPhotoUrl, setArtistPhotoUrl] = useState("");
  const [artistBio, setArtistBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      if (trimmedPassword.length < 8) {
        toast.error("Mot de passe trop court (min 8 caracteres)");
        return;
      }
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            role: "artist",
            full_name: artistName.trim(),
            artist_name: artistName.trim(),
            artist_photo_url: artistPhotoUrl.trim() || null,
            artist_bio: artistBio.trim() || null,
          },
        },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
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
            <label className="theme-text-soft mb-1 block text-sm font-medium">Photo (URL, optionnel)</label>
            <input
              type="url"
              value={artistPhotoUrl}
              onChange={(e) => setArtistPhotoUrl(e.target.value)}
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

      {mode === "signup" ? (
        <p className="theme-text-muted text-xs">
          Un email de confirmation sera envoyé pour activer ton espace artiste.
        </p>
      ) : null}
    </form>
  );
}
