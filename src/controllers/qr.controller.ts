import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { generateQRCode, buildProfileUrl } from "../services/qr.service";

// GET /api/qr/profile
export async function getProfileQR(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { username: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const fallbackBaseUrl = req.get("host")?.includes("localhost")
      ? "http://localhost:5173"
      : `${req.protocol}://${req.get("host")}`;
    const baseUrl = process.env.FRONTEND_URL?.split(",")[0]?.trim() || process.env.BASE_URL || fallbackBaseUrl;
    const profileUrl = buildProfileUrl(baseUrl, user.username);

    const format = req.query.format === "svg" ? "svg" : "base64";
    const width = req.query.width ? Number(req.query.width) : 300;
    const darkColor = typeof req.query.dark === "string" ? req.query.dark : "#000000";
    const lightColor = typeof req.query.light === "string" ? req.query.light : "#ffffff";

    const qr = await generateQRCode(profileUrl, { format, width, darkColor, lightColor });

    if (format === "svg" && req.query.raw === "true") {
      res.setHeader("Content-Type", "image/svg+xml");
      res.send(qr.data);
      return;
    }

    res.status(200).json({
      success: true,
      message: "QR Code profil berhasil dibuat",
      data: {
        username: user.username,
        profileUrl: qr.url,
        format: qr.format,
        qrCode: qr.data,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/qr/links/:id
export async function getLinkQR(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const linkId = typeof req.params.id === "string" ? req.params.id : "";

    const link = await prisma.link.findFirst({
      where: {
        id: linkId,
        userId: Number(userId),
      },
      select: { id: true, title: true, url: true },
    });

    if (!link) {
      res.status(404).json({
        success: false,
        message: "Link tidak ditemukan atau bukan milik Anda",
      });
      return;
    }

    const format = req.query.format === "svg" ? "svg" : "base64";
    const width = req.query.width ? Number(req.query.width) : 300;
    const darkColor = typeof req.query.dark === "string" ? req.query.dark : "#000000";
    const lightColor = typeof req.query.light === "string" ? req.query.light : "#ffffff";

    const qr = await generateQRCode(link.url, { format, width, darkColor, lightColor });

    if (format === "svg" && req.query.raw === "true") {
      res.setHeader("Content-Type", "image/svg+xml");
      res.send(qr.data);
      return;
    }

    res.status(200).json({
      success: true,
      message: "QR Code link berhasil dibuat",
      data: {
        linkId: link.id,
        title: link.title,
        url: link.url,
        format: qr.format,
        qrCode: qr.data,
      },
    });
  } catch (error) {
    next(error);
  }
}
