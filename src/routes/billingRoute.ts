import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { createCheckout, getBillingStatus } from "../controllers/billingController";

const router = Router();
router.use(authenticate);
router.get("/status", getBillingStatus);
router.post("/checkout", createCheckout);
export default router;
