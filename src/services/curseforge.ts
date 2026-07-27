import type { CatalogItem, ModLoader } from "../types/mods";
import type { CatalogKind } from "../types";
import { formatDownloads } from "../utils/format";
import { getSocialApiUrl } from "./nuvoxelApi";
import { invoke } from "@tauri-apps/api/core";

export { formatDownloads };

const BASE = "https://api.curseforge.com/v1";
const MINECRAFT_GAME_ID = 432;
const CLASS_MODPACK = 4471;
const CLASS_MOD = 6;
const CLASS_RESOURCEPACK = 12;

const KIND_TO_CLASS: Record<CatalogKind, number> = {
  modpacks: CLASS_MODPACK,
  mods: CLASS_MOD,
  resourcepacks: CLASS_RESOURCEPACK,
  // CurseForge groups shader packs with resource packs; categories filter them.
  shaders: CLASS_RESOURCEPACK,
};

interface CurseForgeMod {
  id: number;
  name: string;
  slug: string;
  summary: string;
  downloadCount: number;
  classId?: number;
  logo?: { url?: string; thumbnailUrl?: string };
  authors?: { name: string }[];
  categories?: { name: string }[];
}

interface CurseForgeFeaturedResponse {
  data: {
    featured: CurseForgeMod[];
    popular: CurseForgeMod[];
    recentlyUpdated: CurseForgeMod[];
  };
}

interface CurseForgeSearchResponse {
  data: CurseForgeMod[];
  pagination: { totalCount: number; index: number; pageSize: number };
}

export interface CurseForgeFileEntry {
  id: number;
  displayName: string;
  fileName: string;
  fileDate: string;
  gameVersions: string[];
  modLoaderTypes?: number[];
  downloadUrl?: string;
}

interface CurseForgeFile {
  id: number;
  gameVersions: string[];
  modLoaderTypes?: number[];
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let storedApiKeyGetter: () => string | undefined = () => undefined;

export function registerCurseForgeApiKeyGetter(
  getter: () => string | undefined,
): void {
  storedApiKeyGetter = getter;
}

function getDirectApiKey(): string | undefined {
  const fromStore = storedApiKeyGetter()?.trim();
  if (fromStore) return fromStore;
  const key = import.meta.env.VITE_CURSEFORGE_API_KEY as string | undefined;
  return key?.trim() || undefined;
}

let proxyAvailableCache: boolean | null = null;
let proxyCheckPromise: Promise<boolean> | null = null;
let tauriAvailableCache: boolean | null = null;
let tauriCheckPromise: Promise<boolean> | null = null;

export function resetCurseForgeAvailabilityCache(): void {
  proxyAvailableCache = null;
  proxyCheckPromise = null;
  tauriAvailableCache = null;
  tauriCheckPromise = null;
}

async function checkTauriCurseForgeAvailable(): Promise<boolean> {
  if (!isTauri()) return false;
  if (getDirectApiKey()) return true;
  if (tauriAvailableCache !== null) return tauriAvailableCache;
  if (!tauriCheckPromise) {
    tauriCheckPromise = (async () => {
      try {
        tauriAvailableCache = await invoke<boolean>("curseforge_available", {
          api_key: null,
        });
        return tauriAvailableCache;
      } catch {
        tauriAvailableCache = false;
        return false;
      }
    })();
  }
  return tauriCheckPromise;
}

export async function checkCurseForgeAvailable(): Promise<boolean> {
  if (getDirectApiKey()) return true;
  if (await checkTauriCurseForgeAvailable()) return true;
  if (proxyAvailableCache !== null) return proxyAvailableCache;
  if (!proxyCheckPromise) {
    proxyCheckPromise = (async () => {
      try {
        const res = await fetch(`${getSocialApiUrl()}/curseforge/status`, {
          signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) {
          proxyAvailableCache = false;
          return false;
        }
        const data = (await res.json()) as { available?: boolean };
        proxyAvailableCache = !!data.available;
        return proxyAvailableCache;
      } catch {
        proxyAvailableCache = false;
        return false;
      }
    })();
  }
  return proxyCheckPromise;
}

/** Verify the configured key actually works against the CurseForge API. */
export async function verifyCurseForgeApiKey(): Promise<boolean> {
  try {
    await curseforgeFetch<{ data: unknown[] }>("/games?index=0&pageSize=1");
    return true;
  } catch {
    return false;
  }
}

/** @deprecated Use checkCurseForgeAvailable() */
export function hasCurseForgeKey(): boolean {
  return !!getDirectApiKey();
}

interface CurseForgeFetchInit {
  method?: "GET" | "POST";
  body?: unknown;
}

async function curseforgeFetch<T>(
  path: string,
  init: CurseForgeFetchInit = {},
): Promise<T> {
  const directKey = getDirectApiKey();
  const method = init.method ?? "GET";
  const payload =
    init.body !== undefined ? JSON.stringify(init.body) : undefined;

  if (isTauri()) {
    const useTauri = directKey || (await checkTauriCurseForgeAvailable());
    if (useTauri) {
      const body = await invoke<string>("curseforge_fetch", {
        path,
        api_key: directKey ?? null,
        method,
        body: payload ?? null,
      });
      return JSON.parse(body) as T;
    }
  }

  let url: string;
  const headers: Record<string, string> = { Accept: "application/json" };

  if (directKey) {
    url = `${BASE}${path}`;
    headers["x-api-key"] = directKey;
  } else {
    const available = await checkCurseForgeAvailable();
    if (!available) throw new Error("CURSEFORGE_NO_KEY");
    url = `${getSocialApiUrl()}/curseforge${path}`;
  }

  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: method !== "GET" ? payload ?? "{}" : undefined,
  });

