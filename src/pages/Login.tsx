import { Navigate } from "react-router-dom";
import { MoonStar, SunMedium } from "lucide-react";

import { LoginForm } from "@/features/auth/LoginForm";
import { useAuth } from "@/features/auth/useAuth";
import { useTheme } from "@/features/theme/ThemeProvider";

export default function LoginPage() {
  const { user, isAdmin, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!loading && user && isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-button-secondary absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
      >
        {theme === "dark" ? <SunMedium size={16} /> : <MoonStar size={16} />}
        {theme === "dark" ? "Clair" : "Sombre"}
      </button>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-violet-500/24 blur-3xl" />
        <div className="absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-fuchsia-500/18 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>
      <div className="glass theme-shell page-enter relative w-full max-w-md overflow-hidden rounded-[32px] p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
        <p className="theme-sync-text relative text-xs font-semibold uppercase tracking-[0.24em]">2Block</p>
        <h1 className="theme-title-gradient relative mt-2 text-3xl font-extrabold">
          Connexion Admin
        </h1>
        <p className="theme-text-muted relative mt-2 text-sm">Connecte-toi avec ton compte admin.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
