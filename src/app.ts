import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware";
import authRoutes from "./routes/authRoute";
import profileRoutes from "./routes/profileRoute";
import userRoutes from "./routes/userRoute";
import linkRoute from "./routes/link.route";
import publicRoute from "./routes/publicRoute";
import qrRoute from "./routes/qr.route";
import analyticsRoute from "./routes/analytics.route";

const app = express();
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = frontendUrl ? frontendUrl.split(",").map((origin) => origin.trim()).filter(Boolean) : ["http://localhost:5173", "http://localhost:3000"];

const isLocalhostOrigin = (origin: string) => origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
const isDevTunnelOrigin = (origin: string) => origin.endsWith(".devtunnels.ms") || origin.includes(".devtunnels.ms");

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
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
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

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/links", linkRoute);
app.use("/u", publicRoute);
app.use("/api/qr", qrRoute);
app.use("/api/analytics", analyticsRoute);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
