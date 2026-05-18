"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSocket = authenticateSocket;
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
async function authenticateSocket(token) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET belum di-set di file .env");
    }
    const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
    const payload = parseTokenPayload(decoded);
    if (!payload) {
        throw new Error("Invalid token payload");
    }
    const session = await (0, sessionService_1.findSessionByToken)(token);
    if (!session) {
        throw new Error("Session tidak ditemukan atau telah dihapus.");
    }
    if (session.expiresAt < new Date()) {
        throw new Error("Token sudah kedaluwarsa.");
    }
    return payload.sub;
}
