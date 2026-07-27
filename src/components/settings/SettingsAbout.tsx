import { ExternalLink, FolderOpen, RefreshCw, Sparkles } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { SettingCard } from "../ui/SettingCard";
import { Badge } from "../ui/Badge";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import { joinPath } from "../../utils/packPaths";
import { APP_VERSION } from "@shared/version";
import { useUpdater } from "../../hooks/useUpdater";

const components = [
  {
    name: "Nuvoxel Launcher UI",
    version: APP_VERSION,
    meta: `quick launch · live stats · ${APP_VERSION}`,
    source: "github.com/nuvoxel/ui",
  },
  {
    name: "Nuvoxel Launcher Auth",
    version: "0.0.3",
    meta: "main · b7e1a4f",
    source: "github.com/nuvoxel/auth",
  },
  {
    name: "Nuvoxel Launcher Updater",
    version: "1.0.0",
    meta: "auto-update · silent install",
    source: "github.com/nuvoxel/updater",
  },
];
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function SettingsAbout() {
  const gameDirectory = useAppStore((s) => s.gameDirectory);
  const showToast = useAppStore((s) => s.showToast);
  const { checking, check, update, install, installing } = useUpdater();

  const openLogsFolder = async (subpath: string) => {
    if (!isTauri()) return;
    try {
      await invoke("open_folder", {
        folderPath: joinPath(gameDirectory, subpath),
      });
    } catch {
      /* desktop only */
    }
  };

  return (
    <>
      <SettingCard title={t("launcherInfo")}>
        <div className="flex items-start gap-4">
          <img
            src="/logo.svg"
            alt=""
            className="h-14 w-14 rounded-xl shadow-lg shadow-amber-900/25"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold">{t("appName")}</h3>
              <Badge variant="beta">{t("beta")}</Badge>
            </div>
            <p className="text-sm text-text-secondary">
              {t("appVersion")} · {t("releaseDate")}
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              {[t("whatsNew"), t("website"), t("support")].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
                >
                  {link}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={checking || installing}
                onClick={() =>
                  void check().then((hasUpdate) => {
                    if (!hasUpdate && !update) showToast("updateUpToDate");
                    setTimeout(() => useAppStore.getState().clearToast(), 2500);
                  })
                }
                className="no-drag flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-4 py-2 text-sm transition hover:bg-white/5 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${checking ? "animate-spin-slow" : ""}`}
                />
                {checking ? t("updateChecking") : t("checkForUpdates")}
              </button>
              {update ? (
                <button
                  type="button"
                  disabled={installing}
                  onClick={() => void install()}
                  className="no-drag rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
                >
                  {installing ? t("updateInstalling") : t("updateNow")} ({update.version})
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </SettingCard>

      <SettingCard
        icon={<Sparkles className="h-5 w-5" />}
        title={t("whatsNew") + " — v0.6.5"}
        description={t("releaseDate")}
      >
        <div className="space-y-2.5">
          {[
            { emoji: "🎨", text: "3D Voxel animated home background" },
            { emoji: "🔊", text: "Retro 8-bit UI sound engine (Web Audio API)" },
            { emoji: "🌈", text: "Dynamic RGB accent color cycling" },
            { emoji: "📦", text: "Modpack template system — one-click starter kits" },
            { emoji: "🧩", text: "Templates: Optimization, Industrial, RPG Adventure" },
            { emoji: "🌐", text: "Updated localization (UK/RU/EN)" },
            { emoji: "⚡", text: "Performance & stability improvements" },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <span className="mt-0.5 text-base leading-none">{item.emoji}</span>
              <span className="text-sm text-text-secondary">{item.text}</span>
            </div>
          ))}
        </div>
      </SettingCard>

      <SettingCard title={t("components")}>
        <div className="space-y-3">
          {components.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated p-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <Badge variant="default">{c.version}</Badge>
                </div>
                <p className="text-xs text-text-muted">
                  {c.meta} · {c.source}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SettingCard>

      <SettingCard title={t("legalInfo")}>
        <div className="flex flex-wrap gap-4">
          {[t("licenseAgreement"), t("legalDocs"), t("openSourceLicenses")].map(
            (link) => (
              <a
                key={link}
                href="#"
                className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
              >
                {link}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ),
          )}
        </div>
      </SettingCard>

      <SettingCard
        title={t("launcherLogs")}
        description={t("launcherLogsDesc")}
      >
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void openLogsFolder("logs")}
            className="no-drag flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-sm transition hover:bg-white/5"
          >
            <FolderOpen className="h-4 w-4" />
            {t("launcherLog")}
          </button>
          <button
            type="button"
            onClick={() => void openLogsFolder(".nuvoxel")}
            className="no-drag flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-sm transition hover:bg-white/5"
          >
            <FolderOpen className="h-4 w-4" />
            {t("bootstrapLog")}
          </button>
        </div>
      </SettingCard>
    </>
  );
}
