import { randomUUID } from "node:crypto";
import { loadDb, saveDb, withDb } from "../db/database.js";
import { ApiError } from "../utils/errors.js";
import { isUserBanned, isUserMuted } from "../utils/helpers.js";
import { containsProfanity, findProfanityWords } from "../utils/profanity.js";

const MAX_CHAT_HISTORY = 200;

export function sendChatMessage(userId, { text: rawText, channel: rawChannel, recipientId }) {
  return withDb(() => {
    const db = loadDb();
    if (!db.chatMessages) db.chatMessages = [];
    if (!db.violations) db.violations = [];
    const user = db.users[userId];
    if (!user) throw new ApiError(404, "NOT_FOUND");

    if (isUserBanned(user)) throw new ApiError(403, "USER_BANNED");
    if (isUserMuted(user)) throw new ApiError(403, "USER_MUTED");

    const text = String(rawText ?? "").trim().slice(0, 500);
    const channel = String(rawChannel ?? "global").trim();

    if (!text) throw new ApiError(400, "EMPTY_MESSAGE");

    const hasProfanity = containsProfanity(text);
    const foundWords = hasProfanity ? findProfanityWords(text) : [];
    if (hasProfanity) {
      db.violations.push({
        id: randomUUID(),
        userId: user.id,
        username: user.username,
        text,
        words: foundWords,
        channel,
        timestamp: Date.now(),
        resolved: false,
      });
      if (db.violations.length > 500) {
        db.violations = db.violations.slice(-300);
      }
    }

    const msg = {
      id: randomUUID(),
      userId: user.id,
      username: user.username,
      text,
      channel,
      recipientId: recipientId || null,
      timestamp: Date.now(),
      flagged: hasProfanity,
    };
    db.chatMessages.push(msg);
    if (db.chatMessages.length > MAX_CHAT_HISTORY * 10) {
      db.chatMessages = db.chatMessages.slice(-MAX_CHAT_HISTORY * 10);
    }
    saveDb(db);
    return msg;
  });
}

export function getGlobalChat() {
  return withDb(() => {
    const db = loadDb();
    return (db.chatMessages || [])
      .filter((m) => m.channel === "global")
      .slice(-MAX_CHAT_HISTORY);
  });
}

export function getDMChat(myId, otherId) {
  return withDb(() => {
    const db = loadDb();
    return (db.chatMessages || [])
      .filter(
        (m) =>
          m.channel === "dm" &&
          ((m.userId === myId && m.recipientId === otherId) ||
            (m.userId === otherId && m.recipientId === myId))
      )
      .slice(-MAX_CHAT_HISTORY);
  });
}
