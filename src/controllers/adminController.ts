import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";

export async function getAdminOverview(_req: Request, res: Response, next: NextFunction) {
  try {
    const [users, links, openReports] = await Promise.all([prisma.user.count(), prisma.link.count(), prisma.abuseReport.count({ where: { status: "OPEN" } })]);
    const recentUsers = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, username: true, name: true, email: true, plan: true, role: true, suspendedAt: true, createdAt: true, _count: { select: { links: true, reports: true } } } });
    const reports = await prisma.abuseReport.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { username: true, name: true } } } });
    return res.json({ success: true, data: { totals: { users, links, openReports }, users: recentUsers, reports } });
  } catch (error) { return next(error); }
}

export async function updateAdminUser(req: Request<{ id: string }, unknown, { plan?: unknown; suspended?: unknown }>, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const plan = req.body.plan === "FREE" || req.body.plan === "PRO" ? req.body.plan : undefined;
    const suspendedAt = typeof req.body.suspended === "boolean" ? req.body.suspended ? new Date() : null : undefined;
    if (!id || (plan === undefined && suspendedAt === undefined)) return res.status(400).json({ success: false, message: "Perubahan tidak valid." });
    const user = await prisma.user.update({ where: { id }, data: { ...(plan && { plan }), ...(suspendedAt !== undefined && { suspendedAt }) }, select: { id: true, plan: true, suspendedAt: true } });
    if (suspendedAt) await prisma.session.deleteMany({ where: { userId: id } });
    return res.json({ success: true, data: user });
  } catch (error) { return next(error); }
}

export async function resolveReport(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try { const report = await prisma.abuseReport.update({ where: { id: req.params.id }, data: { status: "RESOLVED" } }); return res.json({ success: true, data: report }); }
  catch (error) { return next(error); }
}
