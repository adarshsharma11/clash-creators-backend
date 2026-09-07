import { Prisma, SocialPlatform } from '../generated/prisma';
import { db } from '../utils/db.server';
import { forbidden, notFound } from '../utils/AppError';
import { buildPagination, getPagination } from '../utils/pagination';
import { TCreatorClashQuery, TCreatorQuery } from '../types/creator';
import { TPaginationQuery } from '../types/common';

const publicUserSelect = {
  username: true,
  fullName: true,
  avatarUrl: true,
} as const;

const publicCreatorInclude = {
  user: { select: publicUserSelect },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
    },
  },
  socialAccounts: {
    select: {
      platform: true,
      username: true,
      displayName: true,
      profileUrl: true,
      isPrimary: true,
      isVerified: true,
    },
    orderBy: { isPrimary: 'desc' as const },
  },
};

const findCreatorByUsername = async (username: string) => {
  const creator = await db.creatorProfile.findFirst({
    where: {
      user: { username },
    },
    include: publicCreatorInclude,
  });

  if (!creator) {
    throw notFound('Creator not found', 'CREATOR_NOT_FOUND');
  }

  return creator;
};

const getSupportTotals = async (creatorIds: string[]) => {
  if (creatorIds.length === 0) {
    return new Map<string, { points: number; count: number }>();
  }

  const rows = await db.support.groupBy({
    by: ['creatorId'],
    where: {
      creatorId: { in: creatorIds },
      status: 'CONFIRMED',
    },
    _sum: { points: true },
    _count: { _all: true },
  });

  return new Map(rows.map((row) => [row.creatorId, { points: row._sum.points ?? 0, count: row._count._all }]));
};

const getWinCounts = async (creatorIds: string[]) => {
  if (creatorIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await db.winner.groupBy({
    by: ['creatorId'],
    where: { creatorId: { in: creatorIds } },
    _count: { _all: true },
  });

  return new Map(rows.map((row) => [row.creatorId, row._count._all]));
};

export const listCreators = async (query: TCreatorQuery) => {
  const { page, limit, skip, take } = getPagination(query);
  const where: Prisma.CreatorProfileWhereInput = {
    status: query.status ?? 'ACTIVE',
    category: query.category ? { slug: query.category } : undefined,
    OR: query.search
      ? [
          { displayName: { contains: query.search, mode: 'insensitive' } },
          { user: { username: { contains: query.search, mode: 'insensitive' } } },
          { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
        ]
      : undefined,
  };

  const [creators, total] = await db.$transaction([
    db.creatorProfile.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: publicCreatorInclude,
    }),
    db.creatorProfile.count({ where }),
  ]);

  const creatorIds = creators.map((creator) => creator.id);
  const [supportTotals, winCounts, clashCounts] = await Promise.all([
    getSupportTotals(creatorIds),
    getWinCounts(creatorIds),
    db.clashParticipant.groupBy({
      by: ['creatorId'],
      where: { creatorId: { in: creatorIds } },
      _count: { _all: true },
    }),
  ]);
  const clashCountByCreator = new Map(clashCounts.map((row) => [row.creatorId, row._count._all]));

  return {
    items: creators.map((creator) => ({
      id: creator.id,
      username: creator.user.username,
      fullName: creator.user.fullName,
      displayName: creator.displayName,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl ?? creator.user.avatarUrl,
      status: creator.status,
      category: creator.category,
      socialAccounts: creator.socialAccounts,
      supportTotals: {
        points: supportTotals.get(creator.id)?.points ?? 0,
        count: supportTotals.get(creator.id)?.count ?? 0,
      },
      clashStatistics: {
        clashes: clashCountByCreator.get(creator.id) ?? 0,
        wins: winCounts.get(creator.id) ?? 0,
      },
    })),
    pagination: buildPagination(page, limit, total),
  };
};

export const getCreatorByUsername = async (username: string) => {
  const creator = await findCreatorByUsername(username);
  const [supportTotals, winCounts, liveClash, recentClashes, achievements] = await Promise.all([
    getSupportTotals([creator.id]),
    getWinCounts([creator.id]),
    db.clashParticipant.findFirst({
      where: { creatorId: creator.id, clash: { status: 'LIVE' } },
      include: {
        clash: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            startsAt: true,
            endsAt: true,
          },
        },
      },
    }),
    db.clashParticipant.findMany({
      where: { creatorId: creator.id },
      take: 5,
      orderBy: { joinedAt: 'desc' },
      include: {
        clash: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            startsAt: true,
            endsAt: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
    }),
    db.creatorAchievement.findMany({
      where: { creatorId: creator.id },
      orderBy: { earnedAt: 'desc' },
      include: {
        achievement: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            icon: true,
          },
        },
      },
    }),
  ]);

  return {
    id: creator.id,
    displayName: creator.displayName,
    bio: creator.bio,
    avatarUrl: creator.avatarUrl ?? creator.user.avatarUrl,
    status: creator.status,
    user: creator.user,
    category: creator.category,
    socialAccounts: creator.socialAccounts,
    supportTotals: {
      points: supportTotals.get(creator.id)?.points ?? 0,
      count: supportTotals.get(creator.id)?.count ?? 0,
    },
    clashStatistics: {
      wins: winCounts.get(creator.id) ?? 0,
    },
    currentClash: liveClash?.clash ?? null,
    recentClashes: recentClashes.map((participant) => participant.clash),
    achievements: achievements.map((item) => ({
      ...item.achievement,
      earnedAt: item.earnedAt,
    })),
    wins: winCounts.get(creator.id) ?? 0,
  };
};

