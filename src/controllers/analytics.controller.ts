import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import {
  getLinkAnalytics,
  getAnalyticsSummary,
  inferDeviceType,
  inferBrowser,
  inferOperatingSystem,
  normalizeAnalyticsPeriod,
  recordClick,
} from "../services/analytics.service";
import { publishAnalyticsEvent, subscribeToAnalyticsEvents } from "../services/analyticsEvents";

// GET /api/analytics/links/:id
export async function getLinkAnalyticsHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;

    const data = await getLinkAnalytics(id, Number(userId));

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
  } catch (error) {
    return next(error);
  }
}

// GET /api/analytics/summary
export async function getAnalyticsSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const from = typeof req.query.from === "string" ? new Date(req.query.from) : null;
    const to = typeof req.query.to === "string" ? new Date(req.query.to) : null;
    const custom = from && to && !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from <= to;
    if (custom) to.setHours(23, 59, 59, 999);
    const period = custom ? "custom" : normalizeAnalyticsPeriod(req.query.period);
    const data = await getAnalyticsSummary(Number(userId), period, custom ? from : undefined, custom ? to : undefined);

    return res.status(200).json({
      success: true,
      message: "Summary analitik berhasil diambil.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function exportAnalyticsCsvHandler(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const userId = Number(req.user?.sub);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const period = normalizeAnalyticsPeriod(req.query.period);
    const data = await getAnalyticsSummary(userId, period);
    const rows = [
      ["Link", "URL", "Active", "Clicks", "Unique visitors", "Last clicked"],
      ...data.links.map((link) => [link.title, link.url, link.isActive, link.totalClicks, link.uniqueVisitors, link.lastClickedAt]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="stacklink-analytics-${period}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    return next(error);
  }
}

export async function createAnalyticsStreamHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    subscribeToAnalyticsEvents(Number(userId), res);
    return;
  } catch (error) {
    return next(error);
  }
}

// POST /u/:username/links/:id/click
export async function recordClickHandler(
  req: Request<{ username: string; id: string }, unknown, { referrer?: unknown; deviceType?: unknown }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { id } = req.params;

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const userAgent = req.headers["user-agent"] || "unknown";
    const referrer =
      typeof req.body?.referrer === "string"
        ? req.body.referrer.trim()
        : ((req.headers.referer || req.headers.referrer) as string | undefined)?.trim();
    const requestedDeviceType =
      typeof req.body?.deviceType === "string" ? req.body.deviceType.trim() : null;
    const deviceType = requestedDeviceType || inferDeviceType(String(userAgent));

    const link = await prisma.link.findUnique({
      where: { id },
      select: { userId: true },
    });

    const countryHeader = req.headers["cf-ipcountry"] || req.headers["x-vercel-ip-country"] || req.headers["x-country-code"];
    const country = typeof countryHeader === "string" ? countryHeader.trim().toUpperCase().slice(0, 3) : null;
    const click = await recordClick(id, ip, String(userAgent), referrer, deviceType, country, inferBrowser(String(userAgent)), inferOperatingSystem(String(userAgent)));

    if (link?.userId) {
      void publishAnalyticsEvent(link.userId, {
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
  } catch (error) {
    return next(error);
  }
}
