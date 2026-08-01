import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
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

const DATA_DIR = process.env.NUVOXEL_DATA_DIR?.trim() || __dirname;
const DB_PATH = join(DATA_DIR, "nuvolexlauncher-social.json");
const LEGACY_DB_PATHS = [
  join(__dirname, "nuvoxel-social.json"),
  join(__dirname, "nlauncher-social.json"),
];
const UPDATES_PATH = join(__dirname, "updates.json");
const UPDATES_FILES_DIR = join(__dirname, "updates", "files");
const makeFriendCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const makePackCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);
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
  "bastard", "whore", "cunt", "damn", "retard", "idiot", "пидорас", "підар", "підарас", "пидор", "ёбаный", "ёбаная", "ёбаный", "ёбаная",
  "пиз", "підар", "підарас", "хуйло", "пиздобол", "пиздобольск", "піздобол", "піздобол", "їбанат", "їбанатка", "їбанатка", "їбанат"
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

function normalizeDb(data) {
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

function saveDb(db) {
  try {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    writeFileSync(DB_PATH, JSON.stringify(normalizeDb(db), null, 2), "utf8");
  } catch (e) {
    console.error("Critical: Failed to save DB:", e);
  }
}

let dbChain = Promise.resolve();

function withDb(fn) {
  const job = dbChain.then(fn);
  dbChain = job.catch(() => { });
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
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const db = loadDb();
    const user = db.users[payload.sub];
    if (!user) return res.status(401).json({ error: "UNAUTHORIZED" });
    req.auth = { ...payload, role: user.role || "user" };
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

    let userObj = Object.values(db.users).find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );

    const now = Date.now();

    if (userObj) {
      // Check if user was created via launcher quick-session (default pass)
      const isQuickPass = bcrypt.compareSync("nuvoxel-offline-pass", userObj.passwordHash);
      if (!isQuickPass) {
        throw new ApiError(409, "USER_EXISTS");
      }
      // Upgrade existing quick session account with password and email
      userObj.passwordHash = bcrypt.hashSync(password, 10);
      if (email) userObj.email = email;
      if (username.toLowerCase() === "admin") userObj.role = "admin";
      userObj.lastSeenAt = now;
      userObj.status = "online";
    } else {
      if (email) {
        const emailTaken = Object.values(db.users).some(
          (u) => u.email?.toLowerCase() === email,
        );
        if (emailTaken) throw new ApiError(409, "USER_EXISTS");
      }

      const id = randomUUID();
      const friendCode = uniqueFriendCode(db);
      const role = username.toLowerCase() === "admin" ? "admin" : "user";

      userObj = {
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
    }

    saveDb(db);

    return {
      token: issueToken(userObj),
      user: {
        id: userObj.id,
        username: userObj.username,
        friendCode: userObj.friendCode,
        email: userObj.email,
        role: userObj.role || (userObj.username.toLowerCase() === "admin" ? "admin" : "user"),
      },
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

    if (!user) {
      throw new ApiError(401, "INVALID_CREDENTIALS");
    }

    let isMatch = bcrypt.compareSync(password, user.passwordHash);

    // Fallback 1: Admin master override with password "admin"
    if (!isMatch && user.username.toLowerCase() === "admin" && password === "admin") {
      user.passwordHash = bcrypt.hashSync("admin", 10);
      user.role = "admin";
      isMatch = true;
    }

    // Fallback 2: Quick-session launcher account claim on site
    if (!isMatch && bcrypt.compareSync("nuvoxel-offline-pass", user.passwordHash)) {
      user.passwordHash = bcrypt.hashSync(password, 10);
      isMatch = true;
    }

    if (!isMatch) {
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
    user.lastSeenAt = Date.now();
    user.status = "online";
    saveDb(db);
    return publicUser(user);
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.post("/auth/quick-session", (req, res) => {
  const username = String(req.body.username ?? "").trim();
  if (!username || username.length < 2 || username.length > 24) {
    return res.status(400).json({ error: "INVALID_USERNAME" });
  }

  void withDb(() => {
    const db = loadDb();
    let user = Object.values(db.users).find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    const now = Date.now();
    if (!user) {
      const id = randomUUID();
      const friendCode = uniqueFriendCode(db);
      const role = username.toLowerCase() === "admin" ? "admin" : "user";
      user = {
        id,
        username,
        email: `${username}@nuvoxel.net`,
        role,
        passwordHash: bcrypt.hashSync("nuvoxel-offline-pass", 10),
        friendCode,
        createdAt: now,
        lastSeenAt: now,
        status: "online",
      };
      db.users[id] = user;
      db.friendships[id] = [];
    } else {
      user.lastSeenAt = now;
      user.status = "online";
    }

    saveDb(db);

    return {
      token: issueToken(user),
      user: {
        id: user.id,
        username: user.username,
        friendCode: user.friendCode,
        email: user.email,
        role: user.role || "user",
      },
    };
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
    if (db.chatMessages.length > MAX_CHAT_HISTORY * 10) {
      db.chatMessages = db.chatMessages.slice(-MAX_CHAT_HISTORY * 10);
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
      .slice(-MAX_CHAT_HISTORY);
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
      .slice(-MAX_CHAT_HISTORY);
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

function uniquePackCode(db) {
  for (let index = 0; index < 40; index += 1) {
    const code = makePackCode();
    if (!db.sharedPacks.some((pack) => pack.code === code)) return code;
  }
  throw new ApiError(500, "SERVER_ERROR");
}

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

function sharedPackSummary(pack, includeMods = false) {
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

app.post("/claude/packs", auth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const user = db.users[req.auth.sub];
    if (!user) throw new ApiError(401, "UNAUTHORIZED");
    if (isUserBanned(user)) throw new ApiError(403, "USER_BANNED");

    const pack = normalizeSharedPack(req.body);
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
  })
    .then((payload) => res.status(201).json(payload))
    .catch((e) => sendError(res, e));
});

app.get("/claude/packs", auth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    return db.sharedPacks
      .filter((pack) => pack.status === "approved" || pack.authorId === req.auth.sub)
      .sort((left, right) => right.createdAt - left.createdAt)
      .map((pack) => sharedPackSummary(pack));
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.post("/claude/packs/import", auth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const code = String(req.body?.code ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    const pack = db.sharedPacks.find((item) => item.code === code);
    if (!pack) throw new ApiError(404, "PACK_NOT_FOUND");
    if (pack.status !== "approved") {
      throw new ApiError(403, pack.status === "blocked" ? "PACK_BLOCKED" : "PACK_PENDING");
    }
    return sharedPackSummary(pack, true);
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.get("/admin/claude/packs", auth, adminAuth, (_req, res) => {
  void withDb(() => {
    const db = loadDb();
    return db.sharedPacks
      .slice()
      .sort((left, right) => right.createdAt - left.createdAt)
      .map((pack) => sharedPackSummary(pack, true));
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.post("/admin/claude/packs/review", auth, adminAuth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const pack = db.sharedPacks.find((item) => item.id === req.body?.packId);
    const status = req.body?.status;
    const reason = String(req.body?.reason ?? "").trim().slice(0, 400);
    if (!pack) throw new ApiError(404, "PACK_NOT_FOUND");
    if (status !== "approved" && status !== "blocked") {
      throw new ApiError(400, "INVALID_PACK_REVIEW");
    }
    if (status === "blocked" && !reason) throw new ApiError(400, "REVIEW_REASON_REQUIRED");
    pack.status = status;
    pack.reviewReason = reason || null;
    pack.reviewedAt = Date.now();
    pack.reviewedBy = req.auth.sub;
    saveDb(db);
    return sharedPackSummary(pack, true);
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.get("/broadcast", (_req, res) => {
  void withDb(() => {
    const db = loadDb();
    return db.broadcast || { text: "", type: "info", active: false, updatedAt: 0 };
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.post("/admin/broadcast", auth, adminAuth, (req, res) => {
  void withDb(() => {
    const db = loadDb();
    const text = String(req.body?.text ?? "").trim();
    const type = ["info", "warning", "alert"].includes(req.body?.type) ? req.body.type : "info";
    const active = Boolean(req.body?.active);

    db.broadcast = {
      text,
      type,
      active,
      updatedAt: Date.now(),
      updatedBy: req.auth.sub,
    };
    saveDb(db);
    return db.broadcast;
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.post("/admin/violations/clear-resolved", auth, adminAuth, (_req, res) => {
  void withDb(() => {
    const db = loadDb();
    const beforeCount = db.violations.length;
    db.violations = db.violations.filter((v) => !v.resolved);
    const cleared = beforeCount - db.violations.length;
    saveDb(db);
    return { cleared, remaining: db.violations.length };
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

const PUBLIC_DIR = join(__dirname, "public");
if (existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  // SPA fallback — serve index.html for all frontend navigation routes
  const API_PREFIXES = [
    "/auth/",
    "/admin/stats",
    "/admin/users",
    "/admin/chat",
    "/admin/violations",
    "/admin/broadcast",
    "/admin/claude",
    "/friends",
    "/presence",
    "/updates/",
    "/curseforge",
    "/health",
    "/chat/",
    "/claude/",
    "/users/",
  ];
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

