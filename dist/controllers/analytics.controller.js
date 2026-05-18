"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkAnalyticsHandler = getLinkAnalyticsHandler;
exports.getAnalyticsSummaryHandler = getAnalyticsSummaryHandler;
exports.createAnalyticsStreamHandler = createAnalyticsStreamHandler;
exports.recordClickHandler = recordClickHandler;
const prisma_1 = __importDefault(require("../config/prisma"));
const analytics_service_1 = require("../services/analytics.service");
const analyticsEvents_1 = require("../services/analyticsEvents");
// GET /api/analytics/links/:id
async function getLinkAnalyticsHandler(req, res, next) {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { id } = req.params;
        const data = await (0, analytics_service_1.getLinkAnalytics)(id, Number(userId));
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Link tidak ditemukan atau bukan milik Anda.",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Analitik link berhasil diambil.",
            data,
        });
    }
    catch (error) {
        return next(error);
    }
}
// GET /api/analytics/summary
async function getAnalyticsSummaryHandler(req, res, next) {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const period = (0, analytics_service_1.normalizeAnalyticsPeriod)(req.query.period);
        const data = await (0, analytics_service_1.getAnalyticsSummary)(Number(userId), period);
        return res.status(200).json({
            success: true,
            message: "Summary analitik berhasil diambil.",
            data,
        });
    }
    catch (error) {
        return next(error);
    }
}
async function createAnalyticsStreamHandler(req, res, next) {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        (0, analyticsEvents_1.subscribeToAnalyticsEvents)(Number(userId), res);
        return;
    }
    catch (error) {
        return next(error);
    }
}
// POST /u/:username/links/:id/click
async function recordClickHandler(req, res, next) {
    try {
        const { id } = req.params;
        const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
            req.socket.remoteAddress ||
            "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";
        const referrer = typeof req.body?.referrer === "string"
            ? req.body.referrer.trim()
            : (req.headers.referer || req.headers.referrer)?.trim();
        const requestedDeviceType = typeof req.body?.deviceType === "string" ? req.body.deviceType.trim() : null;
        const deviceType = requestedDeviceType || (0, analytics_service_1.inferDeviceType)(String(userAgent));
        const link = await prisma_1.default.link.findUnique({
            where: { id },
            select: { userId: true },
        });
        const click = await (0, analytics_service_1.recordClick)(id, ip, String(userAgent), referrer, deviceType);
        if (link?.userId) {
            (0, analyticsEvents_1.publishAnalyticsEvent)(link.userId, {
                linkId: id,
                referrer,
                deviceType,
                clickedAt: click.clickedAt?.toISOString?.() ?? new Date().toISOString(),
            });
        }
        return res.status(200).json({
            success: true,
            message: "Klik berhasil direcord.",
        });
    }
    catch (error) {
        return next(error);
    }
}
