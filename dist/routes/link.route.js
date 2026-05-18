"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const link_controller_1 = require("../controllers/link.controller");
const authMiddleware_1 = require("../middleware/authMiddleware"); // 
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate); // 
router.get("/", link_controller_1.getLinks);
router.post("/", link_controller_1.createLink);
router.put("/:id", link_controller_1.updateLink);
router.delete("/:id", link_controller_1.deleteLink);
router.patch("/reorder", link_controller_1.reorderLinks);
exports.default = router;
