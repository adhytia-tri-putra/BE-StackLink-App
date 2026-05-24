import { Router } from "express";
import { getMyPreviewProfile, getMyProfile, updateMyProfile, updateTheme } from "../controllers/profileController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/me", authenticate, getMyProfile);
router.get("/preview", authenticate, getMyPreviewProfile);
router.patch("/me", authenticate, updateMyProfile);
router.put("/theme", authenticate, updateTheme);

export default router;
