import { Router } from "express";
import { forgotPassword, login, register, logout, resendVerification, resetPassword, verifyEmail } from "../controllers/authController";
import { validateLoginInput, validateRegisterInput } from "../middleware/validateAuthInput";
import { authenticate } from "../middleware/authMiddleware";
import { authRateLimiter } from "../middleware/rateLimiters";

const router = Router();

router.post("/register", authRateLimiter, validateRegisterInput, register);
router.post("/login", authRateLimiter, validateLoginInput, login);
router.post("/logout", authenticate, logout);
router.post("/forgot-password", authRateLimiter, forgotPassword);
router.post("/reset-password", authRateLimiter, resetPassword);
router.post("/verify-email", authRateLimiter, verifyEmail);
router.post("/resend-verification", authRateLimiter, resendVerification);

export default router;
