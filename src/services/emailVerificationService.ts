import { createHash, randomBytes } from "node:crypto";
import prisma from "../config/prisma";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerificationToken(userId: number) {
  const token = randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    }),
  ]);
  return token;
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.expiresAt <= new Date()) return false;

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  return true;
}
