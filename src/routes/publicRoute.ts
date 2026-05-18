import { Router } from "express";
import { getPublicProfile, getPublicLink } from "../controllers/publicController";
import { recordClickHandler } from "../controllers/analytics.controller";

const router = Router();

router.get("/:username", getPublicProfile);
router.get("/:username/links/:id", getPublicLink);
router.post("/:username/links/:id/click", recordClickHandler);

export default router;