import type { NextFunction, Request, Response } from "express";
import { findPublicProfileByDomain, findPublicProfileByUsername, findPublicLinkByIdAndUsername } from "../services/publicService";
import prisma from "../config/prisma";

export async function getPublicProfile(
  req: Request<{ username: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { username } = req.params;

    const profile = await findPublicProfileByUsername(username);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diambil.",
      data: profile,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getPublicProfileByDomain(req: Request<{ domain: string }>, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const profile = await findPublicProfileByDomain(req.params.domain);
    if (!profile) return res.status(404).json({ success: false, message: "Domain belum terhubung." });
    return res.status(200).json({ success: true, message: "Profil berhasil diambil.", data: profile });
  } catch (error) {
    return next(error);
  }
}

export async function getPublicLink(
  req: Request<{ username: string; id: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { username, id } = req.params;

    const link = await findPublicLinkByIdAndUsername(id, username);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Link tidak ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Link berhasil diambil.",
      data: link,
    });
  } catch (error) {
    return next(error);
  }
}

export async function reportPublicProfile(req: Request<{ username: string }, unknown, { reason?: unknown; details?: unknown }>, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username }, select: { id: true } });
    if (!user) return res.status(404).json({ success: false, message: "Profil tidak ditemukan." });
    const reason = typeof req.body.reason === "string" ? req.body.reason.trim().slice(0, 80) : "";
    const details = typeof req.body.details === "string" ? req.body.details.trim().slice(0, 500) : null;
    if (!reason) return res.status(400).json({ success: false, message: "Alasan laporan wajib diisi." });
    await prisma.abuseReport.create({ data: { userId: user.id, reason, details } });
    return res.status(201).json({ success: true, message: "Laporan diterima." });
  } catch (error) { return next(error); }
}
