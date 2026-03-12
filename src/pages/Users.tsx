import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { useUsers } from "@/features/users/useUsers";

export default function UsersPage() {
  const { data, isLoading, error } = useUsers();

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
        <EmptyState title="Impossible de charger les utilisateurs" />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState title="Aucune activite utilisateur pour le moment" />
      ) : (
        <DataTable
          headers={[
            "Nom",
            "Email",
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
