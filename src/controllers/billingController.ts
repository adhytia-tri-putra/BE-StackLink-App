import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";

export async function getBillingStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.user?.sub) }, select: { plan: true, planStatus: true, _count: { select: { links: true } } } });
    if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan." });
    const freeLimit = Math.max(1, Number(process.env.FREE_LINK_LIMIT || 5));
    return res.json({ success: true, data: { plan: user.plan, status: user.planStatus, usage: { links: user._count.links, limit: user.plan === "PRO" ? null : freeLimit }, checkoutConfigured: Boolean(process.env.BILLING_CHECKOUT_URL?.trim()) } });
  } catch (error) {
    return next(error);
  }
}

export async function createCheckout(req: Request, res: Response): Promise<Response> {
  const checkoutUrl = process.env.BILLING_CHECKOUT_URL?.trim();
  if (!checkoutUrl) return res.status(503).json({ success: false, message: "Provider pembayaran belum dikonfigurasi." });
  const url = new URL(checkoutUrl);
  url.searchParams.set("client_reference_id", String(req.user?.sub));
  return res.json({ success: true, data: { url: url.toString() } });
}
