import { Router } from "express";
import {
  getLinkAnalyticsHandler,
  getAnalyticsSummaryHandler,
  createAnalyticsStreamHandler,
} from "../controllers/analytics.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticate);

router.get("/summary", getAnalyticsSummaryHandler);
router.get("/stream", createAnalyticsStreamHandler);
router.get("/links/:id", getLinkAnalyticsHandler);

export default router;