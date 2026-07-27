import { getPackInstanceDir, joinPath } from "../utils/packPaths";

export interface PackAssetListing {
  path: string;
  is_directory: boolean;
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function downloadModFile(url: string, destPath: string): Promise<string> {
  if (!isTauri()) {
    throw new Error("ERR_DESKTOP_ONLY");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("download_mod_file", { url, destPath });
}

export async function deleteModFile(filePath: string): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("delete_mod_file", { path: filePath });
}

export async function copyModFile(sourcePath: string, destPath: string): Promise<string> {
  if (!isTauri()) {
    throw new Error("ERR_DESKTOP_ONLY");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("copy_mod_file", { sourcePath, destPath });
}

export async function deletePackFolder(folderPath: string): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("delete_pack_folder", { folderPath });
}

export async function listModFiles(folderPath: string): Promise<string[]> {
  if (!isTauri()) return [];
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string[]>("list_mod_files", { folderPath });
}

export async function openPackFolder(folderPath: string): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("open_folder", { folderPath });
}

export function buildModDestPath(
  gameDirectory: string,
  packId: string,
  filename: string,
): string {
  return joinPath(getPackInstanceDir(gameDirectory, packId), "mods", filename);
}

export function filenameFromPath(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] ?? filePath;
}

export function localModDisplayName(filename: string): string {
  return filename.replace(/\.jar$/i, "").replace(/[-_+]+/g, " ").trim();
}

export function normalizeModFilename(filename: string): string {
  return filenameFromPath(filename).toLowerCase();
}

export function normalizeModPath(path: string): string {
  return path.replace(/\\/g, "/").toLowerCase();
}

export async function copyPackFile(
  sourcePath: string,
  destPath: string,
): Promise<string> {
  if (!isTauri()) {
    throw new Error("ERR_DESKTOP_ONLY");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("copy_pack_file", { sourcePath, destPath });
}

export async function copyPackFolder(
  sourcePath: string,
  destPath: string,
): Promise<string> {
  if (!isTauri()) {
    throw new Error("ERR_DESKTOP_ONLY");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("copy_pack_folder", { sourcePath, destPath });
}

export async function pathIsDirectory(path: string): Promise<boolean> {
  if (!isTauri()) return false;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<boolean>("path_is_directory", { path });
}

export async function listPackAssets(
  folderPath: string,
): Promise<PackAssetListing[]> {
  if (!isTauri()) return [];
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<PackAssetListing[]>("list_pack_assets", { folderPath });
}

export function folderNameFromPath(folderPath: string): string {
  const normalized = folderPath.replace(/[/\\]+$/, "");
  const parts = normalized.split(/[/\\]/);
  return parts[parts.length - 1] ?? folderPath;
}

export function buildResourcepackDestPath(
  gameDirectory: string,
  packId: string,
  name: string,
): string {
  return joinPath(
    getPackInstanceDir(gameDirectory, packId),
    "resourcepacks",
    name,
  );
}

export function buildShaderDestPath(
  gameDirectory: string,
  packId: string,
  filename: string,
): string {
  return joinPath(
    getPackInstanceDir(gameDirectory, packId),
    "shaderpacks",
    filename,
  );
}

export function localAssetDisplayName(name: string): string {
  return name.replace(/\.zip$/i, "").replace(/[-_+]+/g, " ").trim();
}

export function normalizeAssetKey(name: string): string {
  return name.toLowerCase();
}
