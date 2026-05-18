"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderLinks = exports.deleteLink = exports.updateLink = exports.createLink = exports.getLinks = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
// GET /api/links
const getLinks = async (req, res) => {
    try {
        const links = await prisma_1.default.link.findMany({
            where: { userId: req.user.sub },
            orderBy: { position: "asc" },
        });
        res.json({ success: true, data: links });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getLinks = getLinks;
// POST /api/links
const createLink = async (req, res) => {
    const { title, url, icon } = req.body;
    if (!title || !url) {
        res.status(400).json({ success: false, message: "Title dan URL wajib diisi" });
        return;
    }
    try {
        const count = await prisma_1.default.link.count({
            where: { userId: req.user.sub },
        });
        const link = await prisma_1.default.link.create({
            data: {
                userId: req.user.sub,
                title,
                url,
                icon: icon ?? null,
                position: count,
            },
        });
        res.status(201).json({ success: true, data: link });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.createLink = createLink;
// PUT /api/links/:id
const updateLink = async (req, res) => {
    const id = req.params.id;
    const { title, url, icon, isActive } = req.body;
    try {
        const existing = await prisma_1.default.link.findFirst({
            where: { id, userId: req.user.sub },
        });
        if (!existing) {
            res.status(404).json({ success: false, message: "Link tidak ditemukan" });
            return;
        }
        const updated = await prisma_1.default.link.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(url !== undefined && { url }),
                ...(icon !== undefined && { icon }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateLink = updateLink;
// DELETE /api/links/:id
const deleteLink = async (req, res) => {
    const id = req.params.id;
    try {
        const existing = await prisma_1.default.link.findFirst({
            where: { id, userId: req.user.sub },
        });
        if (!existing) {
            res.status(404).json({ success: false, message: "Link tidak ditemukan" });
            return;
        }
        await prisma_1.default.link.delete({ where: { id } });
        const remaining = await prisma_1.default.link.findMany({
            where: { userId: req.user.sub },
            orderBy: { position: "asc" },
        });
        await Promise.all(remaining.map((link, index) => prisma_1.default.link.update({
            where: { id: link.id },
            data: { position: index },
        })));
        res.json({ success: true, message: "Link berhasil dihapus" });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteLink = deleteLink;
// PATCH /api/links/reorder
const reorderLinks = async (req, res) => {
    const { links } = req.body;
    if (!Array.isArray(links) || links.length === 0) {
        res.status(400).json({ success: false, message: "Format links tidak valid" });
        return;
    }
    try {
        const ids = links.map((l) => l.id);
        const owned = await prisma_1.default.link.findMany({
            where: { id: { in: ids }, userId: req.user.sub },
        });
        if (owned.length !== ids.length) {
            res.status(403).json({ success: false, message: "Ada link yang bukan milikmu" });
            return;
        }
        await prisma_1.default.$transaction(links.map(({ id, position }) => prisma_1.default.link.update({
            where: { id },
            data: { position },
        })));
        res.json({ success: true, message: "Urutan berhasil diperbarui" });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.reorderLinks = reorderLinks;
