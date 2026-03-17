import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/useAuth";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, isAdmin, isArtist, loading, authError } = useAuth();

  if (loading) {
    return <div className="theme-text-muted p-6 text-sm">Chargement de la session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isArtist) {
    return (
      <div className="glass rounded-[28px] p-6">
        <h1 className="theme-text-main text-lg font-semibold">Accès refusé</h1>
        <p className="theme-text-muted mt-1 text-sm">
          Ton compte est connecté, mais n'a pas le rôle admin ou artiste dans `profiles`.
        </p>
        {authError ? (
          <p className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            Détail technique : {authError}
          </p>
        ) : null}
      </div>
    );
  }

  return children;
}
