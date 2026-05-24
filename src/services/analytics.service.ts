import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

export type AnalyticsPeriod = "7d" | "30d" | "90d";

type ClickRecord = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  referrer: string | null;
  deviceType: string | null;
  clickedAt: Date;
};

type ClickMetadataRow = {
  id: string;
  referrer: string | null;
  device_type: string | null;
};

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function normalizeAnalyticsPeriod(value: unknown): AnalyticsPeriod {
  return value === "7d" || value === "90d" ? value : "30d";
}

export function inferDeviceType(userAgent?: string | null): "Mobile" | "Desktop" | "Tablet" {
  const ua = (userAgent || "").toLowerCase();
  if (/ipad|tablet|kindle|silk|playbook/.test(ua)) return "Tablet";
  if (/mobile|iphone|android|ipod|blackberry|phone/.test(ua)) return "Mobile";
  return "Desktop";
}

function classifyReferrer(referrer?: string | null): string {
  if (!referrer) return "Direct Link";

  try {
    const hostname = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    if (hostname.includes("instagram")) return "Instagram";
    if (hostname.includes("tiktok")) return "TikTok";
    if (hostname.includes("youtube") || hostname.includes("youtu.be")) return "YouTube";
    if (hostname.includes("facebook") || hostname.includes("fb.")) return "Facebook";
    if (hostname.includes("linkedin")) return "LinkedIn";
    if (hostname.includes("twitter") || hostname.includes("x.com")) return "X / Twitter";
    if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) return "Direct Link";
    return hostname;
  } catch {
    return referrer.trim() || "Direct Link";
  }
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatBucketLabel(date: Date, period: AnalyticsPeriod) {
  if (period === "7d") {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function getUniqueVisitorCount(clicks: ClickRecord[]) {
  const visitors = new Set<string>();
  clicks.forEach((click) => {
    visitors.add(click.ip || click.userAgent || click.id);
  });
  return visitors.size;
}

async function getClickMetadata(clickIds: string[]) {
  const uniqueIds = Array.from(new Set(clickIds));
  if (uniqueIds.length === 0) return new Map<string, Pick<ClickRecord, "referrer" | "deviceType">>();

  try {
    const rows = await prisma.$queryRaw<ClickMetadataRow[]>(
      Prisma.sql`SELECT id, referrer, device_type FROM "link_clicks" WHERE id IN (${Prisma.join(uniqueIds)})`
    );

    return new Map(
      rows.map((row) => [
        row.id,
        {
          referrer: row.referrer,
          deviceType: row.device_type,
        },
      ])
    );
  } catch (error) {
    console.warn("Click metadata columns are not available yet.", error);
    return new Map<string, Pick<ClickRecord, "referrer" | "deviceType">>();
  }
}

async function attachClickMetadata<T extends Omit<ClickRecord, "referrer" | "deviceType">>(clicks: T[]) {
  const metadata = await getClickMetadata(clicks.map((click) => click.id));

  return clicks.map((click) => {
    const itemMetadata = metadata.get(click.id);
    return {
      ...click,
      referrer: itemMetadata?.referrer ?? null,
      deviceType: itemMetadata?.deviceType ?? null,
    };
  });
}

function buildTrafficBuckets(clicks: ClickRecord[], period: AnalyticsPeriod, startDate: Date) {
  const days = PERIOD_DAYS[period];
  const buckets = new Map<string, { date: string; label: string; clicks: number; uniqueVisitors: Set<string> }>();

  for (let index = 0; index < days; index += 1) {
    const date = addDays(startDate, index);
    const key = dateKey(date);
    buckets.set(key, {
      date: key,
      label: formatBucketLabel(date, period),
      clicks: 0,
      uniqueVisitors: new Set(),
    });
  }

  clicks.forEach((click) => {
    const key = dateKey(click.clickedAt);
    const bucket = buckets.get(key);
    if (!bucket) return;

    bucket.clicks += 1;
    bucket.uniqueVisitors.add(click.ip || click.userAgent || click.id);
  });

  return Array.from(buckets.values()).map((bucket) => ({
    date: bucket.date,
    label: bucket.label,
    clicks: bucket.clicks,
    uniqueVisitors: bucket.uniqueVisitors.size,
  }));
}

function buildDeviceSplit(clicks: ClickRecord[]) {
  const counts = new Map<string, number>();

  clicks.forEach((click) => {
    const device = click.deviceType || inferDeviceType(click.userAgent);
    counts.set(device, (counts.get(device) || 0) + 1);
  });

  const total = Math.max(clicks.length, 1);
  return ["Mobile", "Desktop", "Tablet"].map((device) => {
    const clicksForDevice = counts.get(device) || 0;
    return {
      device,
      clicks: clicksForDevice,
      percentage: clicks.length > 0 ? Math.round((clicksForDevice / total) * 100) : 0,
    };
  });
}

function buildReferrers(clicks: ClickRecord[]) {
  const counts = new Map<string, number>();

  clicks.forEach((click) => {
    const source = classifyReferrer(click.referrer);
    counts.set(source, (counts.get(source) || 0) + 1);
  });

  const total = Math.max(clicks.length, 1);
  return Array.from(counts.entries())
    .map(([source, clicksForSource]) => ({
      source,
      clicks: clicksForSource,
      percentage: clicks.length > 0 ? Math.round((clicksForSource / total) * 100) : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);
}

export async function recordClick(
  linkId: string,
  ip: string,
  userAgent: string,
  referrer?: string | null,
  deviceType?: string | null
) {
  const click = await prisma.linkClick.create({
    data: {
      linkId,
      ip,
      userAgent,
    },
  });

  try {
    await prisma.$executeRaw(
      Prisma.sql`UPDATE "link_clicks" SET referrer = ${referrer || null}, device_type = ${deviceType || inferDeviceType(userAgent)} WHERE id = ${click.id}`
    );
  } catch (error) {
    console.warn("Click metadata columns are not available yet.", error);
  }

  return click;
}

export async function getLinkAnalytics(linkId: string, userId: number) {
  const link = await prisma.link.findFirst({
    where: { id: linkId, userId },
    select: {
      id: true,
      title: true,
      url: true,
      clicks: {
        orderBy: { clickedAt: "desc" },
        select: {
          id: true,
          ip: true,
          userAgent: true,
          clickedAt: true,
        },
      },
    },
  });

  if (!link) return null;

  const clicks = await attachClickMetadata(link.clicks ?? []);

  return {
    id: link.id,
    title: link.title,
    url: link.url,
    totalClicks: clicks.length,
    uniqueVisitors: getUniqueVisitorCount(clicks),
    clicks,
  };
}

export async function getAnalyticsSummary(userId: number, period: AnalyticsPeriod = "30d") {
  const days = PERIOD_DAYS[period];
  const now = new Date();
  const startDate = startOfDay(addDays(now, -(days - 1)));
  const previousStartDate = startOfDay(addDays(startDate, -days));

  const links = await prisma.link.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      url: true,
      isActive: true,
      clicks: {
        where: {
          clickedAt: {
            gte: previousStartDate,
            lte: now,
          },
        },
        select: {
          id: true,
          ip: true,
          userAgent: true,
          clickedAt: true,
        },
      },
    },
    orderBy: { position: "asc" },
  });

  const currentClicksByLink = new Map<string, ClickRecord[]>();
  const allCurrentClicks: ClickRecord[] = [];
  const allPreviousClicks: ClickRecord[] = [];

  const linkClicksWithMetadata = new Map<string, ClickRecord[]>();

  await Promise.all(
    links.map(async (link) => {
      linkClicksWithMetadata.set(link.id, await attachClickMetadata(link.clicks));
    })
  );

  links.forEach((link) => {
    const linkClicks = linkClicksWithMetadata.get(link.id) ?? [];
    const currentClicks = linkClicks.filter((click) => click.clickedAt >= startDate && click.clickedAt <= now);
    const previousClicks = linkClicks.filter((click) => click.clickedAt >= previousStartDate && click.clickedAt < startDate);

    currentClicksByLink.set(link.id, currentClicks);
    allCurrentClicks.push(...currentClicks);
    allPreviousClicks.push(...previousClicks);
  });

  const totalClicks = allCurrentClicks.length;
  const previousTotalClicks = allPreviousClicks.length;
  const totalUniqueVisitors = getUniqueVisitorCount(allCurrentClicks);
  const previousUniqueVisitors = getUniqueVisitorCount(allPreviousClicks);
  const avgCtr = totalUniqueVisitors > 0 ? (totalClicks / totalUniqueVisitors) * 100 : 0;
  const previousAvgCtr = previousUniqueVisitors > 0 ? (previousTotalClicks / previousUniqueVisitors) * 100 : 0;

  const summary = links.map((link) => {
    const clicks = currentClicksByLink.get(link.id) ?? [];
    const sorted = [...clicks].sort(
      (a, b) => new Date(b.clickedAt).getTime() - new Date(a.clickedAt).getTime()
    );

    return {
      id: link.id,
      title: link.title,
      url: link.url,
      isActive: link.isActive,
      totalClicks: clicks.length,
      uniqueVisitors: getUniqueVisitorCount(clicks),
      lastClickedAt: sorted.length > 0 ? sorted[0].clickedAt : null,
    };
  });

  return {
    period,
    range: {
      from: startDate,
      to: now,
      previousFrom: previousStartDate,
      previousTo: startDate,
    },
    totalClicks,
    previousTotalClicks,
    totalLinks: links.length,
    activeLinks: links.filter((link) => link.isActive).length,
    totalUniqueVisitors,
    previousUniqueVisitors,
    avgCtr,
    previousAvgCtr,
    changes: {
      clicks: percentageChange(totalClicks, previousTotalClicks),
      uniqueVisitors: percentageChange(totalUniqueVisitors, previousUniqueVisitors),
      avgCtr: percentageChange(avgCtr, previousAvgCtr),
    },
    links: summary,
    traffic: buildTrafficBuckets(allCurrentClicks, period, startDate),
    deviceSplit: buildDeviceSplit(allCurrentClicks),
    referrers: buildReferrers(allCurrentClicks),
  };
}
