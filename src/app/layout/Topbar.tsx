import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Activity, LogOut, Menu, MoonStar, Sparkles, SunMedium } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/useAuth";
import { useTheme } from "@/features/theme/ThemeProvider";

export function Topbar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const isNetworkBusy = fetching + mutating > 0;

  async function onLogout() {
    const { error } = await logout();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Session fermee");
    navigate("/login");
  }

  return (
    <header className="relative sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-[color:var(--panel)]/80 px-4 py-4 backdrop-blur-xl md:px-6">
      {isNetworkBusy ? (
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-white/[0.08]">
          <div className="theme-button-brand h-full w-1/3 animate-pulse rounded" />
        </div>
      ) : null}
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          className="theme-button-secondary inline-flex rounded-xl p-2 md:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu size={16} />
        </button>
        <div className="min-w-0">
          <p className="theme-text-muted text-xs uppercase tracking-[0.24em]">Web Admin</p>
          <p className="theme-text-main max-w-[12rem] truncate text-sm font-medium sm:max-w-[22rem]">
            {profile?.artist_name?.trim() || profile?.full_name?.trim() || user?.email || "Utilisateur inconnu"}
          </p>
          {isNetworkBusy ? (
            <p className="theme-sync-text mt-1 text-xs">Synchronisation en cours...</p>
          ) : null}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <span className="soft-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            <Sparkles size={12} />
            Edition Studio
          </span>
          <span className="soft-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            <Activity size={12} />
            Flux live
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-button-secondary inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
          aria-label={theme === "dark" ? "Activer le theme clair" : "Activer le theme sombre"}
        >
          {theme === "dark" ? <SunMedium size={16} /> : <MoonStar size={16} />}
          {theme === "dark" ? "Clair" : "Sombre"}
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="theme-button-secondary inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
        >
          <LogOut size={16} />
          Deconnexion
        </button>
      </div>
    </header>
  );
}
