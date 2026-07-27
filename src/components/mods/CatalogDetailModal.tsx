import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Star } from "lucide-react";
import { Modal } from "../ui/Modal";
import {
  CatalogLoaderFilter,
  formatVersionLoaders,
  versionMatchesLoaderFilter,
} from "./CatalogLoaderFilter";
import type { CatalogItem } from "../../types/mods";
import type { ModrinthProject, ModrinthVersion } from "../../types/mods";
import {
  formatDownloadsFull,
  getModrinthProject,
  getProjectVersions,
} from "../../services/modrinth";
import {
  curseForgeLoaderNames,
  getCurseForgeFiles,
  checkCurseForgeAvailable,
} from "../../services/curseforge";
import { t } from "../../i18n";

interface CatalogDetailModalProps {
  item: CatalogItem | null;
  open: boolean;
  installing?: boolean;
  installed?: boolean;
  onClose: () => void;
  onInstall: (versionId: string) => void;
}

interface CatalogVersionRow {
  id: string;
  label: string;
  mcVersions: string[];
  loaders: string[];
  date: string;
}

function formatVersionDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function toModrinthRows(versions: ModrinthVersion[]): CatalogVersionRow[] {
  return versions.map((version) => ({
    id: version.id,
    label: version.version_number || version.name,
    mcVersions: version.game_versions.filter((v) => /^\d+\.\d+/.test(v)),
    loaders: version.loaders.filter(
      (l) => l !== "unknown" && l !== "minecraft",
    ),
    date: version.date_published,
  }));
}

