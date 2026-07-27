import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Download,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { t } from "../i18n";
import { useAppStore } from "../store/useAppStore";
import { Tabs } from "../components/ui/Tabs";
import { ModPackCard } from "../components/mods/ModPackCard";
import { ModsLaunchBar } from "../components/mods/ModsLaunchBar";
import { CatalogCard } from "../components/mods/CatalogCard";
import { CatalogDetailModal } from "../components/mods/CatalogDetailModal";
import {
  InstallTargetModal,
  type InstallTargetChoice,
} from "../components/modals/InstallTargetModal";
import { useCatalog } from "../hooks/useCatalog";
import { resolveCatalogInstallContext } from "../services/catalogInstall";
import type { CatalogItem, CatalogSort, CatalogSource, ModLoader } from "../types/mods";
import type { CatalogKind } from "../types";

const FILTER_PILLS: { id: CatalogKind; labelKey: "catalogModpacks" | "catalogMods" | "catalogResourcepacks" | "catalogShaders" }[] = [
  { id: "modpacks", labelKey: "catalogModpacks" },
  { id: "mods", labelKey: "catalogMods" },
  { id: "resourcepacks", labelKey: "catalogResourcepacks" },
  { id: "shaders", labelKey: "catalogShaders" },
];

const SORT_PILLS: {
  id: CatalogSort;
  labelKey:
    | "catalogSortDownloads"
    | "catalogSortFollows"
    | "catalogSortRelevance"
    | "catalogSortUpdated"
    | "catalogSortNew";
  icon: typeof Download;
}[] = [
  { id: "downloads", labelKey: "catalogSortDownloads", icon: Download },
  { id: "follows", labelKey: "catalogSortFollows", icon: Star },
  { id: "relevance", labelKey: "catalogSortRelevance", icon: Sparkles },
  { id: "updated", labelKey: "catalogSortUpdated", icon: Clock },
  { id: "new", labelKey: "catalogSortNew", icon: Zap },
];

