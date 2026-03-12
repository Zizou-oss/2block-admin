import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => ReturnType<typeof supabase.auth.signInWithPassword>;
  logout: () => ReturnType<typeof supabase.auth.signOut>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const authDebug = false;
    let lastResolvedUserId: string | null = null;

    function logAuth(label: string, payload?: unknown) {
      if (!authDebug) return;
      // eslint-disable-next-line no-console
      console.log(`[auth-debug] ${label}`, payload ?? "");
    }

    async function resolveRole(currentUser: User | null) {
      logAuth("resolveRole:start", {
        userId: currentUser?.id ?? null,
        email: currentUser?.email ?? null,
      });
      if (!mounted) return;
      if (!currentUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        logAuth("resolveRole:no-user");
        return;
      }

      setUser(currentUser);

      if (lastResolvedUserId === currentUser.id && !loading) {
        logAuth("resolveRole:skip-same-user", currentUser.id);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        setIsAdmin(false);
        setLoading(false);
        logAuth("resolveRole:profile-error", error);
        return;
      }

      lastResolvedUserId = currentUser.id;
      setIsAdmin(profile?.role === "admin");
      setLoading(false);
      logAuth("resolveRole:done", { role: profile?.role ?? null });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      logAuth("onAuthStateChange", {
        event,
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        expiresAt: session?.expires_at ?? null,
      });

      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        lastResolvedUserId = null;
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        // Ignore frequent token refresh events to avoid unnecessary rerenders.
        return;
      }

      void resolveRole(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      logAuth("getSession:init", {
        userId: data.session?.user?.id ?? null,
        email: data.session?.user?.email ?? null,
        expiresAt: data.session?.expires_at ?? null,
      });
      void resolveRole(data.session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin,
      loading,
      login: (email: string, password: string) =>
        supabase.auth.signInWithPassword({ email, password }),
      logout: () => supabase.auth.signOut(),
    }),
    [user, isAdmin, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
