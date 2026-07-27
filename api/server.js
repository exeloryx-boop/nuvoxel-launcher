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
  return {
    id: user.id,
    username: user.username,
    friendCode: user.friendCode,
    online,
    status: online ? user.status || "online" : "offline",
    lastSeenAt: user.lastSeenAt,
  };
}

function issueToken(userId, username) {
  return jwt.sign({ sub: userId, username }, JWT_SECRET, { expiresIn: "30d" });
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

    db.users[id] = {
      id,
      username,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      friendCode,
      createdAt: now,
      lastSeenAt: now,
      status: "online",
    };
    db.friendships[id] = [];
    saveDb(db);

    return {
      token: issueToken(id, username),
      user: { id, username, friendCode, email },
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

    user.lastSeenAt = Date.now();
    user.status = "online";
    saveDb(db);

    return {
      token: issueToken(user.id, user.username),
      user: {
        id: user.id,
        username: user.username,
        friendCode: user.friendCode,
        email: user.email,
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
app.get("/admin/stats", (_req, res) => {
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

app.get("/admin/users", (_req, res) => {
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
        role: u.role || "user",
        createdAt: u.createdAt || u.lastSeenAt,
        lastSeenAt: u.lastSeenAt,
        online: isOnline,
        status: isOnline ? u.status || "online" : "offline",
        friendsCount: (db.friendships[u.id] || []).length,
      };
    });
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

app.post("/admin/users/role", (req, res) => {
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

app.post("/admin/users/delete", (req, res) => {
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
    const user = db.users[req.auth.sub];
    if (!user) throw new ApiError(404, "NOT_FOUND");

    const text = String(req.body.text ?? "").trim().slice(0, 500);
    const channel = String(req.body.channel ?? "global").trim();
    const recipientId = req.body.recipientId || null;

    if (!text) throw new ApiError(400, "EMPTY_MESSAGE");

    const msg = {
      id: randomUUID(),
      userId: user.id,
      username: user.username,
      text,
      channel,
      recipientId,
      timestamp: Date.now(),
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
app.get("/admin/chat", (_req, res) => {
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
