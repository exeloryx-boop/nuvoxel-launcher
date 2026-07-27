import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import { LoaderIcon, type LoaderIconId } from "../ui/LoaderIcon";
import type { ModLoader } from "../../types/mods";

export const LOADER_IDS = [
  "vanilla",
  "fabric",
  "quilt",
  "forge",
  "neoforge",
  "optifine",
] as const;

export type LoaderPickerId = (typeof LOADER_IDS)[number];

const LOADER_LABELS: Record<LoaderPickerId, string> = {
  vanilla: "Vanilla",
  fabric: "Fabric",
  forge: "Forge",
  neoforge: "NeoForge",
  quilt: "Quilt",
  optifine: "OptiFine",
};

interface LoaderPickerProps {
  compact?: boolean;
  className?: string;
  /** When true, picking a loader clears active modpack if loaders differ. */
  clearPackOnChange?: boolean;
}

export function LoaderPicker({
  compact = false,
  className = "",
  clearPackOnChange = true,
}: LoaderPickerProps) {
  const versionPickerLoader = useAppStore((s) => s.versionPickerLoader);
  const setVersionPickerLoader = useAppStore((s) => s.setVersionPickerLoader);
  const activeModPackId = useAppStore((s) => s.activeModPackId);
  const modPacks = useAppStore((s) => s.modPacks);
  const setActiveModPack = useAppStore((s) => s.setActiveModPack);

  const pickLoader = (id: LoaderPickerId) => {
    const loader: ModLoader = id === "optifine" ? "forge" : id;
    setVersionPickerLoader(loader);
    if (!clearPackOnChange || !activeModPackId) return;
    const pack = modPacks.find((p) => p.id === activeModPackId);
    if (pack && pack.loader !== loader) {
      setActiveModPack(null);
    }
  };

  const isActive = (id: LoaderPickerId) => {
    if (id === "optifine") return versionPickerLoader === "forge";
    return versionPickerLoader === id;
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {LOADER_IDS.map((id) => {
        const active = isActive(id);
        const iconId: LoaderIconId = id === "optifine" ? "optifine" : id;
        const label =
          id === "vanilla"
            ? t("loaderVanilla")
            : LOADER_LABELS[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => pickLoader(id)}
            className={`no-drag flex items-center gap-2 rounded-xl border transition ${
              compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
            } ${
              active
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-border bg-bg-card text-text-secondary hover:border-white/15 hover:text-text-primary"
            }`}
          >
            <LoaderIcon loader={iconId} size={compact ? 18 : 22} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
