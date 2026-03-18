import { useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { useUsers } from "@/features/users/useUsers";
import { supabase } from "@/lib/supabase";

function toErrorMessage(error: unknown) {
  if (!error) return "Erreur inconnue";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }
  if (error instanceof Error && error.message) return error.message;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export default function UsersPage() {
  const { data, isLoading, error } = useUsers();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const usersErrorMessage = toErrorMessage(error);

  async function updateRole(userId: string, role: string) {
    setUpdatingId(userId);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    setUpdatingId(null);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    toast.success(`Role mis a jour: ${role}`);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="theme-title-gradient-soft text-xl font-bold">
          Utilisateurs
        </h1>
        <p className="theme-text-muted text-sm">Activite d'ecoute et de telechargement par utilisateur.</p>
      </div>

      {isLoading ? (
        <p className="theme-text-muted text-sm">Chargement des utilisateurs...</p>
      ) : error ? (
        <EmptyState
          title="Impossible de charger les utilisateurs"
          description={usersErrorMessage}
        />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState title="Aucune activite utilisateur pour le moment" />
      ) : (
        <DataTable
          headers={[
            "Nom",
            "Email",
            "Role",
            "Telechargements",
            "Ecoutes",
            "Secondes ecoutees",
            "Derniere activite",
          ]}
        >
          {(data ?? []).map((user) => (
            <tr key={user.user_id}>
              <td className="theme-text-main px-4 py-3 font-medium">{user.user_name}</td>
              <td className="theme-text-soft px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">
                <select
                  value={user.role}
                  onChange={(e) => updateRole(user.user_id, e.target.value)}
                  disabled={updatingId === user.user_id}
                  className="theme-input rounded-lg px-2 py-1 text-xs"
                >
                  <option value="user">user</option>
                  <option value="artist">artist</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="px-4 py-3">{user.songs_downloaded}</td>
              <td className="px-4 py-3">{user.listening_events}</td>
              <td className="px-4 py-3">{user.seconds_total}</td>
              <td className="theme-text-muted px-4 py-3 text-xs">
                {user.last_activity_at ? new Date(user.last_activity_at).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
