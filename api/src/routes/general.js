import { Router } from "express";
import { existsSync, readFileSync } from "node:fs";
import { CURSEFORGE_API_BASE, CURSEFORGE_API_KEY, UPDATES_PATH } from "../config/env.js";

const router = Router();

// --- Updates ---
router.get("/updates/latest", (_req, res) => {
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

// --- CurseForge proxy ---
router.get("/curseforge/status", (_req, res) => {
  res.json({ available: !!CURSEFORGE_API_KEY });
});

router.use("/curseforge", async (req, res) => {
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
      upstream.headers.get("content-type") || "application/json"
    );
    res.send(body);
  } catch {
    res.status(502).json({ error: "CURSEFORGE_PROXY_ERROR" });
  }
});

// --- Health ---
router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "nuvoxel-social",
    version: "1.0.0",
    curseforge: !!CURSEFORGE_API_KEY,
  });
});

// --- Broadcast (public read) ---
import { getBroadcast } from "../services/adminService.js";

router.get("/broadcast", (_req, res) => {
  getBroadcast()
    .then((payload) => res.json(payload))
    .catch(() => res.status(500).json({ error: "SERVER_ERROR" }));
});

export default router;
