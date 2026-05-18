"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUserProfileById = getUserProfileById;
exports.updateUserProfileById = updateUserProfileById;
const userService_1 = require("../services/userService");
async function getUsers(_req, res, next) {
    try {
        const users = await (0, userService_1.findAllUsers)();
        return res.status(200).json({
            success: true,
            message: "List user berhasil diambil.",
            data: users,
        });
    }
    catch (error) {
        return next(error);
    }
}
async function getUserProfileById(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Parameter id harus berupa angka positif.",
            });
        }
        const user = await (0, userService_1.findUserById)(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: `User dengan id ${id} tidak ditemukan.`,
            });
        }
        return res.status(200).json({
            success: true,
            message: "Profil user berhasil diambil.",
            data: (0, userService_1.sanitizeUser)(user),
        });
    }
    catch (error) {
        return next(error);
    }
}
function sanitizeProfileUpdateInput(body) {
    const payload = {};
    if (body.name !== undefined)
        payload.name = String(body.name).trim();
    if (body.bio !== undefined)
        payload.bio = body.bio === null ? null : String(body.bio).trim();
    if (body.avatar !== undefined)
        payload.avatar = body.avatar === null ? null : String(body.avatar).trim();
    if (body.headline !== undefined)
        payload.headline = body.headline === null ? null : String(body.headline).trim();
    return payload;
}
async function updateUserProfileById(req, res, next) {
    try {
        const id = Number(req.params.id);
        const tokenUserId = Number(req.user?.sub);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Parameter id harus berupa angka positif.",
            });
        }
        if (!Number.isInteger(tokenUserId) || tokenUserId <= 0) {
            return res.status(401).json({
                success: false,
                message: "Akses ditolak. Token tidak valid.",
            });
        }
        if (id !== tokenUserId) {
            return res.status(403).json({
                success: false,
                message: "Kamu hanya bisa mengubah profil milik akunmu sendiri.",
            });
        }
        const payload = sanitizeProfileUpdateInput(req.body);
        if (payload.name !== undefined && payload.name.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Nama minimal 2 karakter.",
            });
        }
        if (Object.keys(payload).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Tidak ada data profil yang dikirim.",
            });
        }
        const updatedUser = await (0, userService_1.updateUser)(id, payload);
        return res.status(200).json({
            success: true,
            message: "Profil user berhasil diperbarui.",
            data: updatedUser,
        });
    }
    catch (error) {
        return next(error);
    }
}
