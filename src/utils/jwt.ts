import jwt, { type SignOptions } from "jsonwebtoken";
import type { AuthTokenPayload } from "../types/auth";
import type { SanitizedUser } from "../types/user";

export function createAccessToken(user: SanitizedUser): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET belum di-set di file .env");
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"];

  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, jwtSecret, { expiresIn });
}
