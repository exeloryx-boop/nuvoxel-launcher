import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

loadEnvFile(join(__dirname, "..", ".env"));
loadEnvFile(join(__dirname, ".env"));

const DB_PATH = join(__dirname, "nuvolexlauncher-social.json");
const LEGACY_DB_PATHS = [
  join(__dirname, "nuvoxel-social.json"),
  join(__dirname, "nlauncher-social.json"),
];
const UPDATES_PATH = join(__dirname, "updates.json");
const UPDATES_FILES_DIR = join(__dirname, "updates", "files");
const makeFriendCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const JWT_SECRET =
  process.env.JWT_SECRET || "nuvoxel-dev-secret-change-in-production";
const PORT = Number(process.env.PORT || 3847);
const ONLINE_WINDOW_MS = 90_000;
const CURSEFORGE_API_BASE = "https://api.curseforge.com/v1";
const CURSEFORGE_API_KEY =
  process.env.CURSEFORGE_API_KEY?.trim() ||
  process.env.VITE_CURSEFORGE_API_KEY?.trim() ||
  "";

// --- Profanity filter ---
const BAD_WORDS = [
  "сука", "блять", "бля", "хуй", "пизд", "єбан", "єбат", "їбат", "нахуй",
  "піздец", "мудак", "залупа", "шлюха", "блядь", "дебіл", "даун", "урод",
  "fuck", "shit", "bitch", "asshole", "dick", "pussy", "nigger", "faggot",
  "bastard", "whore", "cunt", "damn", "retard", "idiot",
];
function containsProfanity(text) {
  const lower = text.toLowerCase().replace(/[^a-zа-яіїєґ]/g, "");
  return BAD_WORDS.some((w) => lower.includes(w));
}
function findProfanityWords(text) {
  const lower = text.toLowerCase().replace(/[^a-zа-яіїєґ ]/g, "");
  return BAD_WORDS.filter((w) => lower.includes(w));
}

// --- Ban / Mute checking ---
function isUserBanned(user) {
  if (!user.bannedUntil) return false;
  if (user.bannedUntil === -1) return true; // permanent
  return Date.now() < user.bannedUntil;
}
function isUserMuted(user) {
  if (!user.mutedUntil) return false;
  if (user.mutedUntil === -1) return true; // permanent
  return Date.now() < user.mutedUntil;
}

class ApiError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function loadDb() {
  if (!existsSync(DB_PATH)) {
    for (const legacyPath of LEGACY_DB_PATHS) {
      if (existsSync(legacyPath)) {
        try {
          const data = readFileSync(legacyPath, "utf8");
          writeFileSync(DB_PATH, data, "utf8");
          break;
        } catch {
          /* try next legacy path */
        }
      }
    }
  }
  if (!existsSync(DB_PATH)) {
    return { users: {}, friendships: {} };
  }
  try {
    return JSON.parse(readFileSync(DB_PATH, "utf8"));
  } catch {
    return { users: {}, friendships: {} };
  }
}

function saveDb(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

let dbChain = Promise.resolve();

function withDb(fn) {
  const job = dbChain.then(fn);
  dbChain = job.catch(() => {});
  return job;
}

function uniqueFriendCode(db) {
  for (let i = 0; i < 40; i++) {
    const code = makeFriendCode();
    const taken = Object.values(db.users).some((u) => u.friendCode === code);
    if (!taken) return code;
  }
  throw new ApiError(500, "SERVER_ERROR");
}

function publicUser(user) {
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

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role || "user" },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

const app = express();
app.use(cors());
app.use(express.json());

if (!existsSync(UPDATES_FILES_DIR)) {
  mkdirSync(UPDATES_FILES_DIR, { recursive: true });
}
app.use("/updates/files", express.static(UPDATES_FILES_DIR));

app.get("/updates/latest", (_req, res) => {
  try {
    if (!existsSync(UPDATES_PATH)) {
      return res.status(404).json({ error: "NO_UPDATE_MANIFEST" });
    }
    const manifest = JSON.parse(readFileSync(UPDATES_PATH, "utf8"));
    res.json(manifest);
  } catch {
    res.status(500).json({ error: "UPDATE_MANIFEST_ERROR" });
  }
});

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
  try {
    req.auth = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
}

function adminAuth(req, res, next) {
  if (!req.auth || req.auth.role !== "admin") {
    return res.status(403).json({ error: "FORBIDDEN_NOT_ADMIN" });
  }
  next();
}

function sendError(res, error) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.code });
  }
  return res.status(500).json({ error: "SERVER_ERROR" });
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "nuvoxel-social",
    version: "1.0.0",
    curseforge: !!CURSEFORGE_API_KEY,
  });
});

