import bcrypt from "bcryptjs";
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { dirname } from "node:path";
import { DB_PATH, LEGACY_DB_PATHS } from "../config/env.js";

function emptyDb() {
  return {
    users: {},
    friendships: {},
    chatMessages: [],
    violations: [],
    sharedPacks: [],
  };
}

function ensureDefaultAdmin(users) {
  let admin = Object.values(users).find((u) => u.username.toLowerCase() === "admin");
  if (!admin) {
    const adminId = "admin-root-0001";
    admin = {
      id: adminId,
      username: "admin",
      email: "admin@nuvoxel.net",
      role: "admin",
      passwordHash: bcrypt.hashSync("admin", 10),
      friendCode: "#ADMIN01",
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      status: "online",
    };
    users[adminId] = admin;
  } else {
    admin.role = "admin";
  }
}

export function normalizeDb(data) {
  const base = emptyDb();
  if (!data || typeof data !== "object") return base;
  const users = data.users && typeof data.users === "object" ? data.users : {};
  ensureDefaultAdmin(users);
  return {
    ...base,
    ...data,
    users,
    friendships:
      data.friendships && typeof data.friendships === "object"
        ? data.friendships
        : {},
    chatMessages: Array.isArray(data.chatMessages) ? data.chatMessages : [],
    violations: Array.isArray(data.violations) ? data.violations : [],
    sharedPacks: Array.isArray(data.sharedPacks) ? data.sharedPacks : [],
  };
}

export function loadDb() {
  if (!existsSync(DB_PATH)) {
    for (const legacyPath of LEGACY_DB_PATHS) {
      if (existsSync(legacyPath)) {
        try {
          const data = readFileSync(legacyPath, "utf8");
          mkdirSync(dirname(DB_PATH), { recursive: true });
          writeFileSync(DB_PATH, data, "utf8");
          break;
        } catch {
          /* try next legacy path */
        }
      }
    }
  }
  if (!existsSync(DB_PATH)) {
    return emptyDb();
  }
  try {
    return normalizeDb(JSON.parse(readFileSync(DB_PATH, "utf8")));
  } catch {
    return emptyDb();
  }
}

export function saveDb(db) {
  try {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    const tempPath = `${DB_PATH}.${process.pid}.${Date.now()}.tmp`;
    writeFileSync(tempPath, JSON.stringify(normalizeDb(db), null, 2), "utf8");
    renameSync(tempPath, DB_PATH);
  } catch (e) {
    console.error("Critical: Failed to save DB:", e);
  }
}

// Initialize on load
saveDb(loadDb());

let dbChain = Promise.resolve();

export function withDb(fn) {
  const job = dbChain.then(fn);
  dbChain = job.catch(() => {});
  return job;
}