export const getCreatorClashes = async (username: string, query: TCreatorClashQuery) => {
  const creator = await findCreatorByUsername(username);
  const { page, limit, skip, take } = getPagination(query);
  const where: Prisma.ClashParticipantWhereInput = {
    creatorId: creator.id,
    clash: query.status ? { status: query.status } : undefined,
  };

  const [participants, total] = await db.$transaction([
    db.clashParticipant.findMany({
      where,
      skip,
      take,
      orderBy: { joinedAt: 'desc' },
      include: {
        clash: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            winners: {
              where: { creatorId: creator.id },
              select: { rank: true, points: true },
            },
          },
        },
      },
    }),
    db.clashParticipant.count({ where }),
  ]);

  const clashIds = participants.map((participant) => participant.clashId);
  const supportRows =
    clashIds.length === 0
      ? []
      : await db.support.groupBy({
          by: ['clashId'],
          where: {
            creatorId: creator.id,
            clashId: { in: clashIds },
            status: 'CONFIRMED',
          },
          _sum: { points: true },
        });
  const pointsByClash = new Map(supportRows.map((row) => [row.clashId, row._sum.points ?? 0]));

  return {
    items: participants.map((participant) => ({
      joinedAt: participant.joinedAt,
      clash: {
        id: participant.clash.id,
        title: participant.clash.title,
        slug: participant.clash.slug,
        status: participant.clash.status,
        startsAt: participant.clash.startsAt,
        endsAt: participant.clash.endsAt,
        category: participant.clash.category,
      },
      supportPoints: pointsByClash.get(participant.clashId) ?? 0,
      finalRank: participant.clash.winners[0]?.rank ?? null,
    })),
    pagination: buildPagination(page, limit, total),
  };
};

export const getCreatorSupporters = async (username: string, query: TPaginationQuery) => {
  const creator = await findCreatorByUsername(username);
  const { page, limit, skip, take } = getPagination(query);

  const grouped = await db.support.groupBy({
    by: ['supporterId'],
    where: {
      creatorId: creator.id,
      status: 'CONFIRMED',
    },
    _sum: { points: true },
    _count: { _all: true },
    orderBy: { _sum: { points: 'desc' } },
  });

  const total = grouped.length;
  const pageGroups = grouped.slice(skip, skip + take);
  const users = await db.user.findMany({
    where: { id: { in: pageGroups.map((row) => row.supporterId) } },
    select: { id: true, ...publicUserSelect },
  });
  const userById = new Map(users.map((user) => [user.id, user]));

  return {
    items: pageGroups.map((row) => ({
      username: userById.get(row.supporterId)?.username ?? null,
      fullName: userById.get(row.supporterId)?.fullName ?? null,
      avatarUrl: userById.get(row.supporterId)?.avatarUrl ?? null,
      points: row._sum.points ?? 0,
      supportCount: row._count._all,
    })),
    pagination: buildPagination(page, limit, total),
  };
};

export const getCreatorSupports = async (username: string, query: TPaginationQuery) => {
  const creator = await findCreatorByUsername(username);
  const { page, limit, skip, take } = getPagination(query);
  const where: Prisma.SupportWhereInput = {
    creatorId: creator.id,
    status: 'CONFIRMED',
  };

  const [supports, total] = await db.$transaction([
    db.support.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        points: true,
        createdAt: true,
        clash: {
          select: { id: true, title: true, slug: true, status: true },
        },
        supporter: {
          select: publicUserSelect,
        },
      },
    }),
    db.support.count({ where }),
  ]);

  return {
    items: supports,
    pagination: buildPagination(page, limit, total),
  };
};

export const updateOwnCreatorProfile = async (
  userId: string,
  input: {
    displayName?: string;
    bio?: string | null;
    avatarUrl?: string | null;
    categoryId?: string | null;
  }
) => {
  const creator = await db.creatorProfile.findUnique({
    where: { userId },
    include: { user: { select: { username: true } } },
  });
  if (!creator) {
    throw notFound('Creator not found', 'CREATOR_NOT_FOUND');
  }

  if (input.categoryId) {
    const category = await db.category.findUnique({ where: { id: input.categoryId } });
    if (!category) {
      throw notFound('Category not found');
    }
  }

  await db.creatorProfile.update({
    where: { id: creator.id },
    data: {
      displayName: input.displayName,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      categoryId: input.categoryId,
    },
  });

  return getCreatorByUsername(creator.user.username);
};

export const upsertOwnSocialAccount = async (
  userId: string,
  input: {
    platform: SocialPlatform;
    username?: string | null;
    displayName?: string | null;
    profileUrl: string;
    isPrimary?: boolean;
  }
) => {
  const creator = await db.creatorProfile.findUnique({ where: { userId } });
  if (!creator) {
    throw notFound('Creator not found', 'CREATOR_NOT_FOUND');
  }
  if (creator.status === 'SUSPENDED') {
    throw forbidden('Suspended creators cannot update social accounts');
  }

  return db.creatorSocialAccount.upsert({
    where: {
      creatorId_platform: {
        creatorId: creator.id,
        platform: input.platform,
      },
    },
    create: {
      creatorId: creator.id,
      platform: input.platform,
      username: input.username,
      displayName: input.displayName,
      profileUrl: input.profileUrl,
      isPrimary: input.isPrimary ?? false,
    },
    update: {
      username: input.username,
      displayName: input.displayName,
      profileUrl: input.profileUrl,
      isPrimary: input.isPrimary,
    },
    select: {
      platform: true,
      username: true,
      displayName: true,
      profileUrl: true,
      isPrimary: true,
      isVerified: true,
    },
  });
};