  if (!res.ok) throw new Error(`CurseForge API error: ${res.status}`);
  return res.json() as Promise<T>;
}

function mapCurseForgeMod(mod: CurseForgeMod, kind: CatalogKind): CatalogItem {
  return {
    id: String(mod.id),
    source: "curseforge" as const,
    kind:
      kind === "modpacks"
        ? "modpack"
        : kind === "resourcepacks"
          ? "resourcepack"
          : kind === "shaders"
            ? "shader"
            : "mod",
    title: mod.name,
    description: mod.summary,
    author: mod.authors?.[0]?.name ?? "Unknown",
    downloads: mod.downloadCount,
    follows: 0,
    iconUrl: mod.logo?.url ?? mod.logo?.thumbnailUrl ?? null,
    bannerUrl: mod.logo?.url ?? null,
    categories: mod.categories?.map((c) => c.name) ?? [],
  };
}

function modMatchesKind(mod: CurseForgeMod, kind: CatalogKind): boolean {
  const classId = KIND_TO_CLASS[kind];
  if (mod.classId !== classId) return false;
  if (kind !== "shaders") return true;
  const cats = mod.categories?.map((c) => c.name.toLowerCase()) ?? [];
  if (cats.some((c) => c.includes("shader"))) return true;
  const blob = `${mod.name} ${mod.summary} ${mod.slug}`.toLowerCase();
  return blob.includes("shader") || blob.includes("iris") || blob.includes("optifine");
}

function modMatchesQuery(mod: CurseForgeMod, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    mod.name.toLowerCase().includes(q) ||
    mod.summary.toLowerCase().includes(q) ||
    mod.slug.toLowerCase().includes(q)
  );
}

let featuredCache: CurseForgeMod[] | null = null;
let featuredCachePromise: Promise<CurseForgeMod[]> | null = null;

async function loadFeaturedPool(): Promise<CurseForgeMod[]> {
  if (featuredCache) return featuredCache;
  if (!featuredCachePromise) {
    featuredCachePromise = (async () => {
      const result = await curseforgeFetch<CurseForgeFeaturedResponse>(
        "/mods/featured",
        { method: "POST", body: { gameId: MINECRAFT_GAME_ID } },
      );
      const merged = [
        ...result.data.featured,
        ...result.data.popular,
        ...result.data.recentlyUpdated,
      ];
      const seen = new Set<number>();
      featuredCache = merged.filter((mod) => {
        if (seen.has(mod.id)) return false;
        seen.add(mod.id);
        return true;
      });
      return featuredCache;
    })();
  }
  return featuredCachePromise;
}

async function searchCurseForgeFeatured(
  query: string,
  kind: CatalogKind,
  index: number,
  pageSize: number,
): Promise<{ items: CatalogItem[]; total: number }> {
  const pool = await loadFeaturedPool();
  const filtered = pool.filter(
    (mod) => modMatchesKind(mod, kind) && modMatchesQuery(mod, query),
  );
  const page = filtered.slice(index, index + pageSize);
  return {
    total: filtered.length,
    items: page.map((mod) => mapCurseForgeMod(mod, kind)),
  };
}

