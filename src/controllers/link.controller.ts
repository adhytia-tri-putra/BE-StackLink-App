import type { Request, Response } from "express";
import prisma from "../config/prisma";
import type {
  CreateLinkInput,
  UpdateLinkInput,
  ReorderLinksInput,
  ReorderLinkItem,
} from "../types/link.types";

function normalizeLinkInput(title: unknown, url: unknown) {
  const cleanTitle = typeof title === "string" ? title.trim() : "";
  const cleanUrl = typeof url === "string" ? url.trim() : "";
  if (!cleanTitle || cleanTitle.length > 100) throw new Error("INVALID_TITLE");
  if (cleanUrl.length > 2048) throw new Error("INVALID_URL");
  const parsed = new URL(cleanUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("INVALID_URL");
  return { title: cleanTitle, url: parsed.toString() };
}

// GET /api/links
export const getLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const links = await prisma.link.findMany({
      where: { userId: req.user.sub },
      orderBy: { position: "asc" },
    });

    res.json({ success: true, data: links });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// POST /api/links
export const createLink = async (req: Request, res: Response): Promise<void> => {
  const { title, url, icon, startsAt, endsAt }: CreateLinkInput = req.body;

  if (!title || !url) {
    res.status(400).json({ success: false, message: "Title dan URL wajib diisi" });
    return;
  }

  try {
    const normalized = normalizeLinkInput(title, url);
    const owner = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { plan: true } });
    const freeLimit = Math.max(1, Number(process.env.FREE_LINK_LIMIT || 5));
    const startDate = startsAt ? new Date(startsAt) : null;
    const endDate = endsAt ? new Date(endsAt) : null;
    if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime())) || (startDate && endDate && startDate >= endDate)) throw new Error("INVALID_SCHEDULE");
    const count = await prisma.link.count({
      where: { userId: req.user.sub },
    });
    if (owner?.plan !== "PRO" && count >= freeLimit) {
      res.status(403).json({ success: false, code: "PLAN_LIMIT_REACHED", message: `Paket Free dibatasi ${freeLimit} link. Upgrade ke Pro untuk link tanpa batas.` });
      return;
    }

    const link = await prisma.link.create({
      data: {
        userId: req.user.sub,
        title: normalized.title,
        url: normalized.url,
        icon: icon ?? null,
        position: count,
        startsAt: startDate,
        endsAt: endDate,
      },
    });

    res.status(201).json({ success: true, data: link });
  } catch (err) {
    if ((err as Error).message.startsWith("INVALID_")) {
      res.status(400).json({ success: false, message: "Judul atau URL link tidak valid." });
      return;
    }
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// PUT /api/links/:id
export const updateLink = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { title, url, icon, isActive, startsAt, endsAt }: UpdateLinkInput = req.body;

  try {
    const existing = await prisma.link.findFirst({
      where: { id, userId: req.user.sub },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: "Link tidak ditemukan" });
      return;
    }

    const normalized = title !== undefined || url !== undefined
      ? normalizeLinkInput(title ?? existing.title, url ?? existing.url)
      : null;
    const startDate = startsAt === undefined ? existing.startsAt : startsAt ? new Date(startsAt) : null;
    const endDate = endsAt === undefined ? existing.endsAt : endsAt ? new Date(endsAt) : null;
    if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime())) || (startDate && endDate && startDate >= endDate)) throw new Error("INVALID_SCHEDULE");
    const updated = await prisma.link.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: normalized?.title }),
        ...(url !== undefined && { url: normalized?.url }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
        ...(startsAt !== undefined && { startsAt: startDate }),
        ...(endsAt !== undefined && { endsAt: endDate }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    if ((err as Error).message.startsWith("INVALID_")) {
      res.status(400).json({ success: false, message: "Judul atau URL link tidak valid." });
      return;
    }
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// DELETE /api/links/:id
export const deleteLink = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  try {
    const existing = await prisma.link.findFirst({
      where: { id, userId: req.user.sub },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: "Link tidak ditemukan" });
      return;
    }

    await prisma.link.delete({ where: { id } });

    const remaining = await prisma.link.findMany({
      where: { userId: req.user.sub },
      orderBy: { position: "asc" },
    });

    await Promise.all(
      remaining.map((link, index: number) =>
        prisma.link.update({
          where: { id: link.id },
          data: { position: index },
        })
      )
    );

    res.json({ success: true, message: "Link berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// PATCH /api/links/reorder
export const reorderLinks = async (req: Request, res: Response): Promise<void> => {
  const { links }: ReorderLinksInput = req.body;

  if (!Array.isArray(links) || links.length === 0) {
    res.status(400).json({ success: false, message: "Format links tidak valid" });
    return;
  }

  try {
    const ids = links.map((l: ReorderLinkItem) => l.id);

    const owned = await prisma.link.findMany({
      where: { id: { in: ids }, userId: req.user.sub },
    });

    if (owned.length !== ids.length) {
      res.status(403).json({ success: false, message: "Ada link yang bukan milikmu" });
      return;
    }

    await prisma.$transaction(
      links.map(({ id, position }: ReorderLinkItem) =>
        prisma.link.update({
          where: { id },
          data: { position },
        })
      )
    );

    res.json({ success: true, message: "Urutan berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
