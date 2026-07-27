import type { CatalogItem, ModLoader } from "../types/mods";
import {
  getModrinthVersionDownload,
} from "./modrinth";
import {
  getCurseForgeFile,
  mapCurseForgeLoader,
} from "./curseforge";

export async function resolveCatalogInstallContext(
  item: CatalogItem,
  versionId: string,
): Promise<{ mcVersion: string; loader: ModLoader }> {
  if (item.source === "modrinth") {
    const version = await getModrinthVersionDownload(item.id, versionId);
    if (!version) throw new Error("no version");
    return { mcVersion: version.mcVersion, loader: version.loader };
  }

  const file = await getCurseForgeFile(item.id, versionId);
  if (!file) throw new Error("no version");
  let loader = mapCurseForgeLoader(file.modLoaderTypes);
  if (loader === "vanilla") loader = "fabric";
  const mcVersion =
    file.gameVersions.find((v) => /^\d+\.\d+/.test(v)) ??
    file.gameVersions[0] ??
    "1.21.4";
  return { mcVersion, loader };
}
