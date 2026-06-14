import rateLimit from "express-rate-limit";

const response = { success: false, message: "Terlalu banyak permintaan. Coba lagi beberapa saat." };

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: response,
});

export const clickRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: response,
});
