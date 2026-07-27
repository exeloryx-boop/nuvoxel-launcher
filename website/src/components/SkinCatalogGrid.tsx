import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import {
  SKIN_CATALOG,
  SKIN_CATEGORIES,
  getSkinAvatarUrl,
  type SkinCategory,
  type SkinItem,
} from "@shared/skins";
import { useWebsiteStore } from "../store/useWebsiteStore";
import { useWebI18n } from "../hooks/useWebI18n";

export function SkinCatalogGrid() {
  const { t, skinCategory } = useWebI18n();
  const selectedSkin = useWebsiteStore((s) => s.selectedSkin);
  const setSelectedSkin = useWebsiteStore((s) => s.setSelectedSkin);
  const [category, setCategory] = useState<SkinCategory>("popular");
  const [search, setSearch] = useState("");
  const [appliedId, setAppliedId] = useState<string | null>(null);

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
          s.username.toLowerCase().includes(q),
      );
    }
    return SKIN_CATALOG.filter((s) => s.category === category);
  }, [category, search]);

  const apply = (skin: SkinItem) => {
    setSelectedSkin({
      id: skin.id,
      name: skin.name,
      username: skin.username,
      model: selectedSkin?.model ?? "classic",
      capeId: selectedSkin?.capeId ?? null,
    });
    setAppliedId(skin.id);
    setTimeout(() => setAppliedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {selectedSkin && (
        <div className="glass-card flex items-center gap-4 p-5">
          <img
            src={getSkinAvatarUrl(selectedSkin.username, 64)}
            alt={selectedSkin.name}
            className="rounded-lg"
            style={{ imageRendering: "pixelated" }}
          />
          <div>
            <p className="text-sm text-zinc-400">{t("skinsActive")}</p>
            <p className="text-xl font-semibold">{selectedSkin.name}</p>
            <p className="text-sm text-zinc-500">{t("skinsSyncHint")}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          {t("skinCatalogTotal", { count: String(SKIN_CATALOG.length) })}
        </p>
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("skinSearch")}
            className="w-full rounded-xl border border-white/10 bg-[#12121a] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--nl-green)]"
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
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                category === c.id
                  ? "bg-[var(--nl-green)] text-white"
                  : "border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20"
              }`}
            >
              {skinCategory(c.id)}
              <span className="ml-1 opacity-70">({categoryCounts[c.id]})</span>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">{t("skinNoResults")}</p>
      ) : (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((skin) => {
          const active = selectedSkin?.id === skin.id;
          const justApplied = appliedId === skin.id;
          return (
            <button
              key={skin.id}
              type="button"
              onClick={() => apply(skin)}
              className={`group relative overflow-hidden rounded-xl border p-4 text-left transition ${
                active
                  ? "border-[var(--nl-green)] bg-[var(--nl-green)]/10"
                  : "border-white/10 bg-[#12121a] hover:border-white/20"
              }`}
            >
              <img
                src={getSkinAvatarUrl(skin.username, 56)}
                alt={skin.name}
                className="mx-auto mb-3"
                style={{ imageRendering: "pixelated" }}
              />
              <p className="truncate text-center text-sm font-medium">
                {skin.name}
              </p>
              {(active || justApplied) && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--nl-green)]">
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
              )}
              <span className="mt-2 block text-center text-xs text-[var(--nl-green)] opacity-0 transition group-hover:opacity-100">
                {t("skinsApply")}
              </span>
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
}
