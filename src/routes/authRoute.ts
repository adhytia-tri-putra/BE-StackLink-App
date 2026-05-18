import { Router } from "express";
import { login, register, logout } from "../controllers/authController";
import { validateLoginInput, validateRegisterInput } from "../middleware/validateAuthInput";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", validateRegisterInput, register);
router.post("/login", validateLoginInput, login);
router.post("/logout", authenticate, logout);

export default router;
