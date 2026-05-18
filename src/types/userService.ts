import bcrypt from "bcrypt";
import prisma from "../config/prisma";
import type { RegisterInput } from "../types/auth";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export async function createUser(input: RegisterInput) {
  const { username, name, email, password, bio, avatar, headline } = input;
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, name, email, passwordHash, bio, avatar, headline },
  });

  return sanitizeUser(user);
}

export async function checkPassword(
  user: { passwordHash: string },
  password: string,
) {
  return bcrypt.compare(password, user.passwordHash);
}

export function sanitizeUser(user: {
  id: number;
  username: string;
  name: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  headline: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
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