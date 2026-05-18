import type { NextFunction, Request, Response } from "express";
import { createAccessToken } from "../utils/jwt";
import { checkPassword, createUser, findUserByEmail, sanitizeUser } from "../services/userService";
import { createSession, deleteSession } from "../services/sessionService";
import type { LoginInput, RegisterInput } from "../types/auth";

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