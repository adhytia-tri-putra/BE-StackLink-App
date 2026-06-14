import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware";
import authRoutes from "./routes/authRoute";
import profileRoutes from "./routes/profileRoute";
import userRoutes from "./routes/userRoute";
import linkRoute from "./routes/link.route";
import publicRoute from "./routes/publicRoute";
import qrRoute from "./routes/qr.route";
import analyticsRoute from "./routes/analytics.route";
import { getAllowedOrigins } from "./utils/env";
import accountRoutes from "./routes/accountRoute";
import prisma from "./config/prisma";
import { requestLogger } from "./middleware/requestLogger";
import billingRoutes from "./routes/billingRoute";

const app = express();
const allowedOrigins = getAllowedOrigins();

app.set("trust proxy", 1);
app.use(requestLogger);
app.use(helmet());

const isLocalhostOrigin = (origin: string) => origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
const isDevTunnelOrigin = (origin: string) => origin.endsWith(".devtunnels.ms") || origin.includes(".devtunnels.ms");

async function isConfiguredCustomDomain(origin: string): Promise<boolean> {
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return Boolean(await prisma.user.findUnique({ where: { customDomain: hostname }, select: { id: true } }));
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (allowedOrigins.some(isLocalhostOrigin) && isLocalhostOrigin(origin)) {
        return callback(null, true);
      }
      if (isDevTunnelOrigin(origin)) {
        return callback(null, true);
      }
      void isConfiguredCustomDomain(origin).then((allowed) => callback(allowed ? null : new Error(`Origin ${origin} not allowed by CORS`), allowed));
    },
  }),
);
app.use(express.json({ limit: "8mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

app.get("/api/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, message: "API and database are ready" });
  } catch {
    res.status(503).json({ success: false, message: "Database is unavailable" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/links", linkRoute);
app.use("/u", publicRoute);
app.use("/api/qr", qrRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/billing", billingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
