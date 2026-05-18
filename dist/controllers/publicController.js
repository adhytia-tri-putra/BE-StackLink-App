"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicProfile = getPublicProfile;
exports.getPublicLink = getPublicLink;
const publicService_1 = require("../services/publicService");
async function getPublicProfile(req, res, next) {
    try {
        const { username } = req.params;
        const profile = await (0, publicService_1.findPublicProfileByUsername)(username);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan.",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Profil berhasil diambil.",
            data: profile,
        });
    }
    catch (error) {
        return next(error);
    }
}
async function getPublicLink(req, res, next) {
    try {
        const { username, id } = req.params;
        const link = await (0, publicService_1.findPublicLinkByIdAndUsername)(id, username);
        if (!link) {
            return res.status(404).json({
                success: false,
                message: "Link tidak ditemukan.",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Link berhasil diambil.",
            data: link,
        });
    }
    catch (error) {
        return next(error);
    }
}
