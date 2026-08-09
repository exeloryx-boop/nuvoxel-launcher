import { loadDb, saveDb, withDb } from "../db/database.js";
import { ApiError } from "../utils/errors.js";
import { ONLINE_WINDOW_MS } from "../config/env.js";
import { sharedPackSummary } from "./packService.js";

export function getStats() {
  return withDb(() => {
    const db = loadDb();
    const usersArr = Object.values(db.users);
    const now = Date.now();
    const onlineUsers = usersArr.filter((u) => now - u.lastSeenAt < ONLINE_WINDOW_MS).length;
    let totalFriendships = 0;
    for (const list of Object.values(db.friendships)) {
      totalFriendships += (list || []).length;
    }
    return {
      totalUsers: usersArr.length,
      onlineUsers,
      totalFriendships: Math.floor(totalFriendships / 2),
      uptimeSeconds: Math.floor(process.uptime()),
      dbSize: JSON.stringify(db).length,
    };
  });
}

export function getAllUsers() {
  return withDb(() => {
    const db = loadDb();
    const now = Date.now();
    return Object.values(db.users).map((u) => {
      const isOnline = now - u.lastSeenAt < ONLINE_WINDOW_MS;
      return {
        id: u.id,
        username: u.username,
        email: u.email || "—",
        friendCode: u.friendCode,
        role: u.role || (u.username.toLowerCase() === "admin" ? "admin" : "user"),
        createdAt: u.createdAt || u.lastSeenAt,
        lastSeenAt: u.lastSeenAt,
        online: isOnline,
        status: isOnline ? u.status || "online" : "offline",
        friendsCount: (db.friendships[u.id] || []).length,
        bannedUntil: u.bannedUntil || null,
        mutedUntil: u.mutedUntil || null,
        banReason: u.banReason || null,
        muteReason: u.muteReason || null,
      };
    });
  });
}

export function setUserRole(userId, role) {
  return withDb(() => {
    const db = loadDb();
    const user = db.users[userId];
    if (!user) throw new ApiError(404, "USER_NOT_FOUND");
    user.role = role === "admin" ? "admin" : "user";
    saveDb(db);
    return { ok: true, userId, role: user.role };
  });
}

export function deleteUser(userId) {
  return withDb(() => {
    const db = loadDb();
    if (!db.users[userId]) throw new ApiError(404, "USER_NOT_FOUND");
    delete db.users[userId];
    delete db.friendships[userId];
    for (const id in db.friendships) {
      db.friendships[id] = (db.friendships[id] || []).filter((fId) => fId !== userId);
    }
    saveDb(db);
    return { ok: true, deletedUserId: userId };
  });
}

export function banUser(userId, duration, reason) {
  return withDb(() => {
    const db = loadDb();
    const user = db.users[userId];
    if (!user) throw new ApiError(404, "USER_NOT_FOUND");
    if (duration === 0) {
      delete user.bannedUntil;
      user.banReason = null;
    } else if (duration === -1) {
      user.bannedUntil = -1;
      user.banReason = reason || "Порушення правил";
    } else {
      user.bannedUntil = Date.now() + (duration || 60) * 60 * 1000;
      user.banReason = reason || "Порушення правил";
    }
    saveDb(db);
    return { ok: true, userId, bannedUntil: user.bannedUntil || null };
  });
}

export function muteUser(userId, duration, reason) {
  return withDb(() => {
    const db = loadDb();
    const user = db.users[userId];
    if (!user) throw new ApiError(404, "USER_NOT_FOUND");
    if (duration === 0) {
      delete user.mutedUntil;
      user.muteReason = null;
    } else if (duration === -1) {
      user.mutedUntil = -1;
      user.muteReason = reason || "Порушення правил чату";
    } else {
      user.mutedUntil = Date.now() + (duration || 30) * 60 * 1000;
      user.muteReason = reason || "Порушення правил чату";
    }
    saveDb(db);
    return { ok: true, userId, mutedUntil: user.mutedUntil || null };
  });
}

export function getAdminChat() {
  return withDb(() => {
    const db = loadDb();
    return (db.chatMessages || []).slice(-200).map((m) => ({
      ...m,
      username: m.username || db.users[m.userId]?.username || "deleted",
    }));
  });
}

export function deleteMessage(messageId) {
  return withDb(() => {
    const db = loadDb();
    const before = db.chatMessages.length;
    db.chatMessages = db.chatMessages.filter((message) => message.id !== messageId);
    if (db.chatMessages.length === before) throw new ApiError(404, "NOT_FOUND");
    saveDb(db);
    return { ok: true, messageId };
  });
}

export function getViolations() {
  return withDb(() => {
    const db = loadDb();
    return (db.violations || []).slice(-100);
  });
}

export function resolveViolation(violationId) {
  return withDb(() => {
    const db = loadDb();
    const v = (db.violations || []).find((v) => v.id === violationId);
    if (!v) throw new ApiError(404, "NOT_FOUND");
    v.resolved = true;
    saveDb(db);
    return { ok: true };
  });
}

export function clearResolvedViolations() {
  return withDb(() => {
    const db = loadDb();
    const beforeCount = db.violations.length;
    db.violations = db.violations.filter((v) => !v.resolved);
    const cleared = beforeCount - db.violations.length;
    saveDb(db);
    return { cleared, remaining: db.violations.length };
  });
}

export function getBroadcast() {
  return withDb(() => {
    const db = loadDb();
    return db.broadcast || { text: "", type: "info", active: false, updatedAt: 0 };
  });
}

export function setBroadcast(authSub, { text, type, active }) {
  return withDb(() => {
    const db = loadDb();
    const cleanText = String(text ?? "").trim();
    const cleanType = ["info", "warning", "alert"].includes(type) ? type : "info";
    const isActive = Boolean(active);

    db.broadcast = {
      text: cleanText,
      type: cleanType,
      active: isActive,
      updatedAt: Date.now(),
      updatedBy: authSub,
    };
    saveDb(db);
    return db.broadcast;
  });
}

export function getAllPacks() {
  return withDb(() => {
    const db = loadDb();
    return db.sharedPacks
      .slice()
      .sort((left, right) => right.createdAt - left.createdAt)
      .map((pack) => sharedPackSummary(pack, true));
  });
}

export function reviewPack(packId, status, reason, reviewerId) {
  return withDb(() => {
    const db = loadDb();
    const pack = db.sharedPacks.find((item) => item.id === packId);
    const cleanReason = String(reason ?? "").trim().slice(0, 400);
    if (!pack) throw new ApiError(404, "PACK_NOT_FOUND");
    if (status !== "approved" && status !== "blocked") {
      throw new ApiError(400, "INVALID_PACK_REVIEW");
    }
    if (status === "blocked" && !cleanReason) throw new ApiError(400, "REVIEW_REASON_REQUIRED");
    pack.status = status;
    pack.reviewReason = cleanReason || null;
    pack.reviewedAt = Date.now();
    pack.reviewedBy = reviewerId;
    saveDb(db);
    return sharedPackSummary(pack, true);
  });
}