app.get("/curseforge/status", (_req, res) => {
  res.json({ available: !!CURSEFORGE_API_KEY });
});

app.use("/curseforge", async (req, res) => {
  if (!CURSEFORGE_API_KEY) {
    return res.status(503).json({ error: "CURSEFORGE_NO_KEY" });
  }

  const upstreamUrl = `${CURSEFORGE_API_BASE}${req.url}`;
  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: {
        "x-api-key": CURSEFORGE_API_KEY,
        Accept: "application/json",
        ...(req.method !== "GET" && req.method !== "HEAD"
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body ?? {})
          : undefined,
    });
    const body = await upstream.text();
    res.status(upstream.status);
    res.set(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json",
    );
    res.send(body);
  } catch {
    res.status(502).json({ error: "CURSEFORGE_PROXY_ERROR" });
  }
});

app.post("/auth/register", (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const username = String(req.body.username ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase() || null;
    const password = String(req.body.password ?? "");

    if (username.length < 2 || username.length > 24) {
      throw new ApiError(400, "INVALID_USERNAME");
    }
    if (password.length < 4) {
      throw new ApiError(400, "INVALID_PASSWORD");
    }

    const usernameTaken = Object.values(db.users).some(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );
    if (usernameTaken) throw new ApiError(409, "USER_EXISTS");

    if (email) {
      const emailTaken = Object.values(db.users).some(
        (u) => u.email?.toLowerCase() === email,
      );
      if (emailTaken) throw new ApiError(409, "USER_EXISTS");
    }

    const id = randomUUID();
    const now = Date.now();
    const friendCode = uniqueFriendCode(db);
    const role = username.toLowerCase() === "admin" ? "admin" : "user";

    const userObj = {
      id,
      username,
      email,
      role,
      passwordHash: bcrypt.hashSync(password, 10),
      friendCode,
      createdAt: now,
      lastSeenAt: now,
      status: "online",
    };
    db.users[id] = userObj;
    db.friendships[id] = [];
    saveDb(db);

    return {
      token: issueToken(userObj),
      user: { id, username, friendCode, email, role },
    };
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.post("/auth/login", (req, res) => {
  const login = String(req.body.login ?? req.body.email ?? "").trim();
  const password = String(req.body.password ?? "");
  if (!login || !password) {
    return res.status(400).json({ error: "INVALID_CREDENTIALS" });
  }

  void withDb(() => {
    const db = loadDb();
    const user = Object.values(db.users).find(
      (u) =>
        u.username.toLowerCase() === login.toLowerCase() ||
        (u.email && u.email.toLowerCase() === login.toLowerCase()),
    );

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new ApiError(401, "INVALID_CREDENTIALS");
    }

    if (!user.role) {
      user.role = user.username.toLowerCase() === "admin" ? "admin" : "user";
    }
    user.lastSeenAt = Date.now();
    user.status = "online";
    saveDb(db);

    return {
      token: issueToken(user),
      user: {
        id: user.id,
        username: user.username,
        friendCode: user.friendCode,
        email: user.email,
        role: user.role,
      },
    };
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.get("/auth/me", auth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const user = db.users[req.auth.sub];
    if (!user) throw new ApiError(404, "NOT_FOUND");
    return publicUser(user);
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.post("/presence", auth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const user = db.users[req.auth.sub];
    if (!user) throw new ApiError(404, "NOT_FOUND");
    user.lastSeenAt = Date.now();
    user.status = String(req.body.status ?? "online").slice(0, 64);
    saveDb(db);
    return { ok: true };
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.get("/friends", auth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const ids = db.friendships[req.auth.sub] ?? [];
    const friends = ids
      .map((id) => db.users[id])
      .filter(Boolean)
      .sort((a, b) => a.username.localeCompare(b.username));
    return friends.map(publicUser);
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.post("/friends", auth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const code = String(req.body.code ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (code.length !== 6) throw new ApiError(400, "INVALID_CODE");

    const friend = Object.values(db.users).find((u) => u.friendCode === code);
    if (!friend) throw new ApiError(404, "NOT_FOUND");
    if (friend.id === req.auth.sub) throw new ApiError(400, "SELF_ADD");

    const myFriends = db.friendships[req.auth.sub] ?? [];
    if (myFriends.includes(friend.id)) throw new ApiError(409, "ALREADY_FRIENDS");

    db.friendships[req.auth.sub] = [...myFriends, friend.id];
    db.friendships[friend.id] = [
      ...(db.friendships[friend.id] ?? []),
      req.auth.sub,
    ];
    saveDb(db);
    return publicUser(friend);
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.delete("/friends/:friendId", auth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const friendId = req.params.friendId;
    db.friendships[req.auth.sub] = (db.friendships[req.auth.sub] ?? []).filter(
      (id) => id !== friendId,
    );
    db.friendships[friendId] = (db.friendships[friendId] ?? []).filter(
      (id) => id !== req.auth.sub,
    );
    saveDb(db);
    return { ok: true };
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// --- ADMIN ENDPOINTS ---
app.get("/admin/stats", auth, adminAuth, (_req, res) => {
  void withDb(() => {
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
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.get("/admin/users", auth, adminAuth, (_req, res) => {
  void withDb(() => {
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
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.post("/admin/users/role", auth, adminAuth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const { userId, role } = req.body || {};
    const user = db.users[userId];
    if (!user) throw new ApiError(404, "USER_NOT_FOUND");
    user.role = role === "admin" ? "admin" : "user";
    saveDb(db);
    return { ok: true, userId, role: user.role };
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.post("/admin/users/delete", auth, adminAuth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const { userId } = req.body || {};
    if (!db.users[userId]) throw new ApiError(404, "USER_NOT_FOUND");
    delete db.users[userId];
    delete db.friendships[userId];
    for (const id in db.friendships) {
      db.friendships[id] = (db.friendships[id] || []).filter((fId) => fId !== userId);
    }
    saveDb(db);
    return { ok: true, deletedUserId: userId };
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// --- CHAT ENDPOINTS ---
const MAX_CHAT_HISTORY = 200;

// Send a chat message (global or DM)
app.post("/chat/send", auth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    if (!db.chatMessages) db.chatMessages = [];
    if (!db.violations) db.violations = [];
    const user = db.users[req.auth.sub];
    if (!user) throw new ApiError(404, "NOT_FOUND");

    // Check ban
    if (isUserBanned(user)) throw new ApiError(403, "USER_BANNED");
    // Check mute
    if (isUserMuted(user)) throw new ApiError(403, "USER_MUTED");

    const text = String(req.body.text ?? "").trim().slice(0, 500);
    const channel = String(req.body.channel ?? "global").trim();
    const recipientId = req.body.recipientId || null;

    if (!text) throw new ApiError(400, "EMPTY_MESSAGE");

    // Profanity check — log violation
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
      // Keep violations manageable
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
      recipientId,
      timestamp: Date.now(),
      flagged: hasProfanity,
    };
    db.chatMessages.push(msg);
    if (db.chatMessages.length > MAX_CHAT_HISTORY * 3) {
      db.chatMessages = db.chatMessages.slice(-MAX_CHAT_HISTORY);
    }
    saveDb(db);
    return msg;
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// Get global chat messages
app.get("/chat/global", (_req, res) => {
  void withDb(() => {
    const db = loadDb();
    const msgs = (db.chatMessages || [])
      .filter((m) => m.channel === "global")
      .slice(-100);
    return msgs;
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// Get DM messages between two users
app.get("/chat/dm/:otherUserId", auth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const myId = req.auth.sub;
    const otherId = req.params.otherUserId;
    const msgs = (db.chatMessages || [])
      .filter((m) => m.channel === "dm" &&
        ((m.userId === myId && m.recipientId === otherId) ||
         (m.userId === otherId && m.recipientId === myId)))
      .slice(-100);
    return msgs;
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// Get user profile by id
app.get("/users/:userId", (_req, res) => {
  void withDb(() => {
    const db = loadDb();
    const user = db.users[_req.params.userId];
    if (!user) throw new ApiError(404, "NOT_FOUND");
    return publicUser(user);
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// Search users by username
app.get("/users", (_req, res) => {
  void withDb(() => {
    const db = loadDb();
    const q = String(_req.query.q ?? "").trim().toLowerCase();
    if (!q) return [];
    return Object.values(db.users)
      .filter((u) => u.username.toLowerCase().includes(q))
      .slice(0, 20)
      .map(publicUser);
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// Admin: get all chat messages
app.get("/admin/chat", auth, adminAuth, (_req, res) => {
  void withDb(() => {
    const db = loadDb();
    return (db.chatMessages || []).slice(-200).map((m) => ({
      ...m,
      username: m.username || db.users[m.userId]?.username || "deleted",
    }));
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// Admin: get all profanity violations
app.get("/admin/violations", auth, adminAuth, (_req, res) => {
  void withDb(() => {
    const db = loadDb();
    return (db.violations || []).slice(-100);
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// Admin: ban a user
app.post("/admin/users/ban", auth, adminAuth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const { userId, duration } = req.body || {};
    const user = db.users[userId];
    if (!user) throw new ApiError(404, "USER_NOT_FOUND");
    // duration in minutes, -1 = permanent, 0 = unban
    if (duration === 0) {
      delete user.bannedUntil;
      user.banReason = null;
    } else if (duration === -1) {
      user.bannedUntil = -1;
      user.banReason = req.body.reason || "Порушення правил";
    } else {
      user.bannedUntil = Date.now() + (duration || 60) * 60 * 1000;
      user.banReason = req.body.reason || "Порушення правил";
    }
    saveDb(db);
    return { ok: true, userId, bannedUntil: user.bannedUntil || null };
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// Admin: mute a user
app.post("/admin/users/mute", auth, adminAuth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const { userId, duration } = req.body || {};
    const user = db.users[userId];
    if (!user) throw new ApiError(404, "USER_NOT_FOUND");
    // duration in minutes, -1 = permanent, 0 = unmute
    if (duration === 0) {
      delete user.mutedUntil;
      user.muteReason = null;
    } else if (duration === -1) {
      user.mutedUntil = -1;
      user.muteReason = req.body.reason || "Порушення правил чату";
    } else {
      user.mutedUntil = Date.now() + (duration || 30) * 60 * 1000;
      user.muteReason = req.body.reason || "Порушення правил чату";
    }
    saveDb(db);
    return { ok: true, userId, mutedUntil: user.mutedUntil || null };
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// Admin: resolve a violation
app.post("/admin/violations/resolve", auth, adminAuth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const { violationId } = req.body || {};
    const v = (db.violations || []).find((v) => v.id === violationId);
    if (!v) throw new ApiError(404, "NOT_FOUND");
    v.resolved = true;
    saveDb(db);
    return { ok: true };
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

const PUBLIC_DIR = join(__dirname, "public");
if (existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  // SPA fallback — serve index.html for all non-API routes
  const API_PREFIXES = ["/auth/", "/admin/", "/friends", "/presence", "/updates/", "/curseforge", "/health", "/chat/", "/users"];
  app.get("*", (req, res, next) => {
    if (API_PREFIXES.some((p) => req.path.startsWith(p))) {
      return next();
    }
    res.sendFile(join(PUBLIC_DIR, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Nuvoxel Launcher social API: http://0.0.0.0:${PORT}`);
  console.log("Health check: GET /health");
  if (CURSEFORGE_API_KEY) {
    console.log("CurseForge proxy: GET /curseforge/*");
  } else {
    console.log(
      "CurseForge proxy disabled — set CURSEFORGE_API_KEY in .env (console.curseforge.com)",
    );
  }
});

export default app;

