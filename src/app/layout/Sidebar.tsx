import { Activity, BarChart3, Disc3, ListMusic, Settings, Sparkles, Users, User, X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/useAuth";

const navItems = [
  { to: "/dashboard", label: "Tableau de bord", icon: BarChart3, adminOnly: true },
  { to: "/songs", label: "Morceaux", icon: ListMusic },
  { to: "/artist-profile", label: "Profil artiste", icon: User },
  { to: "/users", label: "Utilisateurs", icon: Users, adminOnly: true },
  { to: "/activity", label: "Activite", icon: Activity, adminOnly: true },
  { to: "/settings", label: "Parametres", icon: Settings, adminOnly: true },
];

function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { isAdmin } = useAuth();
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  return (
    <nav className="space-y-1">
      {visibleItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              isActive
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-950/30"
                : "text-[color:var(--text-soft)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--text-main)]",
            )
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="glass page-enter hidden w-72 shrink-0 self-start rounded-3xl p-5 md:sticky md:top-6 md:block md:max-h-[calc(100vh-3rem)] md:overflow-y-auto">
      <div className="panel-spotlight theme-hero-card mb-6 overflow-hidden rounded-[26px] border px-4 py-4">
        <div className="relative flex items-start gap-3">
          <div className="theme-accent-box flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg shadow-violet-950/25">
            <Disc3 size={22} />
          </div>
          <div className="min-w-0">
            <p className="theme-sync-text text-xs font-semibold uppercase tracking-[0.24em]">2Block</p>
            <h1 className="theme-title-gradient text-2xl font-extrabold">
              Admin Musique
            </h1>
            <p className="theme-text-muted mt-2 text-sm">Pilotage, catalogue, activite et diffusion.</p>
          </div>
        </div>
      </div>
      <SidebarLinks />
      <div className="theme-section mt-6 rounded-[24px] border p-4">
        <div className="theme-accent-chip mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          <Sparkles size={12} />
          Console live
        </div>
        <p className="theme-text-main text-sm font-semibold">Même univers que le site public</p>
        <p className="theme-text-muted mt-1 text-xs leading-relaxed">
          Charte sombre, focus violet et lecture visuelle cohérente sur tout l'écosystème 2Block.
        </p>
      </div>
    </aside>
  );
}

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/70 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        aria-label="Fermer le menu"
      />
      <aside
        className={cn(
          "glass panel-spotlight absolute left-0 top-0 h-full w-[84vw] max-w-xs rounded-r-3xl p-4 shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="mb-5 flex items-center justify-between px-1">
          <div>
            <p className="theme-sync-text text-xs font-semibold uppercase tracking-[0.24em]">2Block</p>
            <h2 className="theme-title-gradient-soft text-lg font-extrabold">
              Menu admin
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="theme-button-secondary rounded-lg p-2"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
        <SidebarLinks onNavigate={onClose} />
        <div className="theme-section mt-6 rounded-[22px] border p-4">
          <p className="theme-text-main text-sm font-semibold">Vue mobile premium</p>
          <p className="theme-text-muted mt-1 text-xs">
            Le menu reste fixe, lisible et cohérent avec le site public 2Block.
          </p>
        </div>
      </aside>
    </div>
  );
}