export function CatalogDetailModal({
  item,
  open,
  installing = false,
  installed = false,
  onClose,
  onInstall,
}: CatalogDetailModalProps) {
  const [project, setProject] = useState<ModrinthProject | null>(null);
  const [versionRows, setVersionRows] = useState<CatalogVersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );
  const [mcFilter, setMcFilter] = useState<string>("all");
  const [loaderFilter, setLoaderFilter] = useState<string>("all");

  useEffect(() => {
    if (!open || !item) {
      setProject(null);
      setVersionRows([]);
      setSelectedVersionId(null);
      setMcFilter("all");
      setLoaderFilter("all");
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        if (item.source === "modrinth") {
          const [proj, vers] = await Promise.all([
            getModrinthProject(item.id),
            getProjectVersions(item.id),
          ]);
          if (cancelled) return;
          setProject(proj);
          const rows = toModrinthRows(vers);
          setVersionRows(rows);
          setSelectedVersionId(rows[0]?.id ?? null);
          return;
        }

        if (!(await checkCurseForgeAvailable())) {
          throw new Error("CURSEFORGE_NO_KEY");
        }

        const files = await getCurseForgeFiles(item.id);
        if (cancelled) return;
        setProject(null);
        const rows: CatalogVersionRow[] = files.map((file) => ({
          id: String(file.id),
          label: file.displayName || file.fileName,
          mcVersions: file.gameVersions.filter((v) => /^\d+\.\d+/.test(v)),
          loaders: curseForgeLoaderNames(file.modLoaderTypes),
          date: file.fileDate,
        }));
        setVersionRows(rows);
        setSelectedVersionId(rows[0]?.id ?? null);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Error && e.message === "CURSEFORGE_NO_KEY") {
          setError(t("curseforgeNoKey"));
        } else {
          setError(t("catalogDetailError"));
        }
        setVersionRows([]);
        setSelectedVersionId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, item?.id, item?.source]);

  const mcVersions = useMemo(() => {
    const set = new Set<string>();
    for (const row of versionRows) {
      for (const gv of row.mcVersions) set.add(gv);
    }
    return [...set].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [versionRows]);

  const availableLoaders = useMemo(() => {
    const set = new Set<string>();
    for (const row of versionRows) {
      for (const loader of row.loaders) set.add(loader);
    }
    return [...set];
  }, [versionRows]);

  const filteredVersions = useMemo(() => {
    let list = versionRows;
    if (mcFilter !== "all") {
      list = list.filter((v) => v.mcVersions.includes(mcFilter));
    }
    if (loaderFilter !== "all") {
      list = list.filter((v) =>
        versionMatchesLoaderFilter(v.loaders, loaderFilter),
      );
    }
    return list;
  }, [versionRows, mcFilter, loaderFilter]);

  useEffect(() => {
    if (filteredVersions.length === 0) {
      setSelectedVersionId(null);
      return;
    }
    if (
      !selectedVersionId ||
      !filteredVersions.some((v) => v.id === selectedVersionId)
    ) {
      setSelectedVersionId(filteredVersions[0].id);
    }
  }, [filteredVersions, selectedVersionId]);

  if (!item) return null;

  const downloads = project?.downloads ?? item.downloads;
  const follows = project?.followers ?? item.follows;
  const description = project?.description ?? item.description;
  const sourceLabel =
    item.source === "modrinth" ? t("modrinthCatalog") : t("curseforgeCatalog");

  return (
    <Modal open={open} onClose={onClose} size="xl" title={item.title}>
      <div className="max-h-[75vh] overflow-y-auto">
        <div className="relative h-44 overflow-hidden bg-bg-elevated">
          {item.bannerUrl ? (
            <img
              src={item.bannerUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full bg-gradient-to-br from-[var(--accent)]/25 to-bg-elevated" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/40 to-transparent" />
          <span className="absolute right-4 top-4 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-text-secondary backdrop-blur-sm">
            {sourceLabel}
          </span>
          <div className="absolute bottom-4 left-6 flex items-end gap-4">
            {item.iconUrl ? (
              <img
                src={item.iconUrl}
                alt=""
                className="h-16 w-16 rounded-xl border-2 border-bg-card object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-bg-card bg-bg-elevated text-2xl font-bold text-text-muted">
                {item.title.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm text-text-secondary">{item.author}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 text-text-secondary">
                  <Download className="h-3.5 w-3.5 text-[var(--accent)]" />
                  {formatDownloadsFull(downloads)} {t("downloads")}
                </span>
                {follows > 0 ? (
                  <span className="inline-flex items-center gap-1 text-text-secondary">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {formatDownloadsFull(follows)} {t("catalogFollows")}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {item.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.categories.slice(0, 6).map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-border bg-bg-elevated px-3 py-0.5 text-xs capitalize text-text-secondary"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          <p className="text-sm leading-relaxed text-text-secondary">
            {description}
          </p>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-text-primary">
                {t("catalogSelectVersion")}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {mcVersions.length > 1 && (
                  <select
                    value={mcFilter}
                    onChange={(e) => setMcFilter(e.target.value)}
                    className="no-drag rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-sm text-text-primary outline-none focus:border-[var(--accent)]"
                  >
                    <option value="all">{t("catalogAllMcVersions")}</option>
                    {mcVersions.map((v) => (
                      <option key={v} value={v}>
                        Minecraft {v}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {availableLoaders.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {t("loaderLabel")}
                </p>
                <CatalogLoaderFilter
                  value={loaderFilter}
                  available={availableLoaders}
                  onChange={setLoaderFilter}
                />
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin-slow text-[var(--accent)]" />
              </div>
            ) : error ? (
              <div className="py-6 text-center text-sm text-red-400">
                <p>{error}</p>
                {error === t("curseforgeNoKey") ? (
                  <p className="mt-2 text-text-muted">{t("curseforgeNoKeyHint")}</p>
                ) : null}
              </div>
            ) : filteredVersions.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">
                {t("catalogNoVersions")}
              </p>
            ) : (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border bg-bg-elevated/50 p-1">
                {filteredVersions.map((version) => {
                  const selected = version.id === selectedVersionId;
                  const mc = version.mcVersions.join(", ");
                  const loaders = formatVersionLoaders(version.loaders);

                  return (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => setSelectedVersionId(version.id)}
                      className={`no-drag flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        selected
                          ? "bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/40"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-primary">
                          {version.label}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                          <span>{mc || t("minecraft")}</span>
                          {loaders ? (
                            <span className="rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-1.5 py-0.5 font-medium text-[var(--accent)]">
                              {loaders}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-text-muted">
                        {formatVersionDate(version.date)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="no-drag rounded-xl border border-border px-5 py-2.5 text-sm text-text-secondary transition hover:bg-white/5"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={
                installing || installed || !selectedVersionId || loading
              }
              onClick={() => {
                if (selectedVersionId) onInstall(selectedVersionId);
              }}
              className="no-drag flex min-w-[140px] items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {installing ? (
                <Loader2 className="h-4 w-4 animate-spin-slow" />
              ) : installed ? (
                t("installed")
              ) : (
                t("installPack")
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
