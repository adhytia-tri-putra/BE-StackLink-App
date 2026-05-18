"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const app_1 = __importDefault(require("./app"));
const wsAuth_1 = require("./utils/wsAuth");
const analyticsEvents_1 = require("./services/analyticsEvents");
const portValue = process.env.PORT || "5000";
const PORT = Number(portValue);
const server = http_1.default.createServer(app_1.default);
const wss = new ws_1.WebSocketServer({ server, path: "/api/analytics/socket" });
wss.on("connection", async (socket, request) => {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const token = url.searchParams.get("token");
    if (!token) {
        socket.close(1008, "Unauthorized");
        return;
    }
    try {
        const userId = await (0, wsAuth_1.authenticateSocket)(token);
        (0, analyticsEvents_1.subscribeToAnalyticsSocket)(userId, socket);
    }
    catch (error) {
        socket.close(1008, "Unauthorized");
    }
});
server.listen(PORT, () => {
    console.log(`Auth server berjalan di http://localhost:${PORT}`);
});
