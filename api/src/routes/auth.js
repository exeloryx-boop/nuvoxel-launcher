import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { sendError } from "../utils/errors.js";
import {
  registerUser,
  loginUser,
  quickSessionUser,
  startLauncherAuth,
  completeLauncherAuth,
  pollLauncherAuth,
} from "../services/authService.js";
import { getCurrentUser } from "../services/userService.js";

const router = Router();

router.post("/register", (req, res) => {
  registerUser({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.post("/login", (req, res) => {
  try {
    loginUser({
      loginInput: req.body.login ?? req.body.email,
      password: req.body.password,
    })
      .then((payload) => res.json(payload))
      .catch((e) => sendError(res, e));
  } catch (e) {
    sendError(res, e);
  }
});

router.post("/quick-session", (req, res) => {
  try {
    quickSessionUser(req.body.username)
      .then((payload) => res.json(payload))
      .catch((e) => sendError(res, e));
  } catch (e) {
    sendError(res, e);
  }
});

router.get("/me", auth, (req, res) => {
  getCurrentUser(req.auth.sub)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

// --- Launcher browser-to-launcher sign-in flow ---

router.post("/launcher/start", (_req, res) => {
  try {
    const result = startLauncherAuth();
    res.status(201).json(result);
  } catch (e) {
    sendError(res, e);
  }
});

router.post("/launcher/complete", auth, (req, res) => {
  try {
    const result = completeLauncherAuth(req.auth, req.body?.code);
    res.json(result);
  } catch (e) {
    sendError(res, e);
  }
});

router.get("/launcher/poll/:code", (req, res) => {
  try {
    const result = pollLauncherAuth(req.params.code);
    res.json(result);
  } catch (e) {
    sendError(res, e);
  }
});

export default router;
