function pathSep(base: string): string {
  return base.includes("\\") ? "\\" : "/";
}

export function joinPath(base: string, ...parts: string[]): string {
  const sep = pathSep(base);
  const normalized = [base.replace(/[/\\]+$/, ""), ...parts].filter(Boolean);
  return normalized.join(sep);
}

export const PACKS_DIR_NAME = "nuvolexlauncher-packs";

export function getPackInstanceDir(gameDirectory: string, packId: string): string {
  return joinPath(gameDirectory, PACKS_DIR_NAME, packId);
}

export function getPackModsDir(gameDirectory: string, packId: string): string {
  return joinPath(getPackInstanceDir(gameDirectory, packId), "mods");
}

export function getPackResourcepacksDir(
  gameDirectory: string,
  packId: string,
): string {
  return joinPath(getPackInstanceDir(gameDirectory, packId), "resourcepacks");
}

export function getPackShaderpacksDir(
  gameDirectory: string,
  packId: string,
): string {
  return joinPath(getPackInstanceDir(gameDirectory, packId), "shaderpacks");
}