export async function searchCurseForge(
  query: string,
  kind: CatalogKind,
  index = 0,
  pageSize = 24,
): Promise<{ items: CatalogItem[]; total: number }> {
  const classId = KIND_TO_CLASS[kind];
  const params = new URLSearchParams({
    gameId: String(MINECRAFT_GAME_ID),
    classId: String(classId),
    searchFilter: query,
    index: String(index),
    pageSize: String(pageSize),
    sortField: "2",
    sortOrder: "desc",
  });

  try {
    const result = await curseforgeFetch<CurseForgeSearchResponse>(
      `/mods/search?${params}`,
    );

    const matching = kind === "shaders"
      ? result.data.filter((mod) => modMatchesKind(mod, kind))
      : result.data;
    return {
      total: result.pagination.totalCount,
      items: matching.map((mod) => mapCurseForgeMod(mod, kind)),
    };
  } catch (e) {
    const isSearchForbidden =
      e instanceof Error && e.message.includes("403");
    if (!isSearchForbidden) throw e;
    return searchCurseForgeFeatured(query, kind, index, pageSize);
  }
}

export async function getCurseForgeFiles(
  modId: string,
): Promise<CurseForgeFileEntry[]> {
  const result = await curseforgeFetch<{ data: CurseForgeFileEntry[] }>(
    `/mods/${modId}/files?pageSize=50&sortField=2&sortOrder=desc`,
  );
  return result.data;
}

export async function getCurseForgeFile(
  modId: string,
  fileId: string,
): Promise<CurseForgeFile | null> {
  const files = await getCurseForgeFiles(modId);
  return files.find((f) => String(f.id) === fileId) ?? null;
}

export function curseForgeLoaderNames(types?: number[]): string[] {
  if (!types?.length) return ["forge"];
  return [
    ...new Set(
      types.map((type) => {
        if (type === 4) return "fabric";
        if (type === 6) return "quilt";
        if (type === 7) return "neoforge";
        return "forge";
      }),
    ),
  ];
}

export async function getLatestCurseForgeFile(
  modId: string,
): Promise<CurseForgeFile | null> {
  const files = await getCurseForgeFiles(modId);
  return files[0] ?? null;
}

export function mapCurseForgeLoader(types?: number[]): ModLoader {
  if (!types?.length) return "forge";
  const t = types[0];
  if (t === 4) return "fabric";
  if (t === 6) return "quilt";
  if (t === 7) return "neoforge";
  return "forge";
}

function curseForgeLoaderMatches(
  types: number[] | undefined,
  loader: ModLoader,
): boolean {
  const names = curseForgeLoaderNames(types);
  if (loader === "vanilla") return true;
  if (names.includes(loader)) return true;
  if (loader === "quilt" && names.includes("fabric")) return true;
  return false;
}

export async function getCurseForgeFileDownload(
  modId: string,
  fileId: string,
): Promise<{
  url: string;
  filename: string;
  versionId: string;
  versionNumber: string;
} | null> {
  const result = await curseforgeFetch<{ data: CurseForgeFileEntry }>(
    `/mods/${modId}/files/${fileId}`,
  );
  const file = result.data;
  if (!file) return null;

  let url = file.downloadUrl;
  if (!url) {
    try {
      const urlResult = await curseforgeFetch<{ data: string }>(
        `/mods/${modId}/files/${fileId}/download-url`,
      );
      url = urlResult.data;
    } catch {
      return null;
    }
  }
  if (!url) return null;

  return {
    url,
    filename: file.fileName,
    versionId: String(file.id),
    versionNumber: file.displayName || file.fileName,
  };
}

function fileMatchesMcVersion(
  gameVersions: string[],
  mcVersion: string,
): boolean {
  if (gameVersions.includes(mcVersion)) return true;
  return gameVersions.some(
    (v) => v.startsWith(mcVersion) || mcVersion.startsWith(v),
  );
}

export async function findCurseForgeDownload(
  modId: string,
  mcVersion: string,
  loader: ModLoader,
  preferredFileId?: string,
): Promise<{
  url: string;
  filename: string;
  versionId: string;
  versionNumber: string;
} | null> {
  if (preferredFileId) {
    return getCurseForgeFileDownload(modId, preferredFileId);
  }

  const files = await getCurseForgeFiles(modId);
  for (const file of files) {
    if (!fileMatchesMcVersion(file.gameVersions, mcVersion)) continue;
    if (!curseForgeLoaderMatches(file.modLoaderTypes, loader)) continue;
    if (!file.downloadUrl) {
      const dl = await getCurseForgeFileDownload(modId, String(file.id));
      if (dl) return dl;
      continue;
    }
    return {
      url: file.downloadUrl,
      filename: file.fileName,
      versionId: String(file.id),
      versionNumber: file.displayName || file.fileName,
    };
  }
  return null;
}
