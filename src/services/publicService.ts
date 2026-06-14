import prisma from "../config/prisma";

export async function findPublicProfileByUsername(username: string) {
  return prisma.user.findFirst({
    where: { username, suspendedAt: null },
    select: {
      username: true,
      name: true,
      bio: true,
      avatar: true,
      headline: true,
      bgType: true,
      bgColor: true,
      bgGradientStart: true,
      bgGradientEnd: true,
      textColor: true,
      buttonColor: true,
      seoTitle: true,
      seoDescription: true,
      socialImage: true,
      customDomain: true,
      googleAnalyticsId: true,
      metaPixelId: true,
      tiktokPixelId: true,
      links: {
        where: {
          isActive: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
            { OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
          ],
        },
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          url: true,
          icon: true,
          position: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
  });
}

export async function findPublicProfileByDomain(domain: string) {
  const user = await prisma.user.findFirst({ where: { customDomain: domain.toLowerCase(), suspendedAt: null }, select: { username: true } });
  return user ? findPublicProfileByUsername(user.username) : null;
}

export async function findPublicLinkByIdAndUsername(id: string, username: string) {
  return prisma.link.findFirst({
    where: {
      id,
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
      ],
      user: {
        username,
      },
    },
    select: {
      id: true,
      title: true,
      url: true,
      icon: true,
      position: true,
      createdAt: true,
      user: {
        select: {
          username: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
}
