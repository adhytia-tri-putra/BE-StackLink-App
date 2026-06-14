import "./config/loadEnv";
import "./config/monitoring";
import http, { type IncomingMessage } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import app from "./app";
import prisma from "./config/prisma";
import { getPublicApiUrl, validateRequiredEnv } from "./utils/env";
import { authenticateSocket } from "./utils/wsAuth";
import { subscribeToAnalyticsSocket } from "./services/analyticsEvents";
import { deleteExpiredSessions } from "./services/sessionService";

const PORT = Number(process.env.PORT) || 5000;
validateRequiredEnv();
const publicApiUrl = getPublicApiUrl(PORT);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/api/analytics/socket" });
let isShuttingDown = false;

wss.on("connection", async (socket: WebSocket, request: IncomingMessage) => {
  const url = new URL(request.url ?? "", `http://${request.headers.host}`);
  const token = url.searchParams.get("token");

  if (!token) {
    socket.close(1008, "Unauthorized");
    return;
  }

  try {
    const userId = await authenticateSocket(token);
    subscribeToAnalyticsSocket(userId, socket);
  } catch (error) {
    socket.close(1008, "Unauthorized");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server berjalan di port ${PORT}`);
  console.log(`Healthcheck: ${publicApiUrl}/api/health`);
});

const cleanupTimer = setInterval(() => {
  void Promise.all([
    deleteExpiredSessions(),
    prisma.passwordResetToken.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] } }),
    prisma.emailVerificationToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
  ]).catch((error) => console.error("Token cleanup failed", error));
}, 60 * 60 * 1000);
cleanupTimer.unref();

function shutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  clearInterval(cleanupTimer);
  console.log(`Menerima ${signal}, menutup server...`);

  wss.close();
  server.close(async (error) => {
    await prisma.$disconnect().catch(() => undefined);

    if (error) {
      console.error("Gagal menutup server dengan bersih:", error);
      process.exit(1);
      return;
    }

    console.log("Server berhasil ditutup.");
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
