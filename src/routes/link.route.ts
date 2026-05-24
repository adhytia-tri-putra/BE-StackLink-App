import { Router } from "express";
import {
  getLinks,
  createLink,
  updateLink,
  deleteLink,
  reorderLinks,
} from "../controllers/link.controller";
import { authenticate } from "../middleware/authMiddleware"; // 

const router = Router();

router.use(authenticate); // 

router.get("/", getLinks);
router.post("/", createLink);
router.put("/:id", updateLink);
router.delete("/:id", deleteLink);
router.patch("/reorder", reorderLinks);

export default router;