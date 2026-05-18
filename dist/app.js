"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const authRoute_1 = __importDefault(require("./routes/authRoute"));
const profileRoute_1 = __importDefault(require("./routes/profileRoute"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const link_route_1 = __importDefault(require("./routes/link.route"));
const publicRoute_1 = __importDefault(require("./routes/publicRoute"));
const qr_route_1 = __importDefault(require("./routes/qr.route"));
const analytics_route_1 = __importDefault(require("./routes/analytics.route"));
const app = (0, express_1.default)();
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = frontendUrl ? frontendUrl.split(",").map((origin) => origin.trim()).filter(Boolean) : ["http://localhost:5173", "http://localhost:3000"];
const isLocalhostOrigin = (origin) => origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
const isDevTunnelOrigin = (origin) => origin.endsWith(".devtunnels.ms") || origin.includes(".devtunnels.ms");
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
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
}));
app.use(express_1.default.json({ limit: "8mb" }));
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API is running",
    });
});
app.use("/api/auth", authRoute_1.default);
app.use("/api/users", userRoute_1.default);
app.use("/api/profiles", profileRoute_1.default);
app.use("/api/links", link_route_1.default);
app.use("/u", publicRoute_1.default);
app.use("/api/qr", qr_route_1.default);
app.use("/api/analytics", analytics_route_1.default);
app.use(errorMiddleware_1.notFoundHandler);
app.use(errorMiddleware_1.errorHandler);
exports.default = app;