export function ModsPage() {
  const navigate = useNavigate();
  const modsTab = useAppStore((s) => s.modsTab);
  const catalogKind = useAppStore((s) => s.catalogKind);
  const catalogSource = useAppStore((s) => s.catalogSource);
  const setModsTab = useAppStore((s) => s.setModsTab);
  const setCatalogKind = useAppStore((s) => s.setCatalogKind);
  const setCatalogSource = useAppStore((s) => s.setCatalogSource);
  const modPacks = useAppStore((s) => s.modPacks);
  const activeModPackId = useAppStore((s) => s.activeModPackId);
  const setActiveModPack = useAppStore((s) => s.setActiveModPack);
  const syncPackContentFromDisk = useAppStore((s) => s.syncPackContentFromDisk);
  const removeModPack = useAppStore((s) => s.removeModPack);
  const setShowCreatePackModal = useAppStore((s) => s.setShowCreatePackModal);
  const installFromCatalog = useAppStore((s) => s.installFromCatalog);

  const [search, setSearch] = useState("");
  const [catalogSort, setCatalogSort] = useState<CatalogSort>("downloads");
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installTarget, setInstallTarget] = useState<{
    item: CatalogItem;
    versionId: string;
    mcVersion: string;
    loader: ModLoader;
  } | null>(null);
  const [resolvingInstall, setResolvingInstall] = useState(false);

  const catalog = useCatalog(
    catalogSource,
    catalogKind,
    search,
    modsTab === "catalog",
    catalogSort,
  );

  const handleRemovePack = async (packId: string) => {
    if (!window.confirm(t("packDeleteConfirm"))) return;
    await removeModPack(packId);
    if (window.location.pathname.includes(packId)) {
      navigate("/mods");
    }
  };

  const handleInstall = async (
    item: CatalogItem,
    versionId: string,
    choice: InstallTargetChoice,
  ) => {
    const key = `${item.source}:${item.id}`;
    setInstallingId(key);
    const ok = await installFromCatalog(item, versionId, {
      targetPackId: choice.mode === "existing" ? choice.packId : "new",
      packName: choice.packName,
    });
    setInstallingId(null);
    setInstallTarget(null);
    if (ok) {
      setDetailItem(null);
      const { activeModPackId } = useAppStore.getState();
      if (activeModPackId) navigate(`/mods/${activeModPackId}`);
    }
  };

  const beginInstall = async (item: CatalogItem, versionId: string) => {
    setResolvingInstall(true);
    try {
      const ctx = await resolveCatalogInstallContext(item, versionId);
      setInstallTarget({ item, versionId, ...ctx });
    } catch {
      useAppStore.setState({ toastMessage: "installError" });
      setTimeout(() => useAppStore.setState({ toastMessage: null }), 2500);
    } finally {
      setResolvingInstall(false);
    }
  };

  const installedIds = new Set(
    modPacks.flatMap((p) => {
      const ids: string[] = [];
      if (p.modrinthProjectId) ids.push(`modrinth:${p.modrinthProjectId}`);
      if (p.curseforgeProjectId)
        ids.push(`curseforge:${p.curseforgeProjectId}`);
      return ids;
    }),
  );

  return (
    <>
      <div className="flex h-full flex-col overflow-y-auto p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {t("modsTitle")}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {t("modsSubtitle")}
            </p>
          </div>
          {modsTab === "catalog" && (
            <div className="relative w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchMods")}
                className="no-drag w-full rounded-xl border border-border bg-bg-card py-2.5 pl-10 pr-4 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-[var(--accent)]"
              />
            </div>
          )}
        </div>

        <Tabs
          variant="pill"
          tabs={[
            { id: "my", label: t("myPacks") },
            { id: "catalog", label: t("catalog") },
          ]}
          activeTab={modsTab}
          onChange={(id) => setModsTab(id as "my" | "catalog")}
        />

        <ModsLaunchBar />

        {modsTab === "catalog" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <Tabs
              variant="pill"
              tabs={[
                { id: "modrinth", label: t("modrinthCatalog") },
                { id: "curseforge", label: t("curseforgeCatalog") },
              ]}
              activeTab={catalogSource}
              onChange={(id) => setCatalogSource(id as CatalogSource)}
            />
            {catalogSource === "curseforge" && (
              <p className="text-xs text-text-muted">{t("curseforgeDesc")}</p>
            )}
          </div>
        )}

        {modsTab === "catalog" && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {FILTER_PILLS.map(({ id, labelKey }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCatalogKind(id)}
                  className={`no-drag rounded-full border px-4 py-1.5 text-sm transition ${
                    catalogKind === id
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "border-border bg-bg-card text-text-secondary hover:border-white/20 hover:text-text-primary"
                  }`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
            {catalogSource === "modrinth" && (
              <>
                <div className="hidden h-6 w-px bg-border sm:block" />
                <div className="flex flex-wrap gap-2">
                  {SORT_PILLS.map(({ id, labelKey, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCatalogSort(id)}
                      className={`no-drag inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                        catalogSort === id
                          ? "border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "border-border bg-bg-card text-text-muted hover:border-white/15 hover:text-text-secondary"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {modsTab === "my" && (
          <div className="mt-8">
            <div className="flex flex-wrap items-start gap-4">
              <button
                type="button"
                onClick={() => setShowCreatePackModal(true)}
                className="no-drag flex h-48 w-56 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/5"
              >
                <Plus className="mb-3 h-8 w-8 text-text-muted" />
                <span className="font-medium text-text-primary">
                  {t("createPack")}
                </span>
                <span className="mt-1 text-xs text-text-muted">
                  {t("createPackHint")}
                </span>
              </button>

              {modPacks.map((pack) => (
                <ModPackCard
                  key={pack.id}
                  pack={pack}
                  active={pack.id === activeModPackId}
                  onSelect={() => {
                    setActiveModPack(pack.id);
                    void syncPackContentFromDisk(pack.id);
                    navigate(`/mods/${pack.id}`);
                  }}
                  onRemove={() => void handleRemovePack(pack.id)}
                />
              ))}
            </div>

            {modPacks.length === 0 && (
              <p className="mt-6 max-w-md text-sm leading-relaxed text-text-secondary">
                {t("noPacks")}
              </p>
            )}
          </div>
        )}

        {modsTab === "catalog" && (
          <div className="mt-6">
            {catalog.loading && catalog.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="mb-3 h-8 w-8 animate-spin-slow text-[var(--accent)]" />
                <p className="text-sm text-text-muted">
                  {catalogSource === "modrinth"
                    ? t("catalogLoadingModrinth")
                    : t("catalogLoadingCurseforge")}
                </p>
              </div>
            ) : catalog.error ? (
              <div className="py-12 text-center text-sm text-red-400">
                <p>{catalog.error}</p>
                {catalog.error === t("curseforgeNoKey") ? (
                  <p className="mt-2 text-text-muted">{t("curseforgeNoKeyHint")}</p>
                ) : null}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {catalog.items.map((item) => (
                    <CatalogCard
                      key={`${item.source}-${item.id}`}
                      item={item}
                      onOpen={() => setDetailItem(item)}
                    />
                  ))}
                </div>
                {catalog.hasMore && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={catalog.loadMore}
                      disabled={catalog.loading}
                      className="no-drag rounded-xl border border-border bg-bg-card px-6 py-2.5 text-sm transition hover:bg-white/5 disabled:opacity-50"
                    >
                      {catalog.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin-slow" />
                      ) : (
                        t("loadMore")
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <CatalogDetailModal
        item={detailItem}
        open={detailItem !== null}
        installing={
          detailItem !== null &&
          (installingId === `${detailItem.source}:${detailItem.id}` ||
            resolvingInstall)
        }
        installed={
          detailItem !== null &&
          installedIds.has(`${detailItem.source}:${detailItem.id}`)
        }
        onClose={() => setDetailItem(null)}
        onInstall={(versionId) => {
          if (detailItem) void beginInstall(detailItem, versionId);
        }}
      />

      <InstallTargetModal
        open={installTarget !== null}
        item={installTarget?.item ?? null}
        versionId={installTarget?.versionId ?? null}
        mcVersion={installTarget?.mcVersion ?? "1.21.4"}
        loader={installTarget?.loader ?? "fabric"}
        installing={
          installTarget !== null &&
          installingId === `${installTarget.item.source}:${installTarget.item.id}`
        }
        onClose={() => setInstallTarget(null)}
        onConfirm={(choice) => {
          if (installTarget) {
            void handleInstall(
              installTarget.item,
              installTarget.versionId,
              choice,
            );
          }
        }}
      />
    </>
  );
}
