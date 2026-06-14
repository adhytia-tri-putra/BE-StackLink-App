import { Router } from "express";
import { forgotPassword, login, register, logout, resetPassword } from "../controllers/authController";
import { validateLoginInput, validateRegisterInput } from "../middleware/validateAuthInput";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", validateRegisterInput, register);
router.post("/login", validateLoginInput, login);
router.post("/logout", authenticate, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
