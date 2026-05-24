import prisma from "../config/prisma";

export async function findPublicProfileByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
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
      links: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          url: true,
          icon: true,
          position: true,
        },
      },
    },
  });
}

export async function findPublicLinkByIdAndUsername(id: string, username: string) {
  return prisma.link.findFirst({
    where: {
      id,
      isActive: true,
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