import { Router } from "express";
import { getPublicProfile, getPublicLink, getPublicProfileByDomain } from "../controllers/publicController";
import { recordClickHandler } from "../controllers/analytics.controller";
import { clickRateLimiter } from "../middleware/rateLimiters";

const router = Router();

router.get("/domain/:domain", getPublicProfileByDomain);
router.get("/:username", getPublicProfile);
router.get("/:username/links/:id", getPublicLink);
router.post("/:username/links/:id/click", clickRateLimiter, recordClickHandler);

export default router;
