import { Router } from "express";
import { getUserProfileById, getUsers, updateUserProfileById } from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getUsers);
router.get("/profile/:id", getUserProfileById);
router.patch("/profile/:id", authenticate, updateUserProfileById);

export default router;
