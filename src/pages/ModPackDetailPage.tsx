import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpCircle,
  Folder,
  FolderOpen,
  Image,
  Loader2,
  Package,
  Play,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { t } from "../i18n";
import { useAppStore } from "../store/useAppStore";
import { searchModsForPack, formatDownloads } from "../services/modrinth";
import { localAssetDisplayName, openPackFolder } from "../services/modInstall";
import {
  getPackModsDir,
  getPackResourcepacksDir,
  getPackShaderpacksDir,
} from "../utils/packPaths";
import { LoaderIcon } from "../components/ui/LoaderIcon";
import { MOD_LOADERS } from "../types/mods";
import type { CatalogItem, PackFileEntry } from "../types/mods";
import {
  usePackFileDrop,
  type PackContentSection,
} from "../hooks/usePackFileDrop";
import { usePackModUpdates } from "../hooks/usePackModUpdates";

export function ModPackDetailPage() {
  const { packId } = useParams<{ packId: string }>();
  const navigate = useNavigate();

  const modPacks = useAppStore((s) => s.modPacks);
  const gameDirectory = useAppStore((s) => s.gameDirectory);
  const setActiveModPack = useAppStore((s) => s.setActiveModPack);
  const addModToPack = useAppStore((s) => s.addModToPack);
  const importModFilesToPack = useAppStore((s) => s.importModFilesToPack);
  const importPackAssetsToPack = useAppStore((s) => s.importPackAssetsToPack);
  const syncPackContentFromDisk = useAppStore((s) => s.syncPackContentFromDisk);
  const removeModFromPack = useAppStore((s) => s.removeModFromPack);
  const removePackAssetFromPack = useAppStore((s) => s.removePackAssetFromPack);
  const updateModInPack = useAppStore((s) => s.updateModInPack);
  const updateAllModsInPack = useAppStore((s) => s.updateAllModsInPack);
  const play = useAppStore((s) => s.play);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const gameRunning = useAppStore((s) => s.gameRunning);
  const busy = isPlaying || gameRunning;

  const pack = useMemo(
    () => modPacks.find((p) => p.id === packId),
    [modPacks, packId],
  );

  const [activeSection, setActiveSection] =
    useState<PackContentSection>("mods");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncingMods, setSyncingMods] = useState(false);
  const [updatingAll, setUpdatingAll] = useState(false);
  const [updatingModId, setUpdatingModId] = useState<string | null>(null);

  const { updates, checking, refresh, updateCount } = usePackModUpdates(pack);

  useEffect(() => {
    if (packId) setActiveModPack(packId);
  }, [packId, setActiveModPack]);

  useEffect(() => {
    if (!packId) return;
    void syncPackContentFromDisk(packId);
  }, [packId, syncPackContentFromDisk]);

  const handleDropFiles = useCallback(
    async (payload: {
      mods: string[];
      resourcepacks: string[];
      shaders: string[];
    }) => {
      if (!packId) return;
      setImporting(true);
      if (payload.mods.length) {
        await importModFilesToPack(packId, payload.mods);
      }
      if (payload.resourcepacks.length) {
        await importPackAssetsToPack(
          packId,
          payload.resourcepacks,
          "resourcepack",
        );
      }
      if (payload.shaders.length) {
        await importPackAssetsToPack(packId, payload.shaders, "shader");
      }
      setImporting(false);
    },
    [packId, importModFilesToPack, importPackAssetsToPack],
  );

  const handleDragEnter = useCallback(() => setDragOver(true), []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);

  usePackFileDrop(!!packId, activeSection, {
    onEnter: handleDragEnter,
    onLeave: handleDragLeave,
    onDrop: handleDropFiles,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadCatalog = useCallback(async () => {
    if (!pack) return;
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const result = await searchModsForPack(
        debouncedSearch,
        pack.minecraftVersion,
        pack.loader,
        0,
        24,
      );
      setCatalogItems(result.items);
      setCatalogTotal(result.total);
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : "error");
      setCatalogItems([]);
    } finally {
      setCatalogLoading(false);
    }
  }, [pack, debouncedSearch]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  if (!pack) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-text-secondary">{t("packNotFound")}</p>
        <button
          type="button"
          onClick={() => navigate("/mods")}
          className="no-drag rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          {t("goBack")}
        </button>
      </div>
    );
  }

  const loaderLabel =
    MOD_LOADERS.find((l) => l.id === pack.loader)?.label ?? pack.loader;
  const installedMods = pack.mods ?? [];
  const installedResourcepacks = pack.resourcepacks ?? [];
  const installedShaders = pack.shaderpacks ?? [];
  const installedProjectIds = new Set(installedMods.map((m) => m.projectId));
  const modCountLabel = t("packModCount").replace(
    "{n}",
    String(installedMods.length),
  );
  const summaryLabel = [
    modCountLabel,
    t("packAssetCount").replace(
      "{n}",
      String(installedResourcepacks.length),
    ),
    t("packAssetCount").replace("{n}", String(installedShaders.length)),
  ].join(" · ");

  const sectionTitle =
    activeSection === "mods"
      ? t("packModsInPack")
      : activeSection === "resourcepacks"
        ? t("packResourcepacksInPack")
        : t("packShadersInPack");

  const dropLabel =
    activeSection === "mods"
      ? t("packDropMods")
      : activeSection === "resourcepacks"
        ? t("packDropResourcepacks")
        : t("packDropShaders");

  const dropHint =
    activeSection === "mods"
      ? t("packDropModsHint")
      : activeSection === "resourcepacks"
        ? t("packDropResourcepacksHint")
        : t("packDropShadersHint");

  const emptyLabel =
    activeSection === "mods"
      ? t("packEmptyMods")
      : activeSection === "resourcepacks"
        ? t("packEmptyResourcepacks")
        : t("packEmptyShaders");

  const handleOpenFolder = async () => {
    const folderPath =
      activeSection === "resourcepacks"
        ? getPackResourcepacksDir(gameDirectory, pack.id)
        : activeSection === "shaders"
          ? getPackShaderpacksDir(gameDirectory, pack.id)
          : getPackModsDir(gameDirectory, pack.id);
    try {
      await openPackFolder(folderPath);
    } catch {
      useAppStore.setState({ toastMessage: "packOpenFolderError" });
      setTimeout(() => useAppStore.setState({ toastMessage: null }), 2500);
    }
  };

  const handleShare = async () => {
    const text = `${pack.name} · ${loaderLabel} · ${pack.minecraftVersion} · Nuvoxel Launcher`;
    try {
      await navigator.clipboard.writeText(text);
      setShareHint(true);
      setTimeout(() => setShareHint(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleUpdateAll = async () => {
    if (!packId || updateCount === 0) return;
    setUpdatingAll(true);
    const result = await updateAllModsInPack(packId);
    await refresh();
    setUpdatingAll(false);
    let toastMessage = "modUpdateNone";
    if (result.failed > 0 && result.updated > 0) {
      toastMessage = "modUpdatePartial";
    } else if (result.failed > 0) {
      toastMessage = "modUpdateFailed";
    } else if (result.updated > 0) {
      toastMessage = "modUpdateDone";
    }
    useAppStore.setState({ toastMessage });
    setTimeout(() => useAppStore.setState({ toastMessage: null }), 2800);
  };

  const handleUpdateOne = async (modId: string) => {
    if (!packId) return;
    setUpdatingModId(modId);
    const ok = await updateModInPack(packId, modId);
    await refresh();
    setUpdatingModId(null);
    useAppStore.setState({
      toastMessage: ok ? "modUpdateOneDone" : "modUpdateFailed",
    });
    setTimeout(() => useAppStore.setState({ toastMessage: null }), 2200);
  };
  const handleSyncContent = async () => {
    setSyncingMods(true);
    await syncPackContentFromDisk(pack.id);
    await refresh();
    setSyncingMods(false);
    useAppStore.setState({ toastMessage: "packContentSynced" });
    setTimeout(() => useAppStore.setState({ toastMessage: null }), 2500);
  };

  const renderAssetRow = (asset: PackFileEntry, kind: "resourcepack" | "shader") => (
    <div
      key={asset.id}
      className="group flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3 transition"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
        {asset.isFolder ? (
          <Folder className="h-5 w-5 text-text-muted" />
        ) : kind === "resourcepack" ? (
          <Image className="h-5 w-5 text-text-muted" />
        ) : (
          <Sparkles className="h-5 w-5 text-text-muted" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text-primary">
          {localAssetDisplayName(asset.filename)}
        </p>
        <p className="truncate text-xs text-text-muted">{asset.filename}</p>
      </div>
      <button
        type="button"
        onClick={() => void removePackAssetFromPack(pack.id, asset.id, kind)}
        className="no-drag rounded-lg p-2 text-text-muted transition hover:bg-red-500/10 hover:text-red-400"
        title={t("packRemoveAsset")}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const handleAddMod = async (item: CatalogItem) => {
    setAddingId(item.id);
    const ok = await addModToPack(pack.id, item);
    setAddingId(null);
    if (!ok) {
      const { toastMessage } = useAppStore.getState();
      if (!toastMessage) {
        useAppStore.setState({ toastMessage: "packModError" });
        setTimeout(() => useAppStore.setState({ toastMessage: null }), 2500);
      }
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/mods")}
              className="no-drag flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("goBack")}
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-text-primary">
                {pack.name}
              </h1>
              <p className="mt-0.5 text-sm text-text-muted">
                {loaderLabel} · {pack.minecraftVersion} · {summaryLabel}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={updatingAll || updateCount === 0}
              onClick={() => void handleUpdateAll()}
              className="no-drag relative flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              title={t("packUpdates")}
            >
              {updatingAll || checking ? (
                <Loader2 className="h-4 w-4 animate-spin-slow" />
              ) : (
                <ArrowUpCircle className="h-4 w-4" />
              )}
              {updateCount > 0
                ? t("modUpdateAllCount").replace("{n}", String(updateCount))
                : t("packUpdates")}
            </button>
            <button
              type="button"
              disabled={syncingMods}
              onClick={() => void handleSyncContent()}
              className="no-drag flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition hover:bg-white/5 hover:text-text-primary disabled:opacity-60"
              title={t("packSyncDisk")}
            >
              {syncingMods ? (
                <Loader2 className="h-4 w-4 animate-spin-slow" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => void handleOpenFolder()}
              className="no-drag flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
              title={t("packOpenFolder")}
            >
              <FolderOpen className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="no-drag flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
            >
              <Share2 className="h-4 w-4" />
              {shareHint ? t("packShareCopied") : t("packShare")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void play(pack.id)}
              className="no-drag flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {isPlaying ? (
                <Loader2 className="h-4 w-4 animate-spin-slow" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              {t("play")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-0">
        <section className="relative flex min-h-0 flex-col border-r border-border p-6">
          <div className="mb-4 flex gap-1 rounded-xl border border-border bg-bg-card/60 p-1">
            {(
              [
                ["mods", t("packSectionMods"), Package, installedMods.length],
                [
                  "resourcepacks",
                  t("packSectionResourcepacks"),
                  Image,
                  installedResourcepacks.length,
                ],
                [
                  "shaders",
                  t("packSectionShaders"),
                  Sparkles,
                  installedShaders.length,
                ],
              ] as const
            ).map(([id, label, Icon, count]) => {
              const selected = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`no-drag flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition ${
                    selected
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                      selected
                        ? "bg-[var(--accent)]/20"
                        : "bg-bg-elevated text-text-muted"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
            {sectionTitle}
          </h2>

          <div
            className={`relative min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 rounded-xl transition ${
              dragOver
                ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-bg-primary"
                : ""
            }`}
          >
            {dragOver && (
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--accent)] bg-[var(--accent)]/10 backdrop-blur-sm">
                <Upload className="mb-2 h-8 w-8 text-[var(--accent)]" />
                <p className="text-sm font-medium text-[var(--accent)]">
                  {dropLabel}
                </p>
              </div>
            )}

            {importing && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-card p-3 text-sm text-text-secondary">
                <Loader2 className="h-4 w-4 animate-spin-slow text-[var(--accent)]" />
                {activeSection === "mods"
                  ? t("packModImporting")
                  : t("packAssetImporting")}
              </div>
            )}

            {activeSection === "mods" ? (
              installedMods.length === 0 && !importing ? (
                <p className="rounded-xl border border-dashed border-border bg-bg-card/50 p-6 text-sm leading-relaxed text-text-secondary">
                  {emptyLabel}
                  <span className="mt-2 block text-xs text-text-muted">
                    {dropHint}
                  </span>
                </p>
              ) : (
                installedMods.map((mod) => {
                  const updateInfo = updates.get(mod.id);
                  const hasUpdate = !!updateInfo;
                  const updating = updatingModId === mod.id;
                  return (
                    <div
                      key={mod.id}
                      title={
                        hasUpdate
                          ? t("modUpdateAvailableHint").replace(
                              "{version}",
                              updateInfo.latestVersionNumber,
                            )
                          : undefined
                      }
                      className={`group flex items-center gap-3 rounded-xl border p-3 transition ${
                        hasUpdate
                          ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/20"
                          : "border-border bg-bg-card"
                      }`}
                    >
                      {mod.iconUrl ? (
                        <img
                          src={mod.iconUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
                          <LoaderIcon loader={pack.loader} size={24} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-text-primary">
                            {mod.name}
                          </p>
                          {hasUpdate ? (
                            <span className="shrink-0 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                              {t("modUpdateBadge")}
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-text-muted">
                          {mod.author} · v{mod.versionNumber}
                          {hasUpdate
                            ? ` → v${updateInfo.latestVersionNumber}`
                            : ""}
                        </p>
                      </div>
                      {hasUpdate ? (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() => void handleUpdateOne(mod.id)}
                          className="no-drag rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-50"
                        >
                          {updating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin-slow" />
                          ) : (
                            t("modUpdateOne")
                          )}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void removeModFromPack(pack.id, mod.id)}
                        className="no-drag rounded-lg p-2 text-text-muted transition hover:bg-red-500/10 hover:text-red-400"
                        title={t("packRemoveMod")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )
            ) : activeSection === "resourcepacks" ? (
              installedResourcepacks.length === 0 && !importing ? (
                <p className="rounded-xl border border-dashed border-border bg-bg-card/50 p-6 text-sm leading-relaxed text-text-secondary">
                  {emptyLabel}
                  <span className="mt-2 block text-xs text-text-muted">
                    {dropHint}
                  </span>
                </p>
              ) : (
                installedResourcepacks.map((asset) =>
                  renderAssetRow(asset, "resourcepack"),
                )
              )
            ) : installedShaders.length === 0 && !importing ? (
              <p className="rounded-xl border border-dashed border-border bg-bg-card/50 p-6 text-sm leading-relaxed text-text-secondary">
                {emptyLabel}
                <span className="mt-2 block text-xs text-text-muted">
                  {dropHint}
                </span>
              </p>
            ) : (
              installedShaders.map((asset) => renderAssetRow(asset, "shader"))
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col p-6">
          {activeSection === "mods" ? (
            <>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
            {t("packAddModsModrinth")}
          </h2>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("packSearchModsPlaceholder")}
              className="no-drag w-full rounded-xl border border-border bg-bg-card py-2.5 pl-10 pr-4 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-[var(--accent)]"
            />
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {catalogLoading && catalogItems.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="mb-3 h-8 w-8 animate-spin-slow text-[var(--accent)]" />
                <p className="text-sm text-text-muted">{t("catalogLoadingModrinth")}</p>
              </div>
            ) : catalogError ? (
              <p className="py-8 text-center text-sm text-red-400">
                {t("catalogError")}
              </p>
            ) : catalogItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">
                {t("noVersionsFound")}
              </p>
            ) : (
              catalogItems.map((item) => {
                const installed = installedProjectIds.has(item.id);
                const adding = addingId === item.id;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-bg-card/80 p-3 transition hover:border-white/10"
                  >
                    {item.iconUrl ? (
                      <img
                        src={item.iconUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-bg-elevated" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text-primary">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {item.author} · {formatDownloads(item.downloads)}{" "}
                        {t("downloads")}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={installed || adding}
                      onClick={() => void handleAddMod(item)}
                      className="no-drag flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {adding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin-slow" />
                      ) : installed ? (
                        <X className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      {installed ? t("installed") : t("packAddMod")}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {catalogTotal > catalogItems.length && !catalogLoading && (
            <p className="mt-3 text-center text-xs text-text-muted">
              {catalogItems.length} / {catalogTotal}
            </p>
          )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card/40 p-8 text-center">
              {activeSection === "resourcepacks" ? (
                <Image className="mb-4 h-12 w-12 text-text-muted" />
              ) : (
                <Sparkles className="mb-4 h-12 w-12 text-text-muted" />
              )}
              <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
                {t("packAssetsPanelHint")}
              </p>
              <p className="mt-3 max-w-sm text-xs text-text-muted">{dropHint}</p>
              <button
                type="button"
                onClick={() => void handleOpenFolder()}
                className="no-drag mt-6 flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
              >
                <FolderOpen className="h-4 w-4" />
                {t("packOpenFolder")}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
