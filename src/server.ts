import "dotenv/config";
import http, { type IncomingMessage } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import app from "./app";
import { authenticateSocket } from "./utils/wsAuth";
import { subscribeToAnalyticsSocket } from "./services/analyticsEvents";

const portValue = process.env.PORT || "5000";
const PORT = Number(portValue);

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/api/analytics/socket" });

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

server.listen(PORT, () => {
  console.log(`Auth server berjalan di http://localhost:${PORT}`);
});
