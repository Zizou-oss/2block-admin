import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { ThemeProvider, useTheme } from "@/features/theme/ThemeProvider";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/app/routes";

function AppContent() {
  const { theme } = useTheme();

  return (
    <>
      <AuthProvider>
        <RouterProvider
          router={router}
          future={{
            v7_startTransition: true,
          }}
        />
      </AuthProvider>
      <Toaster richColors position="top-right" theme={theme} />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
