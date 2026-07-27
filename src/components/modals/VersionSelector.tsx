import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { useAppStore } from "../../store/useAppStore";
import { LoaderIcon, type LoaderIconId } from "../ui/LoaderIcon";
import type { ModLoader } from "../../types/mods";

interface VersionSelectorProps {
  compact?: boolean;
  className?: string;
}

const LOADER_LABELS: Record<ModLoader | "optifine", string> = {
  vanilla: "Vanilla",
  fabric: "Fabric",
  forge: "Forge",
  neoforge: "NeoForge",
  quilt: "Quilt",
  optifine: "OptiFine",
};

export function VersionSelector({
  compact = false,
  className = "",
}: VersionSelectorProps) {
  const { t } = useTranslation();
  const minecraftVersion = useAppStore((s) => s.minecraftVersion);
  const versionPickerLoader = useAppStore((s) => s.versionPickerLoader);
  const setShowVersionPicker = useAppStore((s) => s.setShowVersionPicker);
  const showVersionPicker = useAppStore((s) => s.showVersionPicker);
  const copyVersionOnClick = useAppStore((s) => s.copyVersionOnClick);
  const showToast = useAppStore((s) => s.showToast);
  const activeModPack = useAppStore((s) =>
    s.modPacks.find((p) => p.id === s.activeModPackId),
  );

  const loaderLabel =
    versionPickerLoader === "vanilla"
      ? t("loaderVanilla")
      : LOADER_LABELS[versionPickerLoader] ?? versionPickerLoader;

  const iconLoader: LoaderIconId =
    versionPickerLoader === "vanilla" ? "vanilla" : versionPickerLoader;

  const versionText = activeModPack
    ? `${activeModPack.name} · ${activeModPack.minecraftVersion}`
    : `${loaderLabel} · ${minecraftVersion}`;

  const handleClick = (e: { ctrlKey: boolean; metaKey: boolean; preventDefault: () => void }) => {
    if (copyVersionOnClick && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void navigator.clipboard.writeText(versionText);
      showToast("versionShareCopied");
      setTimeout(() => useAppStore.getState().clearToast(), 2000);
      return;
    }
    setShowVersionPicker(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`no-drag flex items-center gap-3 rounded-xl border transition hover:border-white/15 ${
        compact
          ? "border-border bg-bg-card px-4 py-2.5"
          : "border-white/10 bg-black/30 px-4 py-3 backdrop-blur"
      } ${className}`}
    >
      {activeModPack?.modrinthIconUrl ? (
        <img
          src={activeModPack.modrinthIconUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded object-cover"
        />
      ) : (
        <LoaderIcon loader={iconLoader} size={32} />
      )}
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {activeModPack ? t("activePack") : t("version")}
        </p>
        <p className={`truncate font-medium ${compact ? "text-sm" : ""}`}>
          {activeModPack ? (
            <>
              {activeModPack.name}
              <span className="text-text-muted">
                {" "}
                · {activeModPack.minecraftVersion}
              </span>
            </>
          ) : (
            <>
              {loaderLabel}
              <span className="text-text-muted"> · {minecraftVersion}</span>
            </>
          )}
        </p>
      </div>
      {showVersionPicker ? (
        <ChevronUp className="h-4 w-4 shrink-0 text-text-muted" />
      ) : (
        <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
      )}
    </button>
  );
}
