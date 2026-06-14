import { Router } from "express";
import {
  getLinkAnalyticsHandler,
  getAnalyticsSummaryHandler,
  createAnalyticsStreamHandler,
  exportAnalyticsCsvHandler,
} from "../controllers/analytics.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticate);

router.get("/summary", getAnalyticsSummaryHandler);
router.get("/export.csv", exportAnalyticsCsvHandler);
router.get("/stream", createAnalyticsStreamHandler);
router.get("/links/:id", getLinkAnalyticsHandler);

export default router;
