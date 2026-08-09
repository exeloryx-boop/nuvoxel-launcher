import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { sendError } from "../utils/errors.js";
import { sendChatMessage, getGlobalChat, getDMChat } from "../services/chatService.js";

const router = Router();

router.post("/send", auth, (req, res) => {
  sendChatMessage(req.auth.sub, {
    text: req.body.text,
    channel: req.body.channel,
    recipientId: req.body.recipientId,
  })
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.get("/global", (_req, res) => {
  getGlobalChat()
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.get("/dm/:otherUserId", auth, (req, res) => {
  getDMChat(req.auth.sub, req.params.otherUserId)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

export default router;
