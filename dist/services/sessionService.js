"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.findSessionByToken = findSessionByToken;
exports.deleteSession = deleteSession;
exports.deleteExpiredSessions = deleteExpiredSessions;
exports.deleteUserSessions = deleteUserSessions;
const prisma_1 = __importDefault(require("../config/prisma"));
async function createSession(userId, token, expiresAt) {
    return prisma_1.default.session.create({
        data: {
            userId,
            token,
            expiresAt,
        },
    });
}
async function findSessionByToken(token) {
    return prisma_1.default.session.findUnique({
        where: { token },
        include: { user: true },
    });
}
async function deleteSession(token) {
    return prisma_1.default.session.delete({
        where: { token },
    }).catch(() => null); // Return null if session not found
}
async function deleteExpiredSessions() {
    return prisma_1.default.session.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
    });
}
async function deleteUserSessions(userId) {
    return prisma_1.default.session.deleteMany({
        where: { userId },
    });
}
