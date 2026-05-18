"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qr_controller_1 = require("../controllers/qr.controller");
const authMiddleware_1 = require("../middleware/authMiddleware"); // sesuaikan nama middleware auth kamu
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get("/profile", qr_controller_1.getProfileQR);
router.get("/links/:id", qr_controller_1.getLinkQR);
exports.default = router;
