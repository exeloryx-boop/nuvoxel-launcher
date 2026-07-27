export const LAUNCHER_TIP_KEYS = [
  "launcherTipDragDrop",
  "launcherTipResourcepacks",
  "launcherTipQuickLaunch",
  "launcherTipStreamer",
  "launcherTipAchievements",
  "launcherTipCatalog",
  "launcherTipSync",
  "launcherTipCustomize",
] as const;

export type LauncherTipKey = (typeof LAUNCHER_TIP_KEYS)[number];

export function pickLauncherTipKey(seed: number): LauncherTipKey {
  const index = Math.abs(seed) % LAUNCHER_TIP_KEYS.length;
  return LAUNCHER_TIP_KEYS[index]!;
}
