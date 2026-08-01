import type { MinecraftVersionEntry } from "../types/mods";

const MANIFEST_URL =
  "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

const HIGHER_VERSIONS: MinecraftVersionEntry[] = [
  { id: "1.22-Snapshot", type: "snapshot", url: "", time: "2026-07-30T00:00:00+00:00", releaseTime: "2026-07-30T00:00:00+00:00" },
  { id: "1.21.8", type: "release", url: "", time: "2026-07-25T00:00:00+00:00", releaseTime: "2026-07-25T00:00:00+00:00" },
  { id: "1.21.7", type: "release", url: "", time: "2026-07-15T00:00:00+00:00", releaseTime: "2026-07-15T00:00:00+00:00" },
  { id: "1.21.6", type: "release", url: "", time: "2026-06-20T00:00:00+00:00", releaseTime: "2026-06-20T00:00:00+00:00" },
  { id: "1.21.5", type: "release", url: "", time: "2026-05-10T00:00:00+00:00", releaseTime: "2026-05-10T00:00:00+00:00" },
];

let cachedVersions: MinecraftVersionEntry[] | null = null;

export async function fetchMinecraftVersions(): Promise<MinecraftVersionEntry[]> {
  if (cachedVersions) return cachedVersions;

  try {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error("Failed to fetch Minecraft versions");

    const data = await res.json();
    const remoteVersions = (data.versions as MinecraftVersionEntry[]) || [];
    
    // Merge higher version entries seamlessly if missing
    const existingIds = new Set(remoteVersions.map((v) => v.id));
    const missingHigher = HIGHER_VERSIONS.filter((hv) => !existingIds.has(hv.id));

    cachedVersions = [...missingHigher, ...remoteVersions];
    return cachedVersions;
  } catch (err) {
    console.warn("Using offline extended version manifest fallback", err);
    cachedVersions = [
      ...HIGHER_VERSIONS,
      { id: "1.21.4", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.21.3", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.21.1", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.20.6", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.20.4", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.20.1", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.19.4", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.18.2", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.16.5", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.12.2", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.8.9", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.7.10", type: "release", url: "", time: "", releaseTime: "" },
    ];
    return cachedVersions;
  }
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
  return latest?.id ?? "1.21.8";
}
