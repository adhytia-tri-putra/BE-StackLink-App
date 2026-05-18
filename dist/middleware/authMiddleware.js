"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sessionService_1 = require("../services/sessionService");
function parseTokenPayload(decoded) {
    if (typeof decoded === "string") {
        return null;
    }
    const sub = Number(decoded.sub);
    if (!Number.isInteger(sub) || sub <= 0) {
        return null;
    }
    if (typeof decoded.email !== "string" || typeof decoded.name !== "string") {
        return null;
    }
    return {
        sub,
        email: decoded.email,
        name: decoded.name,
    };
}
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    const queryToken = typeof req.query.token === "string" ? req.query.token : undefined;
    const rawToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : queryToken;
    if (!rawToken) {
        return res.status(401).json({
            success: false,
            message: "Akses ditolak. Token tidak ditemukan atau format tidak sesuai.",
        });
    }
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET belum di-set di file .env");
        }
        const decoded = jsonwebtoken_1.default.verify(rawToken, jwtSecret);
        const payload = parseTokenPayload(decoded);
        if (!payload) {
            return res.status(403).json({
                success: false,
                message: "Akses ditolak. Token tidak valid atau sudah kedaluwarsa.",
            });
        }
        // Verify token exists in database
        const session = await (0, sessionService_1.findSessionByToken)(rawToken);
        if (!session) {
            return res.status(403).json({
                success: false,
                message: "Akses ditolak. Token tidak ditemukan atau telah dihapus.",
            });
        }
        // Check if session has expired
        if (session.expiresAt < new Date()) {
            return res.status(403).json({
                success: false,
                message: "Akses ditolak. Token sudah kedaluwarsa.",
            });
        }
        req.user = payload;
        next();
    }
    catch (_error) {
        return res.status(403).json({
            success: false,
            message: "Akses ditolak. Token tidak valid atau sudah kedaluwarsa.",
        });
    }
}
