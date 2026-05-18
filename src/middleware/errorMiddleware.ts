import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response): Response {
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  console.error(err);

  const message = err instanceof Error ? err.message : "Terjadi kesalahan pada server.";

  return res.status(500).json({
    success: false,
    message,
  });
}
