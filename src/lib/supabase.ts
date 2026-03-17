import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const projectRef = (() => {
  try {
    const host = new URL(supabaseUrl).host;
    return host.split(".")[0] || "default";
  } catch {
    return "default";
  }
})();
const storageKey = `music-admin-auth-${projectRef}`;

const createSupabaseClient = () =>
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey,
    },
  });

declare global {
  // eslint-disable-next-line no-var
  var __music_admin_supabase__: ReturnType<typeof createSupabaseClient> | undefined;
}

export const supabase = globalThis.__music_admin_supabase__ ?? createSupabaseClient();

if (!globalThis.__music_admin_supabase__) {
  globalThis.__music_admin_supabase__ = supabase;
}
