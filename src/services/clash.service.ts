import { Prisma } from '../generated/prisma';
import { db } from '../utils/db.server';
import { conflict, forbidden, notFound } from '../utils/AppError';
import { buildPagination, getPagination } from '../utils/pagination';
import { TClashQuery, TJoinClash } from '../types/clash';
import { TPaginationQuery } from '../types/common';
import { canJoinClash } from '../domain/clash-rules';
import { socialProfileUrl, toSocialPlatform, type JoinPlatform } from '../domain/join-identity';
import { getClashLeaderboard, getClashLeaderboardRows } from './leaderboard.service';

const publicCategorySelect = {
  id: true,
  name: true,
  slug: true,
  icon: true,
} as const;

const publicCreatorSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  user: {
    select: {
      username: true,
      fullName: true,
      avatarUrl: true,
    },
  },
} as const;

const joinCreatorSelect = {
  ...publicCreatorSelect,
  status: true,
} as const;

type JoinClashResult = {
  joined: true;
  alreadyJoined: boolean;
  participant: {
    id: string;
    joinedAt: Date;
    creator: unknown;
  };
  creator: unknown;
  clash: {
    id: string;
    title: string;
    slug: string;
    status: string;
    startsAt: Date;
    endsAt: Date;
    maxParticipants: number | null;
  };
};

export const findClashByIdOrSlug = async (idOrSlug: string) => {
  const clash = await db.clash.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      category: { select: publicCategorySelect },
    },
  });

  if (!clash) {
    throw notFound('Clash not found', 'CLASH_NOT_FOUND');
  }

  return clash;
};

