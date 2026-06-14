import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  const user = await prisma.user.findUnique({ where: { id: Number(req.user?.sub) }, select: { role: true, suspendedAt: true } });
  if (!user || user.role !== "ADMIN" || user.suspendedAt) return res.status(403).json({ success: false, message: "Akses admin diperlukan." });
  next();
}
