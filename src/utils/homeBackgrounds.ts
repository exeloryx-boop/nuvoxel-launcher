import type { HomeBackgroundPreset } from "../types";

export interface HomeBackgroundStyle {
  image?: string;
  gradient: string;
}

export const HOME_BACKGROUND_PRESETS: {
  id: HomeBackgroundPreset;
  labelKey: string;
}[] = [
  { id: "copper", labelKey: "homeBgCopper" },
  { id: "nether", labelKey: "homeBgNether" },
  { id: "end", labelKey: "homeBgEnd" },
  { id: "ocean", labelKey: "homeBgOcean" },
  { id: "forest", labelKey: "homeBgForest" },
  { id: "sunset", labelKey: "homeBgSunset" },
  { id: "aurora", labelKey: "homeBgAurora" },
  { id: "voxel", labelKey: "homeBgVoxel" },
  { id: "none", labelKey: "homeBgNone" },
];

const STYLES: Record<HomeBackgroundPreset, HomeBackgroundStyle> = {
  copper: {
    image: "/bg-copper-age.png",
    gradient:
      "linear-gradient(145deg, #1a1208 0%, #3d2814 35%, #1a1510 70%, #0a0a0f 100%)",
  },
  nether: {
    gradient:
      "linear-gradient(145deg, #1a0505 0%, #5c1515 40%, #2d1810 75%, #0a0808 100%)",
  },
  end: {
    gradient:
      "linear-gradient(160deg, #120818 0%, #2d1a4a 45%, #1a1030 80%, #08060f 100%)",
  },
  ocean: {
    gradient:
      "linear-gradient(155deg, #041018 0%, #0c4a6e 40%, #164e63 70%, #0a0a0f 100%)",
  },
  forest: {
    gradient:
      "linear-gradient(150deg, #0a1208 0%, #14532d 42%, #1a2e1a 75%, #0a0a0f 100%)",
  },
  sunset: {
    gradient:
      "linear-gradient(135deg, #1a0a18 0%, #7c2d12 35%, #c2410c 55%, #1a1020 100%)",
  },
  aurora: {
    gradient:
      "linear-gradient(160deg, #0a1628 0%, #065f46 30%, #6366f1 55%, #0f172a 100%)",
  },
  voxel: {
    gradient: "linear-gradient(135deg, #0a0a0f 0%, #12121c 50%, #0d0d14 100%)",
  },
  none: {
    gradient: "var(--bg-primary)",
  },
};

export function getHomeBackgroundStyle(
  preset: HomeBackgroundPreset,
): HomeBackgroundStyle {
  return STYLES[preset] ?? STYLES.copper;
}
