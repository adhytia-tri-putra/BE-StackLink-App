import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma";

const RESET_TOKEN_LIFETIME_MS = 30 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_LIFETIME_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    }),
  ]);

  return { token, expiresAt };
}

export async function resetPasswordWithToken(token: string, password: string): Promise<boolean> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) return false;

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  return true;
}
