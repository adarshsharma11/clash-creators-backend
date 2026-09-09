import { Prisma } from '../generated/prisma';
import { db } from '../utils/db.server';
import { conflict, forbidden, notFound } from '../utils/AppError';
import { canCompleteClash } from '../domain/clash-rules';
import { getClashLeaderboardRows } from './leaderboard.service';
import { createAuditLog } from './audit.service';
import { buildPagination, getPagination } from '../utils/pagination';
import { TPaginationQuery } from '../types/common';
import { publicCreatorSelect, withPublicUsername } from './public-creator';

export const listWinners = async (query: TPaginationQuery & { category?: string; clashId?: string; from?: Date; to?: Date }) => {
  const { page, limit, skip, take } = getPagination(query);
  const where: Prisma.WinnerWhereInput = {
    rank: 1,
    clashId: query.clashId,
    createdAt: query.from || query.to ? { gte: query.from, lte: query.to } : undefined,
    clash: query.category ? { category: { slug: query.category } } : undefined,
  };

  const [items, total] = await db.$transaction([
    db.winner.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: publicCreatorSelect },
        clash: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            endsAt: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
    }),
    db.winner.count({ where }),
  ]);

  return {
    items: items.map((winner) => ({
      rank: winner.rank,
      points: winner.points,
      createdAt: winner.createdAt,
      creator: withPublicUsername(winner.creator),
      clash: winner.clash,
    })),
    pagination: buildPagination(page, limit, total),
  };
};

export const completeClash = async (idOrSlug: string, adminId: string) => {
  return db.$transaction(async (tx) => {
    const clash = await tx.clash.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!clash) {
      throw notFound('Clash not found');
    }
    if (!canCompleteClash(clash.status)) {
      throw forbidden('Only live clashes can be completed');
    }

    const existingWinner = await tx.winner.findFirst({
      where: { clashId: clash.id, rank: 1 },
    });
    if (existingWinner) {
      throw conflict('This clash already has a winner');
    }

    const leaderboard = await getClashLeaderboardRows(clash.id);
    const firstPlace = leaderboard[0];

    const completed = await tx.clash.update({
      where: { id: clash.id },
      data: { status: 'COMPLETED' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
      },
    });

    const winner =
      firstPlace && firstPlace.points > 0
        ? await tx.winner.create({
            data: {
              clashId: clash.id,
              creatorId: firstPlace.creatorId,
              rank: 1,
              points: firstPlace.points,
            },
            include: {
              creator: {
                select: {
                  id: true,
                  displayName: true,
                  user: { select: { username: true, fullName: true } },
                },
              },
            },
          })
        : null;

    return {
      clash: completed,
      winner,
    };
  }).then(async (result) => {
    await createAuditLog({
      adminId,
      action: 'CLASH_COMPLETED',
      entityType: 'Clash',
      entityId: result.clash.id,
      metadata: {
        winnerCreatorId: result.winner?.creatorId ?? null,
        points: result.winner?.points ?? 0,
      },
    });
    return result;
  });
};
