import type { MinecraftVersionEntry } from "../types/mods";

const MANIFEST_URL =
  "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

let cachedVersions: MinecraftVersionEntry[] | null = null;

export async function fetchMinecraftVersions(): Promise<MinecraftVersionEntry[]> {
  if (cachedVersions) return cachedVersions;

  try {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error("Failed to fetch Minecraft versions");

    const data = await res.json();
    const remoteVersions = (data.versions as MinecraftVersionEntry[]) || [];
    cachedVersions = remoteVersions;
    return cachedVersions;
  } catch (err) {
    console.warn("Using offline official version manifest fallback", err);
    cachedVersions = [
      { id: "1.21.4", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.21.3", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.21.1", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.20.6", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.20.4", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.20.2", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.20.1", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.19.4", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.19.2", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.18.2", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.17.1", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.16.5", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.15.2", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.14.4", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.13.2", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.12.2", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.11.2", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.10.2", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.9.4", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.8.9", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.7.10", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.6.4", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.5.2", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.4.7", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.3.2", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.2.5", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.1", type: "release", url: "", time: "", releaseTime: "" },
      { id: "1.0", type: "release", url: "", time: "", releaseTime: "" },
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
    if (groups[v.type]) {
      groups[v.type].push(v);
    } else {
      if (!groups.snapshot) groups.snapshot = [];
      groups.snapshot.push(v);
    }
  }

  return groups;
}

export async function getLatestRelease(): Promise<string> {
  const versions = await fetchMinecraftVersions();
  const latest = versions.find((v) => v.type === "release");
  return latest?.id ?? "1.21.4";
}
