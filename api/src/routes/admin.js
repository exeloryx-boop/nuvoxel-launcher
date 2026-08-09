import { Router } from "express";
import { auth, adminAuth } from "../middleware/auth.js";
import { sendError } from "../utils/errors.js";
import {
  getStats,
  getAllUsers,
  setUserRole,
  deleteUser,
  banUser,
  muteUser,
  getAdminChat,
  deleteMessage,
  getViolations,
  resolveViolation,
  clearResolvedViolations,
  getBroadcast,
  setBroadcast,
  getAllPacks,
  reviewPack,
} from "../services/adminService.js";

const router = Router();

// --- Stats ---
router.get("/stats", auth, adminAuth, (_req, res) => {
  getStats()
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// --- Users management ---
router.get("/users", auth, adminAuth, (_req, res) => {
  getAllUsers()
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.post("/users/role", auth, adminAuth, (req, res) => {
  setUserRole(req.body?.userId, req.body?.role)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.post("/users/delete", auth, adminAuth, (req, res) => {
  deleteUser(req.body?.userId)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.post("/users/ban", auth, adminAuth, (req, res) => {
  banUser(req.body?.userId, req.body?.duration, req.body?.reason)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.post("/users/mute", auth, adminAuth, (req, res) => {
  muteUser(req.body?.userId, req.body?.duration, req.body?.reason)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// --- Chat moderation ---
router.get("/chat", auth, adminAuth, (_req, res) => {
  getAdminChat()
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.post("/chat/delete", auth, adminAuth, (req, res) => {
  deleteMessage(req.body?.messageId)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// --- Violations ---
router.get("/violations", auth, adminAuth, (_req, res) => {
  getViolations()
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.post("/violations/resolve", auth, adminAuth, (req, res) => {
  resolveViolation(req.body?.violationId)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.post("/violations/clear-resolved", auth, adminAuth, (_req, res) => {
  clearResolvedViolations()
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// --- Broadcast ---
router.post("/broadcast", auth, adminAuth, (req, res) => {
  setBroadcast(req.auth.sub, {
    text: req.body?.text,
    type: req.body?.type,
    active: req.body?.active,
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// --- Packs moderation ---
router.get("/claude/packs", auth, adminAuth, (_req, res) => {
  getAllPacks()
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.post("/claude/packs/review", auth, adminAuth, (req, res) => {
  reviewPack(req.body?.packId, req.body?.status, req.body?.reason, req.auth.sub)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

export default router;
