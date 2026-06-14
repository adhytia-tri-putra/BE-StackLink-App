import "dotenv/config";
import http, { type IncomingMessage } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import app from "./app";
import prisma from "./config/prisma";
import { getPublicApiUrl, validateRequiredEnv } from "./utils/env";
import { authenticateSocket } from "./utils/wsAuth";
import { subscribeToAnalyticsSocket } from "./services/analyticsEvents";

const PORT = Number(process.env.PORT) || 8080;
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

function shutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
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
