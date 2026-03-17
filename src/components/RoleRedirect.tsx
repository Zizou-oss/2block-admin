import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/useAuth";

export function RoleRedirect() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="theme-text-muted p-6 text-sm">Chargement de la session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/songs" replace />;
}
