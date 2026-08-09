import { randomUUID } from "node:crypto";
import { loadDb, saveDb, withDb } from "../db/database.js";
import { ApiError } from "../utils/errors.js";
import { isUserBanned, uniquePackCode } from "../utils/helpers.js";
import { containsProfanity } from "../utils/profanity.js";

function normalizeSharedPack(input) {
  const name = String(input?.name ?? "").trim();
  const description = String(input?.description ?? "").trim().slice(0, 400);
  const minecraftVersion = String(input?.minecraftVersion ?? "").trim();
  const loader = String(input?.loader ?? "").trim().toLowerCase();
  const sourceMods = Array.isArray(input?.mods) ? input.mods : [];

  if (!name || name.length > 64) throw new ApiError(400, "INVALID_PACK");
  if (!/^\d+\.\d+(?:\.\d+)?(?:-[\w.-]+)?$/.test(minecraftVersion)) {
    throw new ApiError(400, "INVALID_PACK");
  }
  if (!["vanilla", "fabric", "forge", "quilt", "neoforge"].includes(loader)) {
    throw new ApiError(400, "INVALID_PACK");
  }
  if (sourceMods.length > 250) throw new ApiError(400, "INVALID_PACK");

  const mods = sourceMods.map((mod) => {
    const projectId = String(mod?.projectId ?? "").trim();
    const versionId = String(mod?.versionId ?? "").trim();
    const source = mod?.catalogSource === "curseforge" ? "curseforge" : "modrinth";
    if (!projectId || projectId.length > 120 || !versionId || versionId.length > 160) {
      throw new ApiError(400, "INVALID_PACK");
    }
    return {
      projectId,
      versionId,
      name: String(mod?.name ?? projectId).trim().slice(0, 100) || projectId,
      author: String(mod?.author ?? "Unknown").trim().slice(0, 100) || "Unknown",
      iconUrl: typeof mod?.iconUrl === "string" ? mod.iconUrl.slice(0, 500) : null,
      catalogSource: source,
    };
  });

  return { name, description, minecraftVersion, loader, mods };
}

export function sharedPackSummary(pack, includeMods = false) {
  const summary = {
    id: pack.id,
    code: pack.code,
    name: pack.name,
    description: pack.description || "",
    minecraftVersion: pack.minecraftVersion,
    loader: pack.loader,
    modCount: pack.mods?.length ?? 0,
    authorId: pack.authorId,
    authorUsername: pack.authorUsername,
    status: pack.status,
    createdAt: pack.createdAt,
    reviewedAt: pack.reviewedAt ?? null,
    reviewReason: pack.reviewReason ?? null,
  };
  return includeMods ? { ...summary, mods: pack.mods ?? [] } : summary;
}

export function createPack(userId, packBody) {
  return withDb(() => {
    const db = loadDb();
    const user = db.users[userId];
    if (!user) throw new ApiError(401, "UNAUTHORIZED");
    if (isUserBanned(user)) throw new ApiError(403, "USER_BANNED");

    const pack = normalizeSharedPack(packBody);
    const fullText = `${pack.name} ${pack.description || ""}`;
    const isSuspicious = containsProfanity(fullText) || /hack|cheat|rat|token|stealer|exploit|bypass/i.test(fullText);

    let initialStatus = "approved";
    let initialReason = "AI перевірка пройдена: Безпечна збірка";

    if (isSuspicious) {
      initialStatus = "blocked";
      initialReason = "AI Модерація: Виявлено підозрілі ключові слова або заборонений вміст у назві/описі.";
    }

    const record = {
      id: randomUUID(),
      code: uniquePackCode(db),
      ...pack,
      authorId: user.id,
      authorUsername: user.username,
      status: initialStatus,
      createdAt: Date.now(),
      reviewedAt: Date.now(),
      reviewReason: isSuspicious ? initialReason : null,
    };
    db.sharedPacks.push(record);
    saveDb(db);
    return sharedPackSummary(record, true);
  });
}

export function getPacks(userId) {
  return withDb(() => {
    const db = loadDb();
    return db.sharedPacks
      .filter((pack) => pack.status === "approved" || pack.authorId === userId)
      .sort((left, right) => right.createdAt - left.createdAt)
      .map((pack) => sharedPackSummary(pack));
  });
}

export function importPackByCode(codeInput) {
  return withDb(() => {
    const db = loadDb();
    const code = String(codeInput ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    const pack = db.sharedPacks.find((item) => item.code === code);
    if (!pack) throw new ApiError(404, "PACK_NOT_FOUND");
    if (pack.status !== "approved") {
      throw new ApiError(403, pack.status === "blocked" ? "PACK_BLOCKED" : "PACK_PENDING");
    }
    return sharedPackSummary(pack, true);
  });
}
