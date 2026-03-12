import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/useAuth";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="theme-text-muted p-6 text-sm">Chargement de la session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="glass rounded-[28px] p-6">
        <h1 className="theme-text-main text-lg font-semibold">Accès refusé</h1>
        <p className="theme-text-muted mt-1 text-sm">
          Ton compte est connecté, mais n'a pas le rôle admin dans `profiles`.
        </p>
      </div>
    );
  }

  return children;
}
