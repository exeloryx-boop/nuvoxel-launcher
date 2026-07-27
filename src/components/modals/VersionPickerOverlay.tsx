import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  FolderOpen,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { BlurOverlay } from "../ui/BlurOverlay";
import { LoaderPicker } from "../mods/LoaderPicker";
import { useTranslation } from "../../hooks/useTranslation";
import { useAppStore } from "../../store/useAppStore";
import { useMinecraftVersions } from "../../hooks/useMinecraftVersions";
import type { ModLoader } from "../../types/mods";
import type { VersionFilter } from "../../types";
import { openPackFolder } from "../../services/modInstall";
import { getPackInstanceDir } from "../../utils/packPaths";
import { copyToClipboard } from "../../utils/shareText";

const BANNER = "/bg-copper-age.png";

const LOADER_LABELS: Record<ModLoader | "optifine", string> = {
  vanilla: "Vanilla",
  fabric: "Fabric",
  forge: "Forge",
  neoforge: "NeoForge",
  quilt: "Quilt",
  optifine: "Forge OptiFine",
};

export function VersionPickerOverlay() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const open = useAppStore((s) => s.showVersionPicker);
  const setOpen = useAppStore((s) => s.setShowVersionPicker);
  const minecraftVersion = useAppStore((s) => s.minecraftVersion);
  const setMinecraftVersion = useAppStore((s) => s.setMinecraftVersion);
  const setActiveModPack = useAppStore((s) => s.setActiveModPack);
  const activeModPackId = useAppStore((s) => s.activeModPackId);
  const gameDirectory = useAppStore((s) => s.gameDirectory);
  const setSettingsSection = useAppStore((s) => s.setSettingsSection);
  const showToast = useAppStore((s) => s.showToast);
  const clearToast = useAppStore((s) => s.clearToast);
  const clearLaunchHistoryForVersion = useAppStore(
    (s) => s.clearLaunchHistoryForVersion,
  );
  const versionPickerLoader = useAppStore((s) => s.versionPickerLoader);
  const setVersionPickerLoader = useAppStore((s) => s.setVersionPickerLoader);
  const versionFilter = useAppStore((s) => s.versionFilter);
  const setVersionFilter = useAppStore((s) => s.setVersionFilter);
  const launchHistory = useAppStore((s) => s.launchHistory);
  const modPacks = useAppStore((s) => s.modPacks);
  const play = useAppStore((s) => s.play);
  const lastLaunchMap = useAppStore((s) => s.lastLaunchByVersion);

  const { versions, loading, refetch } = useMinecraftVersions();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(minecraftVersion);
  const [reloading, setReloading] = useState(false);

  const activePack = useMemo(
    () => modPacks.find((p) => p.id === activeModPackId),
    [modPacks, activeModPackId],
  );

  useEffect(() => {
    if (open) setSelected(minecraftVersion);
  }, [open, minecraftVersion]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  const filteredVersions = useMemo(() => {
    let list = [...versions];

    if (versionFilter === "release") {
      list = list.filter((v) => v.type === "release");
    } else if (versionFilter === "snapshot") {
      list = list.filter((v) => v.type === "snapshot");
    } else if (versionFilter === "legacy") {
      list = list.filter(
        (v) => v.type === "old_beta" || v.type === "old_alpha",
      );
    } else if (versionFilter === "packs") {
      const packVersions = new Set(modPacks.map((p) => p.minecraftVersion));
      list = list.filter((v) => packVersions.has(v.id));
    } else if (versionFilter === "mods") {
      list = list.filter(
        (v) => modPacks.some((p) => p.minecraftVersion === v.id && p.loader !== "vanilla"),
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) => v.id.toLowerCase().includes(q));
    }
    return list;
  }, [versions, versionFilter, modPacks, search]);

  const apply = () => {
    const keepPack =
      activeModPackId &&
      modPacks.some(
        (p) => p.id === activeModPackId && p.minecraftVersion === selected,
      );
    if (!keepPack) {
      setActiveModPack(null);
    }
    setMinecraftVersion(selected);
    setOpen(false);
  };

  const selectPlainVersion = (version: string) => {
    setSelected(version);
    setActiveModPack(null);
  };

  const selectModPack = (packId: string) => {
    const pack = modPacks.find((p) => p.id === packId);
    if (!pack) return;
    setActiveModPack(pack.id);
    setSelected(pack.minecraftVersion);
    setVersionPickerLoader(pack.loader);
  };

  const matchingPacks = useMemo(
    () => modPacks.filter((p) => p.minecraftVersion === selected),
    [modPacks, selected],
  );

  const loaderLabel =
    versionPickerLoader === "vanilla"
      ? t("loaderVanilla")
      : LOADER_LABELS[versionPickerLoader] ?? versionPickerLoader;

  const resolveInstanceDir = () => {
    if (activeModPackId) {
      const pack = modPacks.find((p) => p.id === activeModPackId);
      if (pack?.minecraftVersion === selected) {
        return getPackInstanceDir(gameDirectory, pack.id);
      }
    }
    return gameDirectory;
  };

  const handleOpenSettings = () => {
    setSettingsSection("launch");
    setOpen(false);
    navigate("/settings");
  };

  const handleOpenFolder = async () => {
    const dir = resolveInstanceDir();
    try {
      await openPackFolder(dir);
    } catch {
      showToast("packOpenFolderError");
      setTimeout(() => clearToast(), 2500);
    }
  };

  const handleShare = async () => {
    const label = activePack?.minecraftVersion === selected
      ? activePack.name
      : `${t("minecraftLabel")} ${selected}`;
    const text = `${label} · ${loaderLabel} · ${selected} · Nuvoxel Launcher`;
    const ok = await copyToClipboard(text);
    showToast(ok ? "versionShareCopied" : "packOpenFolderError");
    setTimeout(() => clearToast(), 2500);
  };

  const handleReload = async () => {
    setReloading(true);
    await refetch();
    setReloading(false);
    showToast("versionsReloaded");
    setTimeout(() => clearToast(), 2500);
  };

  const handleClearHistory = () => {
    if (!window.confirm(t("clearHistoryConfirm").replace("{version}", selected))) {
      return;
    }
    clearLaunchHistoryForVersion(selected);
    showToast("launchHistoryCleared");
    setTimeout(() => clearToast(), 2500);
  };

  if (!open) return null;

  return (
    <BlurOverlay open={open} onClose={() => setOpen(false)} className="mx-4 my-4 max-h-[calc(100vh-120px)]">
      <div className="flex h-full min-h-0 overflow-hidden rounded-2xl border border-border bg-bg-card shadow-2xl">
        {/* Left panel */}
        <div className="flex w-[340px] shrink-0 flex-col border-r border-border bg-bg-secondary">
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchVersion")}
                className="w-full rounded-xl border border-border bg-bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {(
                [
                  ["all", t("allVersions")],
                  ["release", t("releases")],
                  ["snapshot", t("snapshots")],
                  ["legacy", t("legacyVersions")],
                  ["mods", t("catalogMods")],
                  ["packs", t("catalogModpacks")],
                ] as [VersionFilter, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setVersionFilter(id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    versionFilter === id
                      ? "bg-[var(--accent)] text-white"
                      : "bg-bg-card text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {launchHistory.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {t("launchHistory")}
                </p>
                {launchHistory.slice(0, 3).map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      setSelected(entry.version);
                      setVersionPickerLoader(entry.loader);
                      if (entry.packId) {
                        setActiveModPack(entry.packId);
                      } else {
                        setActiveModPack(null);
                      }
                    }}
                    className={`mb-1 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      selected === entry.version
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-border bg-bg-card hover:border-white/15"
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-xs font-bold text-white">
                      NU
                    </span>
                    <span className="text-sm font-medium">{entry.label ?? entry.version}</span>
                  </button>
                ))}
              </div>
            )}

            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {t("allVersionsList")}
            </p>
            {loading ? (
              <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin-slow text-[var(--accent)]" />
            ) : (
              filteredVersions.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => selectPlainVersion(v.id)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    selected === v.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-transparent hover:bg-white/5"
                  }`}
                >
                  <GrassBlock small />
                  <span>{t("minecraftLabel")} {v.id}</span>
                </button>
              ))
            )}
          </div>

          <div className="flex gap-2 border-t border-border p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm transition hover:bg-white/5"
            >
              {t("goBack")}
            </button>
            <button
              type="button"
              onClick={() => {
                apply();
                play();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white"
            >
              <Play className="h-4 w-4 fill-current" />
              {t("play")}
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="relative h-44 shrink-0 overflow-hidden">
            <img src={BANNER} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex flex-col items-center text-text-secondary hover:text-text-primary"
            >
              <X className="h-5 w-5" />
              <span className="text-[10px]">{t("esc")}</span>
            </button>
          </div>

          <div className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {activePack && activePack.minecraftVersion === selected
                    ? activePack.name
                    : `${t("minecraftLabel")} ${selected}`}
                </h2>
                <p className="text-sm text-text-muted">
                  {activePack && activePack.minecraftVersion === selected
                    ? `${LOADER_LABELS[activePack.loader] ?? activePack.loader} · ${selected}`
                    : `${loaderLabel} · ${selected}`}
                </p>
              </div>
              <div className="flex gap-1">
                <VersionActionButton
                  icon={Settings}
                  title={t("versionPickerSettings")}
                  onClick={() => void handleOpenSettings()}
                />
                <VersionActionButton
                  icon={FolderOpen}
                  title={t("versionPickerOpenFolder")}
                  onClick={() => void handleOpenFolder()}
                />
                <VersionActionButton
                  icon={Share2}
                  title={t("versionPickerShare")}
                  onClick={() => void handleShare()}
                />
                <VersionActionButton
                  icon={RefreshCw}
                  title={t("versionPickerReload")}
                  spinning={reloading}
                  onClick={() => void handleReload()}
                />
                <VersionActionButton
                  icon={Trash2}
                  title={t("versionPickerClearHistory")}
                  onClick={handleClearHistory}
                />
              </div>
            </div>

            {matchingPacks.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t("modpacksForVersion")}
                </p>
                <div className="space-y-2">
                  {matchingPacks.map((pack) => {
                    const isActive = activeModPackId === pack.id;
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => selectModPack(pack.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-[var(--accent)] bg-[var(--accent)]/10"
                            : "border-border bg-bg-elevated hover:border-white/15"
                        }`}
                      >
                        {pack.modrinthIconUrl ? (
                          <img
                            src={pack.modrinthIconUrl}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-xs font-bold text-[var(--accent)]">
                            NU
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{pack.name}</p>
                          <p className="text-xs text-text-muted">
                            {LOADER_LABELS[pack.loader] ?? pack.loader} · {pack.minecraftVersion}
                            {pack.modCount ? ` · ${pack.modCount} mods` : ""}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-text-muted">{t("orPlainVersion")}</p>
              </div>
            )}

            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t("loaderLabel")}
              </p>
              <LoaderPicker clearPackOnChange />
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-bg-elevated p-4">
                <p className="text-xs text-text-muted">{t("timePlayed")}</p>
                <p className="mt-1 font-medium">—</p>
              </div>
              <div className="rounded-xl border border-border bg-bg-elevated p-4">
                <p className="text-xs text-text-muted">{t("lastLaunch")}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {lastLaunchMap[selected] ?? t("neverLaunched")}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t("versionDetails")}
              </p>
              <p className="text-sm leading-relaxed text-text-secondary">
                {t("vanillaVersionDesc")}
              </p>
            </div>

            <button
              type="button"
              onClick={apply}
              className="mt-6 flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("selectVersion")}
            </button>
          </div>
        </div>
      </div>
    </BlurOverlay>
  );
}

function GrassBlock({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`shrink-0 rounded ${small ? "h-6 w-6" : "h-8 w-8"}`}
      style={{
        background:
          "linear-gradient(180deg, #5d9b47 0%, #5d9b47 45%, #8b6914 45%, #8b6914 100%)",
        imageRendering: "pixelated",
      }}
    />
  );
}

function VersionActionButton({
  icon: Icon,
  title,
  onClick,
  spinning = false,
}: {
  icon: typeof Settings;
  title: string;
  onClick: () => void;
  spinning?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="no-drag rounded-lg p-2 text-text-muted transition hover:bg-white/5 hover:text-text-primary disabled:opacity-50"
      disabled={spinning}
    >
      <Icon
        className={`h-4 w-4 ${spinning ? "animate-spin-slow" : ""}`}
      />
    </button>
  );
}
