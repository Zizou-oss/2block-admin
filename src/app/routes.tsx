import { createBrowserRouter, Navigate } from "react-router-dom";

import { AdminLayout } from "@/app/layout/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ActivityPage from "@/pages/Activity";
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
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "songs", element: <SongsPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "activity", element: <ActivityPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
