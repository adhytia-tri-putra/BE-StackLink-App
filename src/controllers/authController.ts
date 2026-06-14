import type { NextFunction, Request, Response } from "express";
import { createAccessToken } from "../utils/jwt";
import { checkPassword, createUser, findUserByEmail, sanitizeUser } from "../services/userService";
import { createSession, deleteSession } from "../services/sessionService";
import type { LoginInput, RegisterInput } from "../types/auth";
import { createPasswordResetToken, resetPasswordWithToken } from "../services/passwordResetService";
import { sendPasswordResetEmail } from "../services/emailService";
import { getPrimaryFrontendUrl } from "../utils/env";

export async function register(
  req: Request<unknown, unknown, RegisterInput>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { username, name, email, password, bio, avatar, headline } = req.body;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar.",
      });
    }

    const user = await createUser({
      username,
      name,
      email,
      password,
      bio,
      avatar,
      headline,
    });

    return res.status(201).json({
      success: true,
      message: "Register berhasil. Silakan login untuk mendapatkan token.",
      data: {
        user,
      },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Email atau username sudah terdaftar.",
      });
    }

    return next(error);
  }
}

export async function login(
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { email, password } = req.body;

    const userRecord = await findUserByEmail(email);
    if (!userRecord) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah.",
      });
    }

    const isPasswordMatch = await checkPassword(userRecord, password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah.",
      });
    }

    const user = sanitizeUser(userRecord);
    const token = createAccessToken(user);

    // Calculate expiration time (default 1 day)
    const expiresIn = process.env.JWT_EXPIRES_IN || "1d";
    const expirationMs = expiresIn === "1d" ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // 1d or 1h
    const expiresAt = new Date(Date.now() + expirationMs);

    // Save session to database
    await createSession(user.id, token, expiresAt);

    return res.status(200).json({
      success: true,
      message: "Login berhasil.",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Delete session from database
    await deleteSession(token);

    return res.status(200).json({
      success: true,
      message: "Logout berhasil.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function forgotPassword(
  req: Request<unknown, unknown, { email?: unknown }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) {
      return res.status(400).json({ success: false, message: "Email wajib diisi." });
    }

    const user = await findUserByEmail(email);
    let developmentToken: string | undefined;

    if (user) {
      const { token } = await createPasswordResetToken(user.id);
      const resetUrl = `${getPrimaryFrontendUrl().replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
      const sent = await sendPasswordResetEmail(user.email, resetUrl);
      if (!sent && process.env.NODE_ENV !== "production") developmentToken = token;
    }

    return res.status(200).json({
      success: true,
      message: "Jika email terdaftar, instruksi reset password akan dikirim.",
      ...(developmentToken ? { data: { developmentToken } } : {}),
    });
  } catch (error) {
    return next(error);
  }
}

export async function resetPassword(
  req: Request<unknown, unknown, { token?: unknown; password?: unknown }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!token || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Token wajib diisi dan password minimal 8 karakter.",
      });
    }

    const success = await resetPasswordWithToken(token, password);
    if (!success) {
      return res.status(400).json({ success: false, message: "Token reset tidak valid atau sudah kedaluwarsa." });
    }

    return res.status(200).json({ success: true, message: "Password berhasil diperbarui. Silakan login kembali." });
  } catch (error) {
    return next(error);
  }
}
