import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import {
  getLinkAnalytics,
  getAnalyticsSummary,
  inferDeviceType,
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

    const period = normalizeAnalyticsPeriod(req.query.period);
    const data = await getAnalyticsSummary(Number(userId), period);

    return res.status(200).json({
      success: true,
      message: "Summary analitik berhasil diambil.",
      data,
    });
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

    const click = await recordClick(id, ip, String(userAgent), referrer, deviceType);

    if (link?.userId) {
      publishAnalyticsEvent(link.userId, {
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
