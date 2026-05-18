"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegisterInput = validateRegisterInput;
exports.validateLoginInput = validateLoginInput;
function sendValidationError(res, message) {
    return res.status(400).json({
        success: false,
        message,
    });
}
function validateRegisterInput(req, res, next) {
    const { username, name, email, password, bio, avatar, headline } = req.body;
    if (!username || typeof username !== "string" || username.trim().length < 3) {
        return sendValidationError(res, "Username wajib diisi minimal 3 karakter.");
    }
    if (!name || typeof name !== "string" || name.trim().length < 2) {
        return sendValidationError(res, "Nama wajib diisi minimal 2 karakter.");
    }
    if (!email || typeof email !== "string") {
        return sendValidationError(res, "Email wajib diisi.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return sendValidationError(res, "Format email tidak valid.");
    }
    if (!password || typeof password !== "string" || password.length < 6) {
        return sendValidationError(res, "Password minimal 6 karakter.");
    }
    req.body.username = username.trim();
    req.body.name = name.trim();
    req.body.email = email.trim().toLowerCase();
    if (bio)
        req.body.bio = String(bio).trim();
    if (avatar)
        req.body.avatar = String(avatar).trim();
    if (headline)
        req.body.headline = String(headline).trim();
    return next();
}
function validateLoginInput(req, res, next) {
    const { email, password } = req.body;
    if (!email || typeof email !== "string") {
        return sendValidationError(res, "Email wajib diisi.");
    }
    if (!password || typeof password !== "string") {
        return sendValidationError(res, "Password wajib diisi.");
    }
    req.body.email = email.trim().toLowerCase();
    return next();
}
