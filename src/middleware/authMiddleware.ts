import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "../types/auth";
import { findSessionByToken } from "../services/sessionService";

function parseTokenPayload(decoded: string | jwt.JwtPayload): AuthTokenPayload | null {
  if (typeof decoded === "string") {
    return null;
  }

  const sub = Number(decoded.sub);
  if (!Number.isInteger(sub) || sub <= 0) {
    return null;
  }

  if (typeof decoded.email !== "string" || typeof decoded.name !== "string") {
    return null;
  }

  return {
    sub,
    email: decoded.email,
    name: decoded.name,
  };
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  const authHeader = req.headers.authorization;
  const queryToken = typeof req.query.token === "string" ? req.query.token : undefined;
  const rawToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : queryToken;

  if (!rawToken) {
    return res.status(401).json({
      success: false,
      message: "Akses ditolak. Token tidak ditemukan atau format tidak sesuai.",
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET belum di-set di file .env");
    }

    const decoded = jwt.verify(rawToken, jwtSecret);
    const payload = parseTokenPayload(decoded);

    if (!payload) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Token tidak valid atau sudah kedaluwarsa.",
      });
    }

    // Verify token exists in database
    const session = await findSessionByToken(rawToken);
    if (!session) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Token tidak ditemukan atau telah dihapus.",
      });
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Token sudah kedaluwarsa.",
      });
    }

    req.user = payload;
    next();
  } catch (_error) {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak. Token tidak valid atau sudah kedaluwarsa.",
    });
  }
}
