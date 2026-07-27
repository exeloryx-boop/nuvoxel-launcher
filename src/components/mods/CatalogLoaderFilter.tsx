import { t } from "../../i18n";
import { LoaderIcon, type LoaderIconId } from "../ui/LoaderIcon";
import { mapModrinthLoader } from "../../services/modrinth";
import type { ModLoader } from "../../types/mods";

const LOADER_ORDER: ModLoader[] = [
  "forge",
  "fabric",
  "quilt",
  "neoforge",
  "vanilla",
];

const LOADER_LABELS: Record<ModLoader, string> = {
  vanilla: "Vanilla",
  fabric: "Fabric",
  forge: "Forge",
  neoforge: "NeoForge",
  quilt: "Quilt",
};

interface CatalogLoaderFilterProps {
  value: string;
  available: string[];
  onChange: (loader: string) => void;
  compact?: boolean;
}

export function CatalogLoaderFilter({
  value,
  available,
  onChange,
  compact = true,
}: CatalogLoaderFilterProps) {
  const mapped = available
    .map((l) => mapModrinthLoader(l))
    .filter((l, i, arr) => arr.indexOf(l) === i)
    .sort((a, b) => LOADER_ORDER.indexOf(a) - LOADER_ORDER.indexOf(b));

  if (mapped.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <LoaderFilterButton
        active={value === "all"}
        label={t("catalogAllLoaders")}
        onClick={() => onChange("all")}
        compact={compact}
      />
      {mapped.map((loader) => (
        <LoaderFilterButton
          key={loader}
          active={value === loader}
          label={loader === "vanilla" ? t("loaderVanilla") : LOADER_LABELS[loader]}
          loader={loader}
          onClick={() => onChange(loader)}
          compact={compact}
        />
      ))}
    </div>
  );
}

function LoaderFilterButton({
  active,
  label,
  loader,
  onClick,
  compact,
}: {
  active: boolean;
  label: string;
  loader?: ModLoader;
  onClick: () => void;
  compact: boolean;
}) {
  const iconId = loader as LoaderIconId | undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`no-drag flex items-center gap-1.5 rounded-lg border transition ${
        compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
      } ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
          : "border-border bg-bg-card text-text-secondary hover:border-white/15 hover:text-text-primary"
      }`}
    >
      {iconId ? <LoaderIcon loader={iconId} size={compact ? 16 : 20} /> : null}
      {label}
    </button>
  );
}

export function versionMatchesLoaderFilter(
  loaders: string[],
  filter: string,
): boolean {
  if (filter === "all") return true;
  return loaders.some((l) => mapModrinthLoader(l) === filter);
}

export function formatVersionLoaders(loaders: string[]): string {
  const labels = loaders
    .filter((l) => l !== "unknown" && l !== "minecraft")
    .map((l) => {
      const mapped = mapModrinthLoader(l);
      return mapped === "vanilla"
        ? LOADER_LABELS.vanilla
        : LOADER_LABELS[mapped];
    });
  return [...new Set(labels)].join(", ");
}
