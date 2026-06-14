import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { changePassword, deleteAccount, logoutAll, updateAccount } from "../controllers/accountController";

const router = Router();
router.use(authenticate);
router.patch("/", updateAccount);
router.put("/password", changePassword);
router.post("/logout-all", logoutAll);
router.delete("/", deleteAccount);

export default router;