export const listClashes = async (query: TClashQuery, includeDrafts: boolean) => {
  const { page, limit, skip, take } = getPagination(query);
  const where: Prisma.ClashWhereInput = {
    status: query.status ?? (includeDrafts ? undefined : { not: 'DRAFT' }),
    category: query.category ? { slug: query.category } : undefined,
    OR: query.search
      ? [
          { title: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
        ]
      : undefined,
  };

  if (!includeDrafts && query.status === 'DRAFT') {
    return { items: [], pagination: buildPagination(page, limit, 0) };
  }

  const [clashes, total] = await db.$transaction([
    db.clash.findMany({
      where,
      skip,
      take,
      orderBy: { startsAt: 'desc' },
      include: {
        category: { select: publicCategorySelect },
        _count: { select: { participants: true } },
      },
    }),
    db.clash.count({ where }),
  ]);

  return {
    items: clashes.map((clash) => ({
      id: clash.id,
      title: clash.title,
      slug: clash.slug,
      description: clash.description,
      status: clash.status,
      startsAt: clash.startsAt,
      endsAt: clash.endsAt,
      maxParticipants: clash.maxParticipants,
      participantCount: clash._count.participants,
      category: clash.category,
    })),
    pagination: buildPagination(page, limit, total),
  };
};

export const getClashById = async (idOrSlug: string) => {
  const clash = await findClashByIdOrSlug(idOrSlug);
  const [participants, leaderboard, winner] = await Promise.all([
    db.clashParticipant.findMany({
      where: { clashId: clash.id },
      include: { creator: { select: publicCreatorSelect } },
      orderBy: { joinedAt: 'asc' },
    }),
    getClashLeaderboardRows(clash.id),
    db.winner.findFirst({
      where: { clashId: clash.id, rank: 1 },
      include: { creator: { select: publicCreatorSelect } },
    }),
  ]);

  const pointsByCreator = new Map(leaderboard.map((row) => [row.creatorId, row]));

  return {
    id: clash.id,
    title: clash.title,
    slug: clash.slug,
    description: clash.description,
    status: clash.status,
    startsAt: clash.startsAt,
    endsAt: clash.endsAt,
    maxParticipants: clash.maxParticipants,
    category: clash.category,
    participants: participants.map((participant) => {
      const row = pointsByCreator.get(participant.creatorId);
      return {
        joinedAt: participant.joinedAt,
        creator: participant.creator,
        points: row?.points ?? 0,
        rank: row?.rank ?? null,
      };
    }),
    leaderboard: leaderboard.map((row) => ({
      rank: row.rank,
      points: row.points,
      supportCount: row.supportCount,
      creatorId: row.creatorId,
    })),
    winner: winner
      ? {
          rank: winner.rank,
          points: winner.points,
          creator: winner.creator,
        }
      : null,
  };
};

export const getClashLeaderboardPage = async (idOrSlug: string, query: TPaginationQuery) => {
  const clash = await findClashByIdOrSlug(idOrSlug);
  return getClashLeaderboard(clash.id, query);
};

export const getClashWinner = async (idOrSlug: string) => {
  const clash = await findClashByIdOrSlug(idOrSlug);
  const winner = await db.winner.findFirst({
    where: { clashId: clash.id, rank: 1 },
    include: { creator: { select: publicCreatorSelect } },
  });

  if (!winner) {
    throw notFound('Winner not found');
  }

  return {
    clash: {
      id: clash.id,
      title: clash.title,
      slug: clash.slug,
      status: clash.status,
    },
    rank: winner.rank,
    points: winner.points,
    creator: winner.creator,
  };
};

const toJoinResponse = (input: {
  alreadyJoined: boolean;
  participant: { id: string; joinedAt: Date; creator: unknown };
  clash: {
    id: string;
    title: string;
    slug: string;
    status: string;
    startsAt: Date;
    endsAt: Date;
    maxParticipants: number | null;
  };
}) => ({
  joined: true as const,
  alreadyJoined: input.alreadyJoined,
  participant: input.participant,
  creator: input.participant.creator,
  clash: input.clash,
});

const resolveJoinCreator = async (input: { username: string; platform: JoinPlatform }) => {
  const matches = await db.creatorSocialAccount.findMany({
    where: {
      platform: toSocialPlatform(input.platform),
      username: { equals: input.username, mode: 'insensitive' },
    },
    include: {
      creator: {
        select: joinCreatorSelect,
      },
    },
  });

  if (matches.length > 1) {
    throw conflict('Multiple creators match this platform and username', 'CREATOR_AMBIGUOUS');
  }

  if (matches[0]) {
    if (matches[0].creator.status !== 'ACTIVE') {
      throw forbidden('Only active creators can join clashes');
    }
    return matches[0].creator;
  }

  try {
    return await db.creatorProfile.create({
      data: {
        displayName: input.username,
        status: 'ACTIVE',
        socialAccounts: {
          create: {
            platform: toSocialPlatform(input.platform),
            username: input.username,
            displayName: input.username,
            profileUrl: socialProfileUrl(input.platform, input.username),
            isPrimary: true,
          },
        },
      },
      select: joinCreatorSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await db.creatorSocialAccount.findFirst({
        where: {
          platform: toSocialPlatform(input.platform),
          username: { equals: input.username, mode: 'insensitive' },
        },
        include: { creator: { select: joinCreatorSelect } },
      });
      if (existing?.creator.status === 'ACTIVE') {
        return existing.creator;
      }
    }
    throw error;
  }
};

export const joinClash = async (idOrSlug: string, input: TJoinClash): Promise<JoinClashResult> => {
  const clash = await db.clash.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
  if (!clash) {
    throw notFound('Clash not found', 'CLASH_NOT_FOUND');
  }

  const creator = await resolveJoinCreator({
    username: input.username,
    platform: input.platform as JoinPlatform,
  });

  const clashPayload = {
    id: clash.id,
    title: clash.title,
    slug: clash.slug,
    status: clash.status,
    startsAt: clash.startsAt,
    endsAt: clash.endsAt,
    maxParticipants: clash.maxParticipants,
  };

  const existing = await db.clashParticipant.findUnique({
    where: {
      clashId_creatorId: {
        clashId: clash.id,
        creatorId: creator.id,
      },
    },
    include: {
      creator: { select: publicCreatorSelect },
    },
  });
  if (existing) {
    return toJoinResponse({
      alreadyJoined: true,
      participant: {
        id: existing.id,
        joinedAt: existing.joinedAt,
        creator: existing.creator,
      },
      clash: clashPayload,
    });
  }

  return db.$transaction(
    async (tx) => {
      const already = await tx.clashParticipant.findUnique({
        where: {
          clashId_creatorId: {
            clashId: clash.id,
            creatorId: creator.id,
          },
        },
        include: {
          creator: { select: publicCreatorSelect },
        },
      });
      if (already) {
        return toJoinResponse({
          alreadyJoined: true,
          participant: {
            id: already.id,
            joinedAt: already.joinedAt,
            creator: already.creator,
          },
          clash: clashPayload,
        });
      }

      const participantCount = await tx.clashParticipant.count({ where: { clashId: clash.id } });
      const joinCheck = canJoinClash({
        clashStatus: clash.status,
        endsAt: clash.endsAt,
        now: new Date(),
        maxParticipants: clash.maxParticipants,
        participantCount,
      });
      if (!joinCheck.ok) {
        throw forbidden(joinCheck.reason, joinCheck.code);
      }

      const participant = await tx.clashParticipant.create({
        data: {
          clashId: clash.id,
          creatorId: creator.id,
        },
        include: {
          creator: { select: publicCreatorSelect },
        },
      });

      return toJoinResponse({
        alreadyJoined: false,
        participant: {
          id: participant.id,
          joinedAt: participant.joinedAt,
          creator: participant.creator,
        },
        clash: clashPayload,
      });
    },
    { maxWait: 10_000, timeout: 15_000 }
  );
};
