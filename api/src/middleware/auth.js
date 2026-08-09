import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { loadDb } from "../db/database.js";

export function auth(req, res, next) {
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

export function adminAuth(req, res, next) {
  if (!req.auth || req.auth.role !== "admin") {
    return res.status(403).json({ error: "FORBIDDEN_NOT_ADMIN" });
  }
  next();
}
