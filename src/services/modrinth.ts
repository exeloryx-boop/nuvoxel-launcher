import type {
  CatalogItem,
  CatalogSort,
  ModLoader,
  ModrinthProject,
  ModrinthSearchResult,
  ModrinthVersion,
} from "../types/mods";
import type { CatalogKind } from "../types";

const BASE = "https://api.modrinth.com/v2";
import { USER_AGENT } from "@shared/version";

const KIND_TO_TYPE: Record<CatalogKind, string> = {
  modpacks: "modpack",
  mods: "mod",
  resourcepacks: "resourcepack",
  shaders: "shader",
};

async function modrinthFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`Modrinth API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function searchModrinth(
  query: string,
  kind: CatalogKind,
  offset = 0,
  limit = 24,
  sort: CatalogSort = "downloads",
): Promise<{ items: CatalogItem[]; total: number }> {
  const projectType = KIND_TO_TYPE[kind];
  const facets = encodeURIComponent(`[["project_type:${projectType}"]]`);
  const q = encodeURIComponent(query);
  const result = await modrinthFetch<ModrinthSearchResult>(
    `/search?query=${q}&facets=${facets}&offset=${offset}&limit=${limit}&index=${sort}`,
  );

  const itemKind =
    kind === "modpacks"
      ? "modpack"
      : kind === "resourcepacks"
        ? "resourcepack"
        : kind === "shaders"
          ? "shader"
          : "mod";

  return {
    total: result.total_hits,
    items: result.hits.map((hit) => ({
      id: hit.project_id,
      source: "modrinth" as const,
      kind: itemKind,
      title: hit.title,
      description: hit.description,
      author: hit.author,
      downloads: hit.downloads,
      follows: hit.follows ?? 0,
      iconUrl: hit.icon_url,
      bannerUrl: hit.featured_gallery ?? hit.gallery?.[0] ?? null,
      categories: hit.display_categories,
    })),
  };
}

export async function getModrinthProject(
  projectId: string,
): Promise<ModrinthProject> {
  return modrinthFetch(`/project/${projectId}`);
}

export async function getProjectVersions(
  projectId: string,
): Promise<ModrinthVersion[]> {
  return modrinthFetch(`/project/${projectId}/version`);
}

export async function searchModsForPack(
  query: string,
  mcVersion: string,
  loader: ModLoader,
  offset = 0,
  limit = 20,
): Promise<{ items: CatalogItem[]; total: number }> {
  const facets: string[][] = [
    ["project_type:mod"],
    [`versions:${mcVersion}`],
  ];
  if (loader !== "vanilla") {
    facets.push([`categories:${loader}`]);
  }
  const facetsEncoded = encodeURIComponent(JSON.stringify(facets));
  const q = encodeURIComponent(query);
  const result = await modrinthFetch<ModrinthSearchResult>(
    `/search?query=${q}&facets=${facetsEncoded}&offset=${offset}&limit=${limit}&index=downloads`,
  );

  return {
    total: result.total_hits,
    items: result.hits.map((hit) => ({
      id: hit.project_id,
      source: "modrinth" as const,
      kind: "mod" as const,
      title: hit.title,
      description: hit.description,
      author: hit.author,
      downloads: hit.downloads,
      follows: hit.follows ?? 0,
      iconUrl: hit.icon_url,
      bannerUrl: hit.featured_gallery ?? hit.gallery?.[0] ?? null,
      categories: hit.display_categories,
    })),
  };
}

function loaderMatches(versionLoaders: string[], loader: ModLoader): boolean {
  if (loader === "vanilla") return true;
  const normalized = versionLoaders.map((l) => l.toLowerCase());
  if (normalized.includes(loader)) return true;
  if (loader === "quilt" && normalized.includes("fabric")) return true;
  return false;
}

export async function getModrinthVersionDownload(
  projectId: string,
  versionId: string,
): Promise<{
  url: string;
  filename: string;
  versionId: string;
  versionNumber: string;
  mcVersion: string;
  loader: ModLoader;
} | null> {
  const versions = await getProjectVersions(projectId);
  const version = versions.find((v) => v.id === versionId);
  if (!version) return null;

  const file =
    version.files?.find((f) => f.primary) ?? version.files?.[0];
  if (!file) return null;

  const mcVersion =
    version.game_versions.find((v) => /^\d+\.\d+/.test(v)) ??
    version.game_versions[0] ??
    "1.21.4";
  const modLoader = version.loaders.find(
    (l) => l !== "vanilla" && l !== "unknown",
  );
  let loader = modLoader ? mapModrinthLoader(modLoader) : "fabric";
  if (loader === "vanilla") loader = "fabric";

  return {
    url: file.url,
    filename: file.filename,
    versionId: version.id,
    versionNumber: version.version_number,
    mcVersion,
    loader,
  };
}

export async function findModDownload(
  projectId: string,
  mcVersion: string,
  loader: ModLoader,
): Promise<{
  url: string;
  filename: string;
  versionId: string;
  versionNumber: string;
} | null> {
  const versions = await getProjectVersions(projectId);

  for (const version of versions) {
    if (!version.game_versions.includes(mcVersion)) continue;
    if (!loaderMatches(version.loaders, loader)) continue;

    const file =
      version.files?.find((f) => f.primary) ?? version.files?.[0];
    if (!file) continue;

    return {
      url: file.url,
      filename: file.filename,
      versionId: version.id,
      versionNumber: version.version_number,
    };
  }

  return null;
}

export async function getLatestModrinthVersion(
  projectId: string,
): Promise<ModrinthVersion | null> {
  const versions = await getProjectVersions(projectId);
  return versions[0] ?? null;
}

export function mapModrinthLoader(
  loader: string,
): "fabric" | "forge" | "quilt" | "neoforge" | "vanilla" {
  const map: Record<string, "fabric" | "forge" | "quilt" | "neoforge"> = {
    fabric: "fabric",
    forge: "forge",
    quilt: "quilt",
    neoforge: "neoforge",
  };
  return map[loader.toLowerCase()] ?? "vanilla";
}

export { formatDownloads, formatDownloadsFull } from "../utils/format";
