import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import { JWT_SECRET, ONLINE_WINDOW_MS } from "../config/env.js";
import { ApiError } from "./errors.js";

export const makeFriendCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
export const makePackCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

export function uniqueFriendCode(db) {
  for (let i = 0; i < 40; i++) {
    const code = makeFriendCode();
    const taken = Object.values(db.users).some((u) => u.friendCode === code);
    if (!taken) return code;
  }
  throw new ApiError(500, "SERVER_ERROR");
}

export function uniquePackCode(db) {
  for (let index = 0; index < 40; index += 1) {
    const code = makePackCode();
    if (!db.sharedPacks.some((pack) => pack.code === code)) return code;
  }
  throw new ApiError(500, "SERVER_ERROR");
}

export function publicUser(user) {
  const online = Date.now() - user.lastSeenAt < ONLINE_WINDOW_MS;
  const role = user.role || (user.username.toLowerCase() === "admin" ? "admin" : "user");
  return {
    id: user.id,
    username: user.username,
    friendCode: user.friendCode,
    role,
    online,
    status: online ? user.status || "online" : "offline",
    lastSeenAt: user.lastSeenAt,
  };
}

export function issueToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role || "user" },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function isUserBanned(user) {
  if (!user.bannedUntil) return false;
  if (user.bannedUntil === -1) return true; // permanent
  return Date.now() < user.bannedUntil;
}

export function isUserMuted(user) {
  if (!user.mutedUntil) return false;
  if (user.mutedUntil === -1) return true; // permanent
  return Date.now() < user.mutedUntil;
}
