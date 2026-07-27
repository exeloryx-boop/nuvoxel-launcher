import type { ModLoader } from "../../types/mods";

export type LoaderIconId = ModLoader | "optifine";

const LOADER_ICONS: Record<LoaderIconId, string> = {
  vanilla: "/loaders/vanilla.svg",
  fabric: "/loaders/fabric.svg",
  forge: "/loaders/forge.svg",
  neoforge: "/loaders/neoforge.svg",
  quilt: "/loaders/fabric.svg",
  optifine: "/loaders/optifine.svg",
};

interface LoaderIconProps {
  loader: LoaderIconId;
  size?: number;
  className?: string;
}

export function LoaderIcon({ loader, size = 36, className = "" }: LoaderIconProps) {
  const src = LOADER_ICONS[loader] ?? LOADER_ICONS.vanilla;
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`rounded-lg object-contain ${className}`}
      draggable={false}
    />
  );
}

export function getLoaderIconPath(loader: LoaderIconId): string {
  return LOADER_ICONS[loader] ?? LOADER_ICONS.vanilla;
}
