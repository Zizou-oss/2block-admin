import { Navigate } from "react-router-dom";
import { MoonStar, SunMedium } from "lucide-react";

import { LoginForm } from "@/features/auth/LoginForm";
import { useAuth } from "@/features/auth/useAuth";
import { useTheme } from "@/features/theme/ThemeProvider";

export default function LoginPage() {
  const { user, isAdmin, isArtist, loading, role, authError, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!loading && user && (isAdmin || isArtist)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 md:p-8">
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-button-secondary absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
      >
        {theme === "dark" ? <SunMedium size={16} /> : <MoonStar size={16} />}
        {theme === "dark" ? "Clair" : "Sombre"}
      </button>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -right-24 bottom-20 h-96 w-96 rounded-full bg-emerald-400/16 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-300/12 blur-3xl" />
      </div>
      <div className="glass theme-shell page-enter relative grid w-full max-w-6xl overflow-hidden rounded-[34px] border md:grid-cols-[1.05fr_0.95fr]">
        <section className="theme-hero-card relative border-b border-white/10 p-7 md:border-b-0 md:border-r md:p-10">
          <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/16 blur-3xl" />
          <p className="theme-hero-kicker text-xs font-semibold uppercase tracking-[0.24em]">2Block Music</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            Studio web pour artistes.
          </h1>
          <p className="theme-hero-copy mt-4 max-w-lg text-sm leading-relaxed md:text-base">
            Publie des morceaux, pilote tes stats et construit ton image avec une console moderne pensée pour les équipes créatives.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="theme-hero-pill rounded-2xl px-4 py-3 text-sm">
              <p className="font-semibold">Publication rapide</p>
              <p className="mt-1 text-xs opacity-80">Upload, cover, paroles et mise en ligne instantanée.</p>
            </div>
            <div className="theme-hero-pill rounded-2xl px-4 py-3 text-sm">
              <p className="font-semibold">Suivi live</p>
              <p className="mt-1 text-xs opacity-80">Ecoutes, commentaires, tendances et activité en direct.</p>
            </div>
          </div>
        </section>
        <section className="relative p-6 md:p-8">
          <p className="theme-sync-text text-xs font-semibold uppercase tracking-[0.24em]">Espace artiste</p>
          <h2 className="theme-title-gradient mt-2 text-3xl font-extrabold">
            Connexion
          </h2>
          <p className="theme-text-muted mt-2 text-sm">
            Connecte-toi ou crée ton compte pour accéder au tableau de bord.
          </p>
          <div className="mt-6">
          {authError && !user ? (
            <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              Détail technique : {authError}
            </div>
          ) : null}
          {!loading && user && !isAdmin && !isArtist ? (
            <div className="space-y-4">
              <div className="theme-section rounded-2xl border p-4">
                <p className="theme-text-main text-sm font-semibold">Compte connecté mais non autorisé</p>
                <p className="theme-text-muted mt-2 text-sm">
                  Ce compte Google existe bien, mais son rôle actuel est{" "}
                  <span className="theme-text-main font-semibold">{role ?? "inconnu"}</span>.
                </p>
                <p className="theme-text-muted mt-2 text-sm">
                  Pour accéder au web artiste, le profil doit avoir le rôle <span className="theme-text-main font-semibold">artist</span>{" "}
                  ou <span className="theme-text-main font-semibold">admin</span> dans <code>profiles</code>.
                </p>
                {authError ? (
                  <p className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    Détail technique : {authError}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="theme-button-secondary w-full rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                Se déconnecter
              </button>
            </div>
          ) : (
            <LoginForm />
          )}
          </div>
        </section>
      </div>
    </div>
  );
}
