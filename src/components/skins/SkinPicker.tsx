import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, Search, Upload, X } from "lucide-react";
import { CapePicker } from "./CapePicker";
import { SkinModelPicker } from "./SkinModelPicker";
import {
  SKIN_CATALOG,
  SKIN_CATEGORIES,
  getCapeById,
  type SkinCategory,
  type SkinItem,
  type SkinModel,
} from "@shared/skins";
import { getCapeLabel, getSkinCategoryLabel } from "../../i18n";
import { useTranslation } from "../../hooks/useTranslation";
import { useAppStore } from "../../store/useAppStore";
import { MinecraftAvatar } from "../ui/MinecraftAvatar";
import { readAppearancePng, type AppearanceKind } from "../../utils/appearance";

const PAGE_SIZE = 48;

export function SkinPicker() {
  const { t, language } = useTranslation();
  const selectedSkin = useAppStore((s) => s.selectedSkin);
  const setSelectedSkin = useAppStore((s) => s.setSelectedSkin);
  const setSkinModel = useAppStore((s) => s.setSkinModel);
  const setSelectedCape = useAppStore((s) => s.setSelectedCape);
  const [category, setCategory] = useState<SkinCategory>("popular");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [appearanceError, setAppearanceError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const skinFileRef = useRef<HTMLInputElement>(null);
  const capeFileRef = useRef<HTMLInputElement>(null);

  const skinModel: SkinModel = selectedSkin?.model ?? "classic";
  const activeCape = getCapeById(selectedSkin?.capeId);

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<SkinCategory, number>;
    for (const c of SKIN_CATEGORIES) counts[c.id] = 0;
    for (const s of SKIN_CATALOG) counts[s.category]++;
    return counts;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q) {
      return SKIN_CATALOG.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          s.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return SKIN_CATALOG.filter((s) => s.category === category);
  }, [category, search]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const apply = (skin: SkinItem) => {
    setSelectedSkin({
      id: skin.id,
      name: skin.name,
      username: skin.username,
      model: skinModel,
      capeId: selectedSkin?.capeId ?? null,
      customCapeData: selectedSkin?.customCapeData ?? null,
    });
  };

  const uploadAppearance = async (kind: AppearanceKind, file: File | null) => {
    if (!file) return;
    setAppearanceError(null);
    try {
      const data = await readAppearancePng(file, kind);
      const base = selectedSkin ?? {
        id: "default-steve",
        name: "Steve",
        username: "Steve",
        model: skinModel,
        capeId: null,
      };
      if (kind === "skin") {
        setSelectedSkin({
          ...base,
          id: "custom-uploaded-skin",
          name: file.name.replace(/\.png$/i, "") || t("customSkinName"),
          username: "Custom",
          model: skinModel,
          customSkinData: data,
        });
      } else {
        setSelectedSkin({
          ...base,
          capeId: null,
          customCapeData: data,
        });
      }
    } catch (error) {
      setAppearanceError(
        error instanceof Error ? error.message : "appearanceReadError",
      );
    } finally {
      if (kind === "skin" && skinFileRef.current) skinFileRef.current.value = "";
      if (kind === "cape" && capeFileRef.current) capeFileRef.current.value = "";
    }
  };

  const clearCustomAppearance = (kind: AppearanceKind) => {
    if (!selectedSkin) return;
    if (kind === "skin" && selectedSkin.id === "custom-uploaded-skin") {
      setSelectedSkin({
        ...selectedSkin,
        id: "default-steve",
        name: "Steve",
        username: "Steve",
        customSkinData: null,
      });
      return;
    }
    setSelectedSkin({
      ...selectedSkin,
      ...(kind === "skin"
        ? { customSkinData: null }
        : { customCapeData: null }),
    });
  };

  return (
    <div className="mt-6 space-y-4">
      <SkinModelPicker value={skinModel} onChange={setSkinModel} />
      <CapePicker
        value={selectedSkin?.capeId ?? null}
        onChange={setSelectedCape}
      />

      <div className="rounded-2xl border border-dashed border-[var(--accent)]/40 bg-[var(--accent)]/5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{t("customAppearanceTitle")}</p>
            <p className="text-xs text-text-muted">{t("customAppearanceDesc")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={skinFileRef}
              type="file"
              accept="image/png,.png"
              className="hidden"
              onChange={(event) =>
                void uploadAppearance("skin", event.target.files?.[0] ?? null)
              }
            />
            <input
              ref={capeFileRef}
              type="file"
              accept="image/png,.png"
              className="hidden"
              onChange={(event) =>
                void uploadAppearance("cape", event.target.files?.[0] ?? null)
              }
            />
            <button
              type="button"
              onClick={() => skinFileRef.current?.click()}
              className="no-drag flex items-center gap-2 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white"
            >
              <Upload className="h-4 w-4" />
              {t("uploadSkin")}
            </button>
            <button
              type="button"
              onClick={() => capeFileRef.current?.click()}
              className="no-drag flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-text-secondary hover:bg-white/5"
            >
              <Upload className="h-4 w-4" />
              {t("uploadCape")}
            </button>
          </div>
        </div>
        {(selectedSkin?.customSkinData || selectedSkin?.customCapeData) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {selectedSkin.customSkinData && (
              <button
                type="button"
                onClick={() => clearCustomAppearance("skin")}
                className="no-drag flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-text-secondary hover:bg-white/5"
              >
                <X className="h-3.5 w-3.5" /> {t("removeUploadedSkin")}
              </button>
            )}
            {selectedSkin.customCapeData && (
              <button
                type="button"
                onClick={() => clearCustomAppearance("cape")}
                className="no-drag flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-text-secondary hover:bg-white/5"
              >
                <X className="h-3.5 w-3.5" /> {t("removeUploadedCape")}
              </button>
            )}
          </div>
        )}
        {appearanceError && (
          <p className="mt-3 text-xs text-red-400">{t(appearanceError as Parameters<typeof t>[0])}</p>
        )}
      </div>

            {selectedSkin && (
        <div className="glass-card flex flex-col gap-4 rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <MinecraftAvatar
              skinUsername={selectedSkin.username}
              username={selectedSkin.username}
              capeTextureUsername={activeCape?.textureUsername}
              customSkinData={selectedSkin.customSkinData}
              customCapeData={selectedSkin.customCapeData}
              model={skinModel}
              variant="body"
              size={64}
            />
            <div>
              <p className="text-sm text-text-secondary">{t("activeSkin")}</p>
              <p className="text-lg font-semibold">{selectedSkin.name}</p>
              {activeCape && (
                <p className="text-xs text-[var(--accent)]">
                  {t("activeCape")}: {getCapeLabel(activeCape.nameKey)}
                </p>
              )}
              {selectedSkin.customCapeData && (
                <p className="text-xs text-[var(--accent)]">{t("uploadedCapeActive")}</p>
              )}
              <p className="text-xs text-text-muted">{t("skinInGameHint")}</p>
            </div>
          </div>
          <div className="flex shrink-0">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="no-drag flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-white/15 transition"
            >
              <Eye className="h-4 w-4" />
              {t("skinPreviewTitle")}
            </button>
          </div>
        </div>
      )}

      {showPreviewModal && selectedSkin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card relative w-full max-w-xl rounded-3xl border border-white/10 bg-bg-secondary p-6 shadow-2xl animate-scale-up">
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="no-drag absolute right-4 top-4 rounded-full p-2 text-text-secondary hover:bg-white/10 hover:text-text-primary transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-text-primary">
              {t("skinPreviewTitle")}
            </h3>
            <p className="text-sm text-text-muted mt-1">
              {t("skinPreviewHint")}
            </p>

            <div className="mt-8 flex justify-center items-center gap-12 py-6">
              {/* Front view */}
              <div className="flex flex-col items-center gap-3">
                <div className="glass-card rounded-2xl border border-white/5 bg-white/5 p-6 hover:bg-white/10 transition">
                  <MinecraftAvatar
                    skinUsername={selectedSkin.username}
                    username={selectedSkin.username}
                    capeTextureUsername={activeCape?.textureUsername}
                    customSkinData={selectedSkin.customSkinData}
                    customCapeData={selectedSkin.customCapeData}
                    model={skinModel}
                    variant="body"
                    direction="front"
                    size={110}
                  />
                </div>
                <span className="text-xs font-semibold text-text-muted tracking-wider uppercase">
                  {language === "uk" ? "Вигляд спереду" : language === "ru" ? "Вид спереди" : "Front View"}
                </span>
              </div>

              {/* Back view */}
              <div className="flex flex-col items-center gap-3">
                <div className="glass-card rounded-2xl border border-white/5 bg-white/5 p-6 hover:bg-white/10 transition">
                  <MinecraftAvatar
                    skinUsername={selectedSkin.username}
                    username={selectedSkin.username}
                    capeTextureUsername={activeCape?.textureUsername}
                    customSkinData={selectedSkin.customSkinData}
                    customCapeData={selectedSkin.customCapeData}
                    model={skinModel}
                    variant="body"
                    direction="back"
                    size={110}
                  />
                </div>
                <span className="text-xs font-semibold text-text-muted tracking-wider uppercase">
                  {language === "uk" ? "Вигляд ззаду" : language === "ru" ? "Вид сзади" : "Back View"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="no-drag rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-6 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-[var(--accent)]/25"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          {t("skinCatalogTotal", { count: String(SKIN_CATALOG.length) })}
        </p>
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("skinSearch")}
            className="no-drag w-full rounded-xl border border-border bg-bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {!search.trim() && (
        <div className="flex flex-wrap gap-2">
          {SKIN_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`no-drag rounded-full px-4 py-1.5 text-sm transition ${
                category === c.id
                  ? "bg-[var(--accent)] text-white"
                  : "border border-border bg-bg-card text-text-secondary hover:border-white/20"
              }`}
            >
              {getSkinCategoryLabel(c.id)}
              <span className="ml-1 opacity-70">({categoryCounts[c.id]})</span>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">{t("skinNoResults")}</p>
      ) : (
        <>
          <p className="text-xs text-text-muted">
            {t("skinShowingCount")
              .replace("{shown}", String(visible.length))
              .replace("{total}", String(filtered.length))}
          </p>
          <div className="grid max-h-[480px] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((skin) => {
              const active = selectedSkin?.id === skin.id;
              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => apply(skin)}
                  className={`no-drag group relative overflow-hidden rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-border bg-bg-card hover:border-white/20"
                  }`}
                >
                  <MinecraftAvatar
                    skinUsername={skin.username}
                    username={skin.username}
                    model={skinModel}
                    size={48}
                    className="mx-auto mb-2"
                    lazy
                  />
                  <p className="truncate text-center text-sm font-medium">
                    {skin.name}
                  </p>
                  {active && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="no-drag w-full rounded-xl border border-border bg-bg-card py-2.5 text-sm font-medium text-text-secondary transition hover:border-[var(--accent)]/40 hover:text-text-primary"
            >
              {t("skinLoadMore")} (+{Math.min(PAGE_SIZE, filtered.length - visibleCount)})
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}