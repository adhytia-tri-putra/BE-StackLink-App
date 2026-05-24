import type { NextFunction, Request, Response } from "express";
import { findPublicProfileByUsername, findPublicLinkByIdAndUsername } from "../services/publicService";

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