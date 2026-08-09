import { loadDb, saveDb, withDb } from "../db/database.js";
import { ApiError } from "../utils/errors.js";
import { publicUser } from "../utils/helpers.js";

export function getCurrentUser(userId) {
  return withDb(() => {
    const db = loadDb();
    const user = db.users[userId];
    if (!user) throw new ApiError(404, "NOT_FOUND");
    user.lastSeenAt = Date.now();
    user.status = "online";
    saveDb(db);
    return publicUser(user);
  });
}

export function getUserById(userId) {
  return withDb(() => {
    const db = loadDb();
    const user = db.users[userId];
    if (!user) throw new ApiError(404, "NOT_FOUND");
    return publicUser(user);
  });
}

export function searchUsers(query) {
  return withDb(() => {
    const db = loadDb();
    const q = String(query ?? "").trim().toLowerCase();
    if (!q) return [];
    return Object.values(db.users)
      .filter((u) => u.username.toLowerCase().includes(q))
      .slice(0, 20)
      .map(publicUser);
  });
}

export function updatePresence(userId, status) {
  return withDb(() => {
    const db = loadDb();
    const user = db.users[userId];
    if (!user) throw new ApiError(404, "NOT_FOUND");
    user.lastSeenAt = Date.now();
    user.status = String(status ?? "online").slice(0, 64);
    saveDb(db);
    return { ok: true };
  });
}

export function getFriends(userId) {
  return withDb(() => {
    const db = loadDb();
    const ids = db.friendships[userId] ?? [];
    const friends = ids
      .map((id) => db.users[id])
      .filter(Boolean)
      .sort((a, b) => a.username.localeCompare(b.username));
    return friends.map(publicUser);
  });
}

export function addFriend(userId, codeInput) {
  return withDb(() => {
    const db = loadDb();
    const code = String(codeInput ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (code.length !== 6) throw new ApiError(400, "INVALID_CODE");

    const friend = Object.values(db.users).find((u) => u.friendCode === code);
    if (!friend) throw new ApiError(404, "NOT_FOUND");
    if (friend.id === userId) throw new ApiError(400, "SELF_ADD");

    const myFriends = db.friendships[userId] ?? [];
    if (myFriends.includes(friend.id)) throw new ApiError(409, "ALREADY_FRIENDS");

    db.friendships[userId] = [...myFriends, friend.id];
    db.friendships[friend.id] = [
      ...(db.friendships[friend.id] ?? []),
      userId,
    ];
    saveDb(db);
    return publicUser(friend);
  });
}

export function removeFriend(userId, friendId) {
  return withDb(() => {
    const db = loadDb();
    db.friendships[userId] = (db.friendships[userId] ?? []).filter(
      (id) => id !== friendId
    );
    db.friendships[friendId] = (db.friendships[friendId] ?? []).filter(
      (id) => id !== userId
    );
    saveDb(db);
    return { ok: true };
  });
}
