import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { sendError } from "../utils/errors.js";
import {
  getUserById,
  searchUsers,
  updatePresence,
  getFriends,
  addFriend,
  removeFriend,
} from "../services/userService.js";

const router = Router();

// --- Presence ---
router.post("/presence", auth, (req, res) => {
  updatePresence(req.auth.sub, req.body.status)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// --- Friends ---
router.get("/friends", auth, (req, res) => {
  getFriends(req.auth.sub)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.post("/friends", auth, (req, res) => {
  addFriend(req.auth.sub, req.body.code)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.delete("/friends/:friendId", auth, (req, res) => {
  removeFriend(req.auth.sub, req.params.friendId)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// --- User lookup ---
router.get("/users/:userId", (_req, res) => {
  getUserById(_req.params.userId)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.get("/users", (_req, res) => {
  searchUsers(_req.query.q)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

export default router;
