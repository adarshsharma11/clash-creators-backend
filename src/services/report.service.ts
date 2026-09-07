import { Prisma } from '../generated/prisma';
import { db } from '../utils/db.server';
import { conflict, notFound } from '../utils/AppError';
import { TCreateReport } from '../types/report';
import { TAdminReportQuery, TUpdateReport } from '../types/admin';
import { buildPagination, getPagination } from '../utils/pagination';
import { createAuditLog } from './audit.service';

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const createReport = async (reporterId: string, input: TCreateReport) => {
  if (input.creatorId) {
    const creator = await db.creatorProfile.findUnique({ where: { id: input.creatorId } });
    if (!creator) {
      throw notFound('Creator not found');
    }
  }
  if (input.clashId) {
    const clash = await db.clash.findUnique({ where: { id: input.clashId } });
    if (!clash) {
      throw notFound('Clash not found');
    }
  }

  const duplicate = await db.report.findFirst({
    where: {
      reporterId,
      creatorId: input.creatorId ?? null,
      clashId: input.clashId ?? null,
      reason: input.reason,
      status: 'PENDING',
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
  });
  if (duplicate) {
    throw conflict('A similar report is already pending');
  }

  return db.report.create({
    data: {
      reporterId,
      creatorId: input.creatorId,
      clashId: input.clashId,
      reason: input.reason,
      description: input.description,
      status: 'PENDING',
    },
    select: {
      id: true,
      reason: true,
      description: true,
      status: true,
      createdAt: true,
    },
  });
};

export const listReports = async (query: TAdminReportQuery) => {
  const { page, limit, skip, take } = getPagination(query);
  const where: Prisma.ReportWhereInput = {
    status: query.status,
    reason: query.reason,
  };

  const [items, total] = await db.$transaction([
    db.report.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reason: true,
        description: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        reporter: { select: { username: true, fullName: true } },
        creator: {
          select: {
            id: true,
            displayName: true,
            user: { select: { username: true } },
          },
        },
        clash: { select: { id: true, title: true, slug: true } },
        resolvedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    db.report.count({ where }),
  ]);

  return { items, pagination: buildPagination(page, limit, total) };
};

export const updateReport = async (id: string, adminId: string, input: TUpdateReport) => {
  const report = await db.report.findUnique({ where: { id } });
  if (!report) {
    throw notFound('Report not found', 'REPORT_NOT_FOUND');
  }

  const shouldResolve = input.status === 'RESOLVED' || input.status === 'REJECTED';
  const updated = await db.report.update({
    where: { id },
    data: {
      status: input.status,
      resolvedById: shouldResolve ? adminId : report.resolvedById,
      resolvedAt: shouldResolve ? new Date() : report.resolvedAt,
    },
    select: {
      id: true,
      status: true,
      resolvedAt: true,
      reason: true,
    },
  });

  await createAuditLog({
    adminId,
    action: 'REPORT_UPDATED',
    entityType: 'Report',
    entityId: id,
    metadata: { status: input.status },
  });

  return updated;
};
