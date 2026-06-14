import { Router } from "express";
import { getMyPreviewProfile, getMyProfile, getPublishingDiagnostics, updateMyProfile, updatePublishingSettings, updateTheme } from "../controllers/profileController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/me", authenticate, getMyProfile);
router.get("/preview", authenticate, getMyPreviewProfile);
router.patch("/me", authenticate, updateMyProfile);
router.put("/theme", authenticate, updateTheme);
router.put("/publishing", authenticate, updatePublishingSettings);
router.get("/publishing/diagnostics", authenticate, getPublishingDiagnostics);

export default router;
