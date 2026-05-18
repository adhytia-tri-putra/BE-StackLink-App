import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import prisma from "../config/prisma";
import type { RegisterInput } from "../types/auth";
import type { SanitizedUser, UpdateProfileInput } from "../types/user";

export function sanitizeUser(user: User): SanitizedUser {
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

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function findUserById(id: number): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function findUserByUsername(username: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function createUser({
  username,
  name,
  email,
  password,
  bio,
  avatar,
  headline,
}: RegisterInput): Promise<SanitizedUser> {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
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

export async function updateUser(
  id: number,
  updateData: UpdateProfileInput,
): Promise<SanitizedUser> {
  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return sanitizeUser(user);
}

export async function checkPassword(user: User, plainPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, user.passwordHash);
}

export async function findAllUsers(): Promise<SanitizedUser[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return users.map(sanitizeUser);
}
