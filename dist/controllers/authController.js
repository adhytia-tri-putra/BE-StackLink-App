"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
const jwt_1 = require("../utils/jwt");
const userService_1 = require("../services/userService");
const sessionService_1 = require("../services/sessionService");
async function register(req, res, next) {
    try {
        const { username, name, email, password, bio, avatar, headline } = req.body;
        const existingUser = await (0, userService_1.findUserByEmail)(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email sudah terdaftar.",
            });
        }
        const user = await (0, userService_1.createUser)({
            username,
            name,
            email,
            password,
            bio,
            avatar,
            headline,
        });
        return res.status(201).json({
            success: true,
            message: "Register berhasil. Silakan login untuk mendapatkan token.",
            data: {
                user,
            },
        });
    }
    catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Email atau username sudah terdaftar.",
            });
        }
        return next(error);
    }
}
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const userRecord = await (0, userService_1.findUserByEmail)(email);
        if (!userRecord) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah.",
            });
        }
        const isPasswordMatch = await (0, userService_1.checkPassword)(userRecord, password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah.",
            });
        }
        const user = (0, userService_1.sanitizeUser)(userRecord);
        const token = (0, jwt_1.createAccessToken)(user);
        // Calculate expiration time (default 1 day)
        const expiresIn = process.env.JWT_EXPIRES_IN || "1d";
        const expirationMs = expiresIn === "1d" ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // 1d or 1h
        const expiresAt = new Date(Date.now() + expirationMs);
        // Save session to database
        await (0, sessionService_1.createSession)(user.id, token, expiresAt);
        return res.status(200).json({
            success: true,
            message: "Login berhasil.",
            data: {
                user,
                token,
            },
        });
    }
    catch (error) {
        return next(error);
    }
}
async function logout(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Token tidak ditemukan.",
            });
        }
        const token = authHeader.split(" ")[1];
        // Delete session from database
        await (0, sessionService_1.deleteSession)(token);
        return res.status(200).json({
            success: true,
            message: "Logout berhasil.",
        });
    }
    catch (error) {
        return next(error);
    }
}
