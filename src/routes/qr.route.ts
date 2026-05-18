import { Router } from "express";
import { getProfileQR, getLinkQR } from "../controllers/qr.controller";
import { authenticate } from "../middleware/authMiddleware"; // sesuaikan nama middleware auth kamu

const router = Router();

router.use(authenticate);

router.get("/profile", getProfileQR);
router.get("/links/:id", getLinkQR);

export default router;