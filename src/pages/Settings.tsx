import { useState } from "react";
import { toast } from "sonner";

import { broadcastPush } from "@/lib/pushNotifications";
import { supabase } from "@/lib/supabase";

const APP_LANDING_URL = "https://2block-web-ctth.vercel.app/telecharger/android";

export default function SettingsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [publishingUpdate, setPublishingUpdate] = useState(false);
  const [sendingSongTest, setSendingSongTest] = useState(false);
  const [sendingUpdateTest, setSendingUpdateTest] = useState(false);
  const [releaseVersion, setReleaseVersion] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [releaseAssetUrl, setReleaseAssetUrl] = useState("");
  const [releaseSha256, setReleaseSha256] = useState("");
  const [releaseSizeBytes, setReleaseSizeBytes] = useState("");
  const versionPreview = releaseVersion.trim();

  function normalizeSha256(value: string) {
    return value.trim().toLowerCase();
  }

  async function refreshDailyStats() {
    setRefreshing(true);
    const { error } = await supabase.rpc("refresh_song_stats_daily");
    setRefreshing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Stats journalieres actualisees");
  }

  async function testConnection() {
    setTesting(true);
    const { error } = await supabase.from("profiles").select("id").limit(1);
    setTesting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Connexion Supabase OK");
  }

  async function publishAppUpdate() {
    const version = releaseVersion.trim();
    if (!version) {
      toast.error("Version requise");
      return;
    }

    const assetUrl = releaseAssetUrl.trim();
    if (!assetUrl) {
      toast.error("URL directe du fichier APK requise");
      return;
    }
    if (!/^https:\/\//i.test(assetUrl)) {
      toast.error("L'URL directe APK doit commencer par https://");
      return;
    }

    const sha256 = normalizeSha256(releaseSha256);
    if (sha256 && !/^[a-f0-9]{64}$/.test(sha256)) {
      toast.error("Le SHA-256 doit contenir 64 caracteres hexadecimaux");
      return;
    }

    const sizeRaw = releaseSizeBytes.trim();
    const apkSizeBytes = sizeRaw ? Number.parseInt(sizeRaw, 10) : null;
    if (sizeRaw && (!Number.isFinite(apkSizeBytes) || apkSizeBytes <= 0)) {
      toast.error("La taille APK doit etre un entier positif");
      return;
    }

    setPublishingUpdate(true);
    const notes = releaseNotes.trim();

    const { error: rpcError } = await supabase.rpc("admin_set_mobile_release_distribution", {
      p_version: version,
      p_notes: notes || null,
      p_download_url: APP_LANDING_URL,
      p_asset_url: assetUrl,
      p_apk_sha256: sha256 || null,
      p_apk_size_bytes: apkSizeBytes,
    });

    if (rpcError) {
      setPublishingUpdate(false);
      toast.error(rpcError.message);
      return;
    }

    try {
      await broadcastPush({
        topic: "app_updates",
        title: "Mise a jour disponible",
        body: `Version ${version} disponible sur 2Block Music`,
        data: {
          version,
          notification_type: "app_update",
          target_url: APP_LANDING_URL,
        },
      });
      toast.success("Version publiee + notification envoyee");
      setReleaseNotes("");
    } catch (_) {
      toast.error("Version publiee, mais notif push non envoyee");
    } finally {
      setPublishingUpdate(false);
    }
  }

  async function sendSongPushTest() {
    setSendingSongTest(true);
    try {
      await broadcastPush({
        topic: "song_updates",
        title: "Test notification nouveau son",
        body: "Ce message confirme que la push song_updates fonctionne",
        data: { source: "settings_test" },
      });
      toast.success("Notification test nouveau son envoyee");
    } catch (e: any) {
      toast.error(e?.message ?? "Echec envoi push test nouveau son");
    } finally {
      setSendingSongTest(false);
    }
  }

  async function sendUpdatePushTest() {
    setSendingUpdateTest(true);
    try {
      await broadcastPush({
        topic: "app_updates",
        title: "Test notification mise a jour",
        body: "Ce message confirme que la push app_updates fonctionne",
        data: {
          source: "settings_test",
          notification_type: "app_update",
          target_url: APP_LANDING_URL,
        },
      });
      toast.success("Notification test mise a jour envoyee");
    } catch (e: any) {
      toast.error(e?.message ?? "Echec envoi push test mise a jour");
    } finally {
      setSendingUpdateTest(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="theme-title-gradient-soft text-xl font-bold">
          Parametres
        </h1>
        <p className="theme-text-muted text-sm">Actions operationnelles et verification de sante.</p>
      </div>

      <div className="theme-section rounded-[24px] border p-4">
        <h2 className="theme-text-main text-sm font-semibold">Base de donnees</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={testConnection}
            disabled={testing}
            className="theme-button-secondary rounded-xl px-3 py-2 text-sm disabled:opacity-50"
          >
            {testing ? "Test en cours..." : "Tester la connexion Supabase"}
          </button>
          <button
            type="button"
            onClick={refreshDailyStats}
            disabled={refreshing}
            className="theme-button-brand rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {refreshing ? "Actualisation..." : "Actualiser les stats journalieres"}
          </button>
        </div>
      </div>

      <div className="theme-section rounded-[24px] border p-4">
        <div className="theme-hero-card relative overflow-hidden rounded-[28px] border p-4">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />
          <p className="theme-hero-kicker text-[11px] font-semibold uppercase tracking-[0.2em]">Release mobile</p>
          <h2 className="mt-1 text-lg font-extrabold">Mise a jour de version</h2>
          <p className="theme-hero-copy mt-1 text-xs">
            Enregistre la version, le lien public stable et l'URL directe du fichier APK
            avec les metadonnees de verification dans
            {" "}
            <code className="theme-code rounded px-1 py-0.5">app_settings</code> puis envoie une push sur
            {" "}
            <code className="theme-code rounded px-1 py-0.5">app_updates</code>.
          </p>
          <div className="theme-hero-pill mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
            {versionPreview ? `Version prete: ${versionPreview}` : "Aucune version saisie"}
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input
            value={releaseVersion}
            onChange={(e) => setReleaseVersion(e.target.value)}
            placeholder="Version (ex: 1.3.0+3)"
            className="theme-input rounded-xl px-3 py-2 text-sm"
          />
          <input
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            placeholder="Notes (optionnel)"
            className="theme-input rounded-xl px-3 py-2 text-sm"
          />
          <input
            value={APP_LANDING_URL}
            readOnly
            className="theme-input rounded-xl px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={releaseAssetUrl}
            onChange={(e) => setReleaseAssetUrl(e.target.value)}
            placeholder="URL HTTPS directe du fichier APK"
            className="theme-input rounded-xl px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={releaseSha256}
            onChange={(e) => setReleaseSha256(normalizeSha256(e.target.value))}
            placeholder="SHA-256 APK (64 caracteres, optionnel)"
            className="theme-input rounded-xl px-3 py-2 text-sm"
          />
          <input
            value={releaseSizeBytes}
            onChange={(e) => setReleaseSizeBytes(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Taille APK en bytes (optionnel)"
            className="theme-input rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <p className="theme-text-muted mt-2 text-xs">
          Lien public stable :
          {" "}
          <code className="theme-code rounded px-1 py-0.5">{APP_LANDING_URL}</code>
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={publishAppUpdate}
            disabled={publishingUpdate}
            className="theme-button-brand rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {publishingUpdate ? "Publication..." : "Publier la mise a jour mobile"}
          </button>
        </div>
      </div>

      <div className="theme-section rounded-[24px] border p-4">
        <h2 className="theme-text-main text-sm font-semibold">Notifications push</h2>
        <p className="theme-text-muted mt-1 text-xs">
          Teste directement l'envoi FCM depuis l'interface admin.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={sendSongPushTest}
            disabled={sendingSongTest}
            className="theme-button-secondary rounded-xl px-3 py-2 text-sm disabled:opacity-50"
          >
            {sendingSongTest ? "Envoi..." : "Tester push nouveau son"}
          </button>
          <button
            type="button"
            onClick={sendUpdatePushTest}
            disabled={sendingUpdateTest}
            className="theme-button-secondary rounded-xl px-3 py-2 text-sm disabled:opacity-50"
          >
            {sendingUpdateTest ? "Envoi..." : "Tester push mise a jour"}
          </button>
        </div>
      </div>
    </div>
  );
}
