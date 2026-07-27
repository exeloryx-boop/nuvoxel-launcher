import type { ModLoader } from "../types/mods";
import { getProjectVersions } from "./modrinth";

export interface ModpackInstallResult {
  minecraftVersion: string;
  loader: ModLoader;
  modCount: number;
  modFilenames: string[];
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function findModpackDownload(
  projectId: string,
  versionId?: string,
): Promise<{ url: string; filename: string; versionId: string } | null> {
  const versions = await getProjectVersions(projectId);
  const scan = versionId
    ? versions.filter((v) => v.id === versionId)
    : versions;
  for (const version of scan) {
    const file =
      version.files?.find((f) =>
        f.filename.toLowerCase().endsWith(".mrpack"),
      ) ?? version.files?.find((f) => f.primary);
    if (!file) continue;
    if (!file.filename.toLowerCase().endsWith(".mrpack")) continue;
    return {
      url: file.url,
      filename: file.filename,
      versionId: version.id,
    };
  }
  return null;
}

function mapLoader(raw: string): ModLoader {
  const l = raw.toLowerCase();
  if (l === "fabric" || l === "quilt" || l === "forge" || l === "neoforge") {
    return l;
  }
  if (l === "vanilla") return "vanilla";
  return "fabric";
}

export async function installModrinthModpack(
  projectId: string,
  packDir: string,
  versionId?: string,
): Promise<ModpackInstallResult> {
  if (!isTauri()) {
    throw new Error("ERR_DESKTOP_ONLY");
  }

  const download = await findModpackDownload(projectId, versionId);
  if (!download) {
    throw new Error("ERR_NO_MODPACK_FILE");
  }

  const { invoke } = await import("@tauri-apps/api/core");
  const result = await invoke<{
    minecraftVersion: string;
    loader: string;
    modCount: number;
    modFilenames: string[];
  }>("install_modrinth_modpack", {
    mrpackUrl: download.url,
    packDir,
  });

  return {
    minecraftVersion: result.minecraftVersion,
    loader: mapLoader(result.loader),
    modCount: result.modCount,
    modFilenames: result.modFilenames,
  };
}
