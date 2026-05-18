"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPublicProfileByUsername = findPublicProfileByUsername;
exports.findPublicLinkByIdAndUsername = findPublicLinkByIdAndUsername;
const prisma_1 = __importDefault(require("../config/prisma"));
async function findPublicProfileByUsername(username) {
    return prisma_1.default.user.findUnique({
        where: { username },
        select: {
            username: true,
            name: true,
            bio: true,
            avatar: true,
            headline: true,
            bgType: true,
            bgColor: true,
            bgGradientStart: true,
            bgGradientEnd: true,
            textColor: true,
            buttonColor: true,
            links: {
                where: { isActive: true },
                orderBy: { position: "asc" },
                select: {
                    id: true,
                    title: true,
                    url: true,
                    icon: true,
                    position: true,
                },
            },
        },
    });
}
async function findPublicLinkByIdAndUsername(id, username) {
    return prisma_1.default.link.findFirst({
        where: {
            id,
            isActive: true,
            user: {
                username,
            },
        },
        select: {
            id: true,
            title: true,
            url: true,
            icon: true,
            position: true,
            createdAt: true,
            user: {
                select: {
                    username: true,
                    name: true,
                    avatar: true,
                },
            },
        },
    });
}
