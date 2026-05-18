"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccessToken = createAccessToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function createAccessToken(user) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET belum di-set di file .env");
    }
    const expiresIn = (process.env.JWT_EXPIRES_IN || "1d");
    const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
    };
    return jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn });
}
