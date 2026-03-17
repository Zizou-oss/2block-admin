import { createBrowserRouter, Navigate } from "react-router-dom";

import { AdminLayout } from "@/app/layout/AdminLayout";
import { AdminOnlyRoute } from "@/components/AdminOnlyRoute";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleRedirect } from "@/components/RoleRedirect";
import ActivityPage from "@/pages/Activity";
import ArtistProfilePage from "@/pages/ArtistProfile";
import DashboardPage from "@/pages/Dashboard";
import LoginPage from "@/pages/Login";
import SettingsPage from "@/pages/Settings";
import SongsPage from "@/pages/Songs";
import UsersPage from "@/pages/Users";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoleRedirect /> },
      { path: "dashboard", element: (
        <AdminOnlyRoute>
          <DashboardPage />
        </AdminOnlyRoute>
      ) },
      { path: "songs", element: <SongsPage /> },
      { path: "artist-profile", element: <ArtistProfilePage /> },
      { path: "users", element: (
        <AdminOnlyRoute>
          <UsersPage />
        </AdminOnlyRoute>
      ) },
      { path: "activity", element: (
        <AdminOnlyRoute>
          <ActivityPage />
        </AdminOnlyRoute>
      ) },
      { path: "settings", element: (
        <AdminOnlyRoute>
          <SettingsPage />
        </AdminOnlyRoute>
      ) },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
