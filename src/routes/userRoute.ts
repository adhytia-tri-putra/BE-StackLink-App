import { Router } from "express";
import { updateUserProfileById } from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticate);
router.patch("/profile/:id", authenticate, updateUserProfileById);

export default router;
