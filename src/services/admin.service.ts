import { Prisma } from '../generated/prisma';
import { db } from '../utils/db.server';
import { badRequest, notFound } from '../utils/AppError';
import { buildPagination, getPagination } from '../utils/pagination';
import { TAdminClashQuery, TAdminCreatorQuery, TCreateClash, TUpdateClash } from '../types/admin';
import { createAuditLog } from './audit.service';
import { isValidClashTransition } from '../domain/clash-rules';

export const getDashboard = async () => {
  const [
    totalUsers,
    totalCreators,
    activeCreators,
    liveClashes,
    upcomingClashes,
    completedClashes,
    totalSupports,
    confirmedPoints,
    totalPayments,
    pendingReports,
    pendingPayments,
    successfulPayments,
    totalWinners,
    confirmedSupports,
  ] = await Promise.all([
    db.user.count(),
    db.creatorProfile.count(),
    db.creatorProfile.count({ where: { status: 'ACTIVE' } }),
    db.clash.count({ where: { status: 'LIVE' } }),
    db.clash.count({ where: { status: 'UPCOMING' } }),
    db.clash.count({ where: { status: 'COMPLETED' } }),
    db.support.count(),
    db.support.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { points: true },
    }),
    db.payment.count(),
    db.report.count({ where: { status: 'PENDING' } }),
    db.payment.count({ where: { status: { in: ['CREATED', 'PENDING'] } } }),
    db.payment.count({ where: { status: 'PAID' } }),
    db.winner.count({ where: { rank: 1 } }),
    db.support.count({ where: { status: 'CONFIRMED' } }),
  ]);

  return {
    totalUsers,
    totalCreators,
    activeCreators,
    liveClashes,
    upcomingClashes,
    completedClashes,
    activeClashes: liveClashes,
    totalSupports,
    totalConfirmedSupport: confirmedSupports,
    totalConfirmedSupportPoints: confirmedPoints._sum.points ?? 0,
    totalPayments,
    pendingPayments,
    successfulPayments,
    pendingReports,
    reports: pendingReports,
    winners: totalWinners,
  };
};

export const listAdminCreators = async (query: TAdminCreatorQuery) => {
  const { page, limit, skip, take } = getPagination(query);
  const where: Prisma.CreatorProfileWhereInput = {
    status: query.status,
    category: query.category ? { slug: query.category } : undefined,
    OR: query.search
      ? [
          { displayName: { contains: query.search, mode: 'insensitive' } },
          { user: { username: { contains: query.search, mode: 'insensitive' } } },
          { user: { email: { contains: query.search, mode: 'insensitive' } } },
          { socialAccounts: { some: { username: { contains: query.search, mode: 'insensitive' } } } },
        ]
      : undefined,
  };

  const [items, total] = await db.$transaction([
    db.creatorProfile.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        bio: true,
        status: true,
        createdAt: true,
        user: { select: { username: true, fullName: true, email: true, isActive: true } },
        category: { select: { name: true, slug: true } },
        socialAccounts: {
          select: { username: true, isPrimary: true },
          orderBy: { isPrimary: 'desc' },
        },
      },
    }),
    db.creatorProfile.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      username:
        item.user?.username ??
        item.socialAccounts.find((account) => account.isPrimary)?.username ??
        item.socialAccounts[0]?.username ??
        null,
    })),
    pagination: buildPagination(page, limit, total),
  };
};

export const updateCreatorStatus = async (
  creatorId: string,
  adminId: string,
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
) => {
  const creator = await db.creatorProfile.findUnique({ where: { id: creatorId } });
  if (!creator) {
    throw notFound('Creator not found');
  }

  const updated = await db.creatorProfile.update({
    where: { id: creatorId },
    data: { status },
    select: {
      id: true,
      displayName: true,
      status: true,
    },
  });

  await createAuditLog({
    adminId,
    action: status === 'SUSPENDED' ? 'CREATOR_SUSPENDED' : status === 'ACTIVE' ? 'CREATOR_UNSUSPENDED' : 'CREATOR_UPDATED',
    entityType: 'CreatorProfile',
    entityId: creatorId,
    metadata: { status },
  });

  return updated;
};

export const listAdminClashes = async (query: TAdminClashQuery) => {
  const { page, limit, skip, take } = getPagination(query);
  const where: Prisma.ClashWhereInput = {
    status: query.status,
    category: query.category ? { slug: query.category } : undefined,
    OR: query.search
      ? [{ title: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }]
      : undefined,
  };

  const [items, total] = await db.$transaction([
    db.clash.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true, slug: true } },
        _count: { select: { participants: true } },
      },
    }),
    db.clash.count({ where }),
  ]);

  return { items, pagination: buildPagination(page, limit, total) };
};

export const createClash = async (adminId: string, input: TCreateClash) => {
  const category = await db.category.findUnique({ where: { id: input.categoryId } });
  if (!category) {
    throw notFound('Category not found');
  }

  const clash = await db.clash.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      categoryId: input.categoryId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      maxParticipants: input.maxParticipants,
      status: 'UPCOMING',
    },
    include: {
      category: { select: { name: true, slug: true } },
    },
  });

  await createAuditLog({
    adminId,
    action: 'CLASH_CREATED',
    entityType: 'Clash',
    entityId: clash.id,
    metadata: { slug: clash.slug },
  });

  return clash;
};

export const updateClash = async (id: string, adminId: string, input: TUpdateClash) => {
  const clash = await db.clash.findUnique({ where: { id } });
  if (!clash) {
    throw notFound('Clash not found');
  }

  if (input.status && !isValidClashTransition(clash.status, input.status)) {
    throw badRequest(`Cannot change clash status from ${clash.status} to ${input.status}`);
  }

  const startsAt = input.startsAt ?? clash.startsAt;
  const endsAt = input.endsAt ?? clash.endsAt;
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw badRequest('endsAt must be after startsAt');
  }

  if (input.categoryId) {
    const category = await db.category.findUnique({ where: { id: input.categoryId } });
    if (!category) {
      throw notFound('Category not found');
    }
  }

  const updated = await db.clash.update({
    where: { id },
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      categoryId: input.categoryId,
      status: input.status,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      maxParticipants: input.maxParticipants,
    },
    include: {
      category: { select: { name: true, slug: true } },
    },
  });

  await createAuditLog({
    adminId,
    action: 'CLASH_UPDATED',
    entityType: 'Clash',
    entityId: id,
    metadata: { status: updated.status },
  });

  return updated;
};
