import type { CatalogSource, ModLoader, ModPack, PackMod } from "../types/mods";
import { findModDownload } from "./modrinth";
import { findCurseForgeDownload } from "./curseforge";

export interface ModUpdateInfo {
  modId: string;
  latestVersionId: string;
  latestVersionNumber: string;
}

function modCatalogSource(
  mod: PackMod,
  pack: ModPack,
): CatalogSource | null {
  if (mod.projectId.startsWith("local:")) return null;
  if (mod.catalogSource) return mod.catalogSource;
  if (pack.source) return pack.source;
  return "modrinth";
}

export async function checkModUpdate(
  mod: PackMod,
  pack: ModPack,
): Promise<ModUpdateInfo | null> {
  const source = modCatalogSource(mod, pack);
  if (!source || pack.loader === "vanilla") return null;

  if (source === "modrinth") {
    const download = await findModDownload(
      mod.projectId,
      pack.minecraftVersion,
      pack.loader,
    );
    if (!download || download.versionId === mod.versionId) return null;
    return {
      modId: mod.id,
      latestVersionId: download.versionId,
      latestVersionNumber: download.versionNumber,
    };
  }

  const download = await findCurseForgeDownload(
    mod.projectId,
    pack.minecraftVersion,
    pack.loader,
  );
  if (!download || download.versionId === mod.versionId) return null;
  return {
    modId: mod.id,
    latestVersionId: download.versionId,
    latestVersionNumber: download.versionNumber,
  };
}

export async function checkPackModUpdates(
  pack: ModPack,
): Promise<Map<string, ModUpdateInfo>> {
  const updates = new Map<string, ModUpdateInfo>();
  const mods = pack.mods ?? [];

  await Promise.all(
    mods.map(async (mod) => {
      try {
        const info = await checkModUpdate(mod, pack);
        if (info) updates.set(mod.id, info);
      } catch {
        /* skip failed check */
      }
    }),
  );

  return updates;
}

export function packCompatibleWithInstall(
  pack: ModPack,
  mcVersion: string,
  loader: ModLoader,
): boolean {
  if (pack.loader === "vanilla") return false;
  if (pack.minecraftVersion !== mcVersion) return false;
  if (pack.loader !== loader) {
    if (pack.loader === "quilt" && loader === "fabric") return true;
    return false;
  }
  return true;
}
