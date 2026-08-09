import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { sendError } from "../utils/errors.js";
import { createPack, getPacks, importPackByCode } from "../services/packService.js";

const router = Router();

router.post("/packs", auth, (req, res) => {
  createPack(req.auth.sub, req.body)
    .then((payload) => res.status(201).json(payload))
    .catch((e) => sendError(res, e));
});

router.get("/packs", auth, (req, res) => {
  getPacks(req.auth.sub)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

router.post("/packs/import", auth, (req, res) => {
  importPackByCode(req.body?.code)
    .then((payload) => res.json(payload))
    .catch((e) => sendError(res, e));
});

export default router;
