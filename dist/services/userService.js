"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUser = sanitizeUser;
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.findUserByUsername = findUserByUsername;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.checkPassword = checkPassword;
exports.findAllUsers = findAllUsers;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../config/prisma"));
function sanitizeUser(user) {
    return {
        id: user.id,
        userId: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        profile: {
            id: `profile-${user.id}`,
            bio: user.bio || null,
            avatar: user.avatar || null,
            headline: user.headline || null,
        },
        bgType: user.bgType,
        bgColor: user.bgColor,
        bgGradientStart: user.bgGradientStart,
        bgGradientEnd: user.bgGradientEnd,
        textColor: user.textColor,
        buttonColor: user.buttonColor,
        createdAt: user.createdAt.toISOString(),
    };
}
async function findUserByEmail(email) {
    return prisma_1.default.user.findUnique({
        where: { email: email.toLowerCase() },
    });
}
async function findUserById(id) {
    return prisma_1.default.user.findUnique({
        where: { id },
    });
}
async function findUserByUsername(username) {
    return prisma_1.default.user.findUnique({
        where: { username },
    });
}
async function createUser({ username, name, email, password, bio, avatar, headline, }) {
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.default.user.create({
        data: {
            username,
            name,
            email: email.toLowerCase(),
            passwordHash,
            bio,
            avatar,
            headline,
        },
    });
    return sanitizeUser(user);
}
async function updateUser(id, updateData) {
    const user = await prisma_1.default.user.update({
        where: { id },
        data: updateData,
    });
    return sanitizeUser(user);
}
async function checkPassword(user, plainPassword) {
    return bcryptjs_1.default.compare(plainPassword, user.passwordHash);
}
async function findAllUsers() {
    const users = await prisma_1.default.user.findMany({
        orderBy: { createdAt: "desc" },
    });
    return users.map(sanitizeUser);
}
