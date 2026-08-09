import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..", "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (val) process.env[key] = val;
    }
  } catch {
    /* ignore unreadable env files */
  }
}

loadEnvFile(join(ROOT_DIR, "..", ".env"));
loadEnvFile(join(ROOT_DIR, ".env"));

export const DATA_DIR = process.env.NUVOXEL_DATA_DIR?.trim() || ROOT_DIR;
export const DB_PATH = join(DATA_DIR, "nuvolexlauncher-social.json");
export const LEGACY_DB_PATHS = [
  join(ROOT_DIR, "nuvoxel-social.json"),
  join(ROOT_DIR, "nlauncher-social.json"),
];
export const UPDATES_PATH = join(ROOT_DIR, "updates.json");
export const UPDATES_FILES_DIR = join(ROOT_DIR, "updates", "files");
export const CLIENT_MODS_DIR = join(ROOT_DIR, "client-mods");
export const PUBLIC_DIR = join(ROOT_DIR, "public");

export const JWT_SECRET = process.env.JWT_SECRET || "nuvoxel-dev-secret-change-in-production";
export const PORT = Number(process.env.PORT || 3847);
export const ONLINE_WINDOW_MS = 90_000;
export const LAUNCHER_AUTH_TTL_MS = 5 * 60_000;

export const CURSEFORGE_API_BASE = "https://api.curseforge.com/v1";
export const CURSEFORGE_API_KEY =
  process.env.CURSEFORGE_API_KEY?.trim() ||
  process.env.VITE_CURSEFORGE_API_KEY?.trim() ||
  "";
