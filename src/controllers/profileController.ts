import type { NextFunction, Request, Response } from "express";
import { findUserById, sanitizeUser, updateUser } from "../services/userService";
import type { UpdateProfileInput, UpdateThemeInput } from "../types/user";
import prisma from "../config/prisma";

interface ProfileBody {
  name?: unknown;
  bio?: unknown;
  avatar?: unknown;
  headline?: unknown;
}

interface ThemeBody {
  bgType?: unknown;
  bgColor?: unknown;
  bgGradientStart?: unknown;
  bgGradientEnd?: unknown;
  textColor?: unknown;
  buttonColor?: unknown;
}

function sanitizeProfileUpdateInput(body: ProfileBody): UpdateProfileInput {
  const payload: UpdateProfileInput = {};

  if (body.name !== undefined) payload.name = String(body.name).trim();
  if (body.bio !== undefined) payload.bio = body.bio === null ? null : String(body.bio).trim();
  if (body.avatar !== undefined) payload.avatar = body.avatar === null ? null : String(body.avatar).trim();
  if (body.headline !== undefined) payload.headline = body.headline === null ? null : String(body.headline).trim();

  return payload;
}

function sanitizeThemeInput(body: ThemeBody): UpdateThemeInput {
  const payload: UpdateThemeInput = {};

  if (body.bgType !== undefined) payload.bgType = String(body.bgType).trim() as "solid" | "gradient";
  if (body.bgColor !== undefined) payload.bgColor = String(body.bgColor).trim();
  if (body.bgGradientStart !== undefined) payload.bgGradientStart = String(body.bgGradientStart).trim();
  if (body.bgGradientEnd !== undefined) payload.bgGradientEnd = String(body.bgGradientEnd).trim();
  if (body.textColor !== undefined) payload.textColor = String(body.textColor).trim();
  if (body.buttonColor !== undefined) payload.buttonColor = String(body.buttonColor).trim();

  return payload;
}

export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak. Token tidak valid.",
      });
    }

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diambil.",
      data: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMyPreviewProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak. Token tidak valid.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        username: true,
        name: true,
        bio: true,
        avatar: true,
        headline: true,
        bgType: true,
        bgColor: true,
        bgGradientStart: true,
        bgGradientEnd: true,
        textColor: true,
        buttonColor: true,
        links: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            url: true,
            icon: true,
            position: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Preview profile berhasil diambil.",
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateMyProfile(
  req: Request<unknown, unknown, ProfileBody>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak. Token tidak valid.",
      });
    }

    const payload = sanitizeProfileUpdateInput(req.body);

    if (payload.name !== undefined && payload.name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Nama minimal 2 karakter.",
      });
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data profil yang dikirim.",
      });
    }

    const updatedUser = await updateUser(userId, payload);

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui.",
      data: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateTheme(
  req: Request<unknown, unknown, ThemeBody>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak. Token tidak valid.",
      });
    }

    const payload = sanitizeThemeInput(req.body);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data theme yang dikirim.",
      });
    }

    if (payload.bgType && !["solid", "gradient"].includes(payload.bgType)) {
      return res.status(400).json({
        success: false,
        message: "bgType harus 'solid' atau 'gradient'.",
      });
    }

    const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    const colorFields: { key: string; value: string | undefined }[] = [
      { key: "bgColor", value: payload.bgColor },
      { key: "bgGradientStart", value: payload.bgGradientStart },
      { key: "bgGradientEnd", value: payload.bgGradientEnd },
      { key: "textColor", value: payload.textColor },
      { key: "buttonColor", value: payload.buttonColor },
    ];

    for (const { key, value } of colorFields) {
      if (value !== undefined && !hexRegex.test(value)) {
        return res.status(400).json({
          success: false,
          message: `${key} harus format hex yang valid (contoh: #ffffff).`,
        });
      }
    }

    const updatedTheme = await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        ...(payload.bgType && { bgType: payload.bgType }),
        ...(payload.bgColor && { bgColor: payload.bgColor }),
        ...(payload.bgGradientStart && { bgGradientStart: payload.bgGradientStart }),
        ...(payload.bgGradientEnd && { bgGradientEnd: payload.bgGradientEnd }),
        ...(payload.textColor && { textColor: payload.textColor }),
        ...(payload.buttonColor && { buttonColor: payload.buttonColor }),
      },
      select: {
        bgType: true,
        bgColor: true,
        bgGradientStart: true,
        bgGradientEnd: true,
        textColor: true,
        buttonColor: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Theme berhasil diupdate.",
      data: updatedTheme,
    });
  } catch (error) {
    return next(error);
  }
}
