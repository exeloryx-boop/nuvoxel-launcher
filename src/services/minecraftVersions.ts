import type { MinecraftVersionEntry } from "../types/mods";

const MANIFEST_URL =
  "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

let cachedVersions: MinecraftVersionEntry[] | null = null;

export async function fetchMinecraftVersions(): Promise<MinecraftVersionEntry[]> {
  if (cachedVersions) return cachedVersions;

  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error("Failed to fetch Minecraft versions");

  const data = await res.json();
  cachedVersions = data.versions as MinecraftVersionEntry[];
  return cachedVersions;
}

export function groupVersionsByType(versions: MinecraftVersionEntry[]) {
  const groups: Record<string, MinecraftVersionEntry[]> = {
    release: [],
    snapshot: [],
    old_beta: [],
    old_alpha: [],
  };

  for (const v of versions) {
    groups[v.type]?.push(v);
  }

  return groups;
}

export async function getLatestRelease(): Promise<string> {
  const versions = await fetchMinecraftVersions();
  const latest = versions.find((v) => v.type === "release");
  return latest?.id ?? "1.21.4";
}
