import prisma from "../config/prisma";

export async function createSession(userId: number, token: string, expiresAt: Date) {
  return prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

export async function findSessionByToken(token: string) {
  return prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
}

export async function deleteSession(token: string) {
  return prisma.session.delete({
    where: { token },
  }).catch(() => null); // Return null if session not found
}

export async function deleteExpiredSessions() {
  return prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

export async function deleteUserSessions(userId: number) {
  return prisma.session.deleteMany({
    where: { userId },
  });
}
