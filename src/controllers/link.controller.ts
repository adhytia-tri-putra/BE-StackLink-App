import type { Request, Response } from "express";
import prisma from "../config/prisma";
import type {
  CreateLinkInput,
  UpdateLinkInput,
  ReorderLinksInput,
  ReorderLinkItem,
} from "../types/link.types";

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
  const { title, url, icon }: CreateLinkInput = req.body;

  if (!title || !url) {
    res.status(400).json({ success: false, message: "Title dan URL wajib diisi" });
    return;
  }

  try {
    const count = await prisma.link.count({
      where: { userId: req.user.sub },
    });

    const link = await prisma.link.create({
      data: {
        userId: req.user.sub,
        title,
        url,
        icon: icon ?? null,
        position: count,
      },
    });

    res.status(201).json({ success: true, data: link });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// PUT /api/links/:id
export const updateLink = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { title, url, icon, isActive }: UpdateLinkInput = req.body;

  try {
    const existing = await prisma.link.findFirst({
      where: { id, userId: req.user.sub },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: "Link tidak ditemukan" });
      return;
    }

    const updated = await prisma.link.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(url !== undefined && { url }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
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