import { supabase } from "@/lib/supabase";

export type PushTopic = "song_updates" | "app_updates";

type BroadcastPushParams = {
  topic: PushTopic;
  title: string;
  body: string;
  data?: Record<string, string>;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function resolveAccessToken() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Session invalide: ${sessionError.message}`);
  }

  const expiresSoon =
    typeof session?.expires_at === "number" && session.expires_at * 1000 <= Date.now() + 60_000;

  if (!session?.access_token || expiresSoon) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session?.access_token) {
      throw new Error("Session admin absente ou expirée. Déconnecte-toi puis reconnecte-toi.");
    }
    return data.session.access_token;
  }

  return session.access_token;
}

async function callPushBroadcast(accessToken: string, payload: {
  topic: PushTopic;
  title: string;
  body: string;
  data: Record<string, string>;
}) {
  const response = await fetch(`${supabaseUrl}/functions/v1/push-broadcast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let parsed: any = null;
  try {
    parsed = responseText ? JSON.parse(responseText) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const details =
      typeof parsed?.details === "string"
        ? parsed.details
        : typeof parsed?.message === "string"
          ? parsed.message
          : typeof parsed?.error === "string"
            ? parsed.error
            : responseText || "Erreur inconnue";
    throw new Error(`HTTP ${response.status}: ${details}`);
  }

  return parsed;
}

export async function broadcastPush(params: BroadcastPushParams) {
  const payload = {
    topic: params.topic,
    title: params.title.trim(),
    body: params.body.trim(),
    data: params.data ?? {},
  };

  try {
    const token = await resolveAccessToken();
    return await callPushBroadcast(token, payload);
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("HTTP 401")) {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && data.session?.access_token) {
        return await callPushBroadcast(data.session.access_token, payload);
      }
      await supabase.auth.signOut();
      throw new Error("Session invalide. Reconnecte-toi puis reessaie.");
    }

    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erreur inconnue pendant l'envoi push.");
  }
}
