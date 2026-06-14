import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma";
import { checkPassword, findUserById, sanitizeUser } from "../services/userService";
import { deleteUserSessions } from "../services/sessionService";

function getUserId(req: Request): number | null {
  const userId = Number(req.user?.sub);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

export async function updateAccount(
  req: Request<Record<string, string>, unknown, { email?: unknown; username?: unknown }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Token tidak valid." });

    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : undefined;
    const username = typeof req.body.username === "string" ? req.body.username.trim().toLowerCase() : undefined;
    if (!email && !username) return res.status(400).json({ success: false, message: "Tidak ada perubahan akun." });
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: "Format email tidak valid." });
    if (username && !/^[a-z0-9][a-z0-9_-]{2,29}$/.test(username)) {
      return res.status(400).json({ success: false, message: "Username harus 3-30 karakter dan hanya berisi huruf kecil, angka, _ atau -." });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...(email ? { email } : {}), ...(username ? { username } : {}) },
    });
    return res.status(200).json({ success: true, message: "Akun berhasil diperbarui.", data: sanitizeUser(user) });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return res.status(409).json({ success: false, message: "Email atau username sudah digunakan." });
    }
    return next(error);
  }
}

export async function changePassword(
  req: Request<Record<string, string>, unknown, { currentPassword?: unknown; newPassword?: unknown }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Token tidak valid." });
    const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: "Password baru minimal 8 karakter." });

    const user = await findUserById(userId);
    if (!user || !(await checkPassword(user, currentPassword))) {
      return res.status(400).json({ success: false, message: "Password saat ini salah." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      prisma.session.deleteMany({ where: { userId } }),
    ]);
    return res.status(200).json({ success: true, message: "Password diperbarui. Silakan login kembali." });
  } catch (error) {
    return next(error);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Token tidak valid." });
    await deleteUserSessions(userId);
    return res.status(200).json({ success: true, message: "Semua perangkat berhasil logout." });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAccount(
  req: Request<Record<string, string>, unknown, { password?: unknown }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Token tidak valid." });
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = await findUserById(userId);
    if (!user || !(await checkPassword(user, password))) {
      return res.status(400).json({ success: false, message: "Password salah." });
    }

    await prisma.user.delete({ where: { id: userId } });
    return res.status(200).json({ success: true, message: "Akun berhasil dihapus." });
  } catch (error) {
    return next(error);
  }
}
