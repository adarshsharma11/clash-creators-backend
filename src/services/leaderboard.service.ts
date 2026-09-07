import { db } from '../utils/db.server';
import { rankLeaderboard, RankedLeaderboardRow } from '../domain/leaderboard';
import { buildPagination, getPagination } from '../utils/pagination';
import { TPaginationQuery } from '../types/common';

const publicCreatorSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  status: true,
  user: {
    select: {
      username: true,
      fullName: true,
      avatarUrl: true,
    },
  },
} as const;

export const getClashLeaderboardRows = async (clashId: string): Promise<RankedLeaderboardRow[]> => {
  const participants = await db.clashParticipant.findMany({
    where: { clashId },
    select: {
      creatorId: true,
      joinedAt: true,
    },
  });

  if (participants.length === 0) {
    return [];
  }

  const aggregates = await db.support.groupBy({
    by: ['creatorId'],
    where: {
      clashId,
      status: 'CONFIRMED',
      creatorId: { in: participants.map((participant) => participant.creatorId) },
    },
    _sum: { points: true },
    _count: { _all: true },
    _min: { createdAt: true },
  });

  const aggregateByCreator = new Map(aggregates.map((row) => [row.creatorId, row]));

  return rankLeaderboard(
    participants.map((participant) => {
      const aggregate = aggregateByCreator.get(participant.creatorId);
      return {
        creatorId: participant.creatorId,
        points: aggregate?._sum.points ?? 0,
        supportCount: aggregate?._count._all ?? 0,
        firstSupportAt: aggregate?._min.createdAt ?? null,
        joinedAt: participant.joinedAt,
      };
    })
  );
};

export const getHomepageLeaderboard = async (query: {
  page: number;
  limit: number;
  category?: string;
  period?: 'all' | 'today';
}) => {
  const { page, limit, skip, take } = getPagination(query);
  const createdAt =
    query.period === 'today'
      ? {
          gte: new Date(new Date().setUTCHours(0, 0, 0, 0)),
        }
      : undefined;

  const grouped = await db.support.groupBy({
    by: ['creatorId'],
    where: {
      status: 'CONFIRMED',
      createdAt,
      creator: {
        status: 'ACTIVE',
        category: query.category ? { slug: query.category } : undefined,
      },
    },
    _sum: { points: true },
    _count: { _all: true },
    orderBy: { _sum: { points: 'desc' } },
  });

  const total = grouped.length;
  const pageRows = grouped.slice(skip, skip + take);
  const creators = await db.creatorProfile.findMany({
    where: { id: { in: pageRows.map((row) => row.creatorId) } },
    select: publicCreatorSelect,
  });
  const creatorById = new Map(creators.map((creator) => [creator.id, creator]));

  return {
    items: pageRows.map((row, index) => ({
      rank: skip + index + 1,
      points: row._sum.points ?? 0,
      supportCount: row._count._all,
      creator: creatorById.get(row.creatorId) ?? null,
    })),
    pagination: buildPagination(page, limit, total),
  };
};

export const getClashLeaderboard = async (clashId: string, query: TPaginationQuery) => {
  const ranked = await getClashLeaderboardRows(clashId);
  const { page, limit, skip, take } = getPagination(query);
  const pageRows = ranked.slice(skip, skip + take);

  const creators = await db.creatorProfile.findMany({
    where: { id: { in: pageRows.map((row) => row.creatorId) } },
    select: publicCreatorSelect,
  });
  const creatorById = new Map(creators.map((creator) => [creator.id, creator]));

  return {
    items: pageRows.map((row) => ({
      rank: row.rank,
      points: row.points,
      supportCount: row.supportCount,
      creator: creatorById.get(row.creatorId) ?? null,
    })),
    pagination: buildPagination(page, limit, ranked.length),
  };
};
