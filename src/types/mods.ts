export type ModLoader =
  | "vanilla"
  | "fabric"
  | "forge"
  | "quilt"
  | "neoforge";

export interface LaunchHistoryEntry {
  id: string;
  version: string;
  loader: ModLoader;
  label?: string;
  packId?: string;
}

export type CatalogSource = "modrinth" | "curseforge";

export type CatalogSort =
  | "downloads"
  | "relevance"
  | "follows"
  | "updated"
  | "new";

export interface CatalogItem {
  id: string;
  source: CatalogSource;
  kind: "modpack" | "mod" | "resourcepack" | "shader";
  title: string;
  description: string;
  author: string;
  downloads: number;
  follows: number;
  iconUrl: string | null;
  bannerUrl: string | null;
  categories: string[];
}

export interface PackFileEntry {
  id: string;
  filename: string;
  filePath: string;
  addedAt: number;
  isFolder?: boolean;
}

export interface ModPack {
  id: string;
  name: string;
  minecraftVersion: string;
  loader: ModLoader;
  modrinthProjectId?: string;
  curseforgeProjectId?: string;
  modrinthIconUrl?: string;
  curseforgeIconUrl?: string;
  source?: CatalogSource;
  modCount?: number;
  mods?: PackMod[];
  resourcepacks?: PackFileEntry[];
  shaderpacks?: PackFileEntry[];
  createdAt: number;
}

export interface PackMod {
  id: string;
  projectId: string;
  name: string;
  author: string;
  iconUrl: string | null;
  filename: string;
  versionId: string;
  versionNumber: string;
  filePath: string;
  addedAt: number;
  catalogSource?: CatalogSource;
}

export interface InstallFromCatalogOptions {
  targetPackId?: "new" | string;
  packName?: string;
}

export interface AddModToPackOptions {
  versionId?: string;
}

export interface MinecraftVersionEntry {
  id: string;
  type: "release" | "snapshot" | "old_beta" | "old_alpha";
  url: string;
  time: string;
  releaseTime: string;
}

export interface ModrinthSearchHit {
  project_id: string;
  project_type: string;
  slug: string;
  author: string;
  title: string;
  description: string;
  categories: string[];
  display_categories: string[];
  downloads: number;
  follows?: number;
  icon_url: string | null;
  date_created: string;
  latest_version: string;
  license: string;
  client_side: string;
  server_side: string;
  gallery: string[];
  featured_gallery: string | null;
  color: number | null;
}

export interface ModrinthSearchResult {
  hits: ModrinthSearchHit[];
  offset: number;
  limit: number;
  total_hits: number;
}

export interface ModrinthVersion {
  id: string;
  project_id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  date_published: string;
  files?: ModrinthVersionFile[];
}

export interface ModrinthProject {
  id: string;
  title: string;
  description: string;
  body?: string;
  downloads: number;
  followers: number;
  icon_url: string | null;
  gallery: string[];
  author: string;
  project_type: string;
  categories: string[];
}

export interface ModrinthVersionFile {
  url: string;
  filename: string;
  primary: boolean;
  size: number;
}

export const MOD_LOADERS: { id: ModLoader; label: string }[] = [
  { id: "vanilla", label: "Vanilla" },
  { id: "fabric", label: "Fabric" },
  { id: "forge", label: "Forge" },
  { id: "quilt", label: "Quilt" },
  { id: "neoforge", label: "NeoForge" },
];

export const VERSION_TYPE_LABELS: Record<
  MinecraftVersionEntry["type"],
  string
> = {
  release: "Release",
  snapshot: "Snapshot",
  old_beta: "Beta",
  old_alpha: "Alpha",
};
