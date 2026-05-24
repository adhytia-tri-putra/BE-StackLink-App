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

export async function authenticateSocket(token: string): Promise<number> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET belum di-set di file .env");
  }

  const decoded = jwt.verify(token, jwtSecret);
  const payload = parseTokenPayload(decoded);

  if (!payload) {
    throw new Error("Invalid token payload");
  }

  const session = await findSessionByToken(token);
  if (!session) {
    throw new Error("Session tidak ditemukan atau telah dihapus.");
  }

  if (session.expiresAt < new Date()) {
    throw new Error("Token sudah kedaluwarsa.");
  }

  return payload.sub;
}
