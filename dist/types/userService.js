"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.findUserByUsername = findUserByUsername;
exports.createUser = createUser;
exports.checkPassword = checkPassword;
exports.sanitizeUser = sanitizeUser;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../config/prisma"));
async function findUserByEmail(email) {
    return prisma_1.default.user.findUnique({ where: { email } });
}
async function findUserByUsername(username) {
    return prisma_1.default.user.findUnique({ where: { username } });
}
async function createUser(input) {
    const { username, name, email, password, bio, avatar, headline } = input;
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    const user = await prisma_1.default.user.create({
        data: { username, name, email, passwordHash, bio, avatar, headline },
    });
    return sanitizeUser(user);
}
async function checkPassword(user, password) {
    return bcrypt_1.default.compare(password, user.passwordHash);
}
function sanitizeUser(user) {
    return {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        headline: user.headline,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
