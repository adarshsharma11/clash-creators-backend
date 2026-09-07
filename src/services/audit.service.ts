import { Prisma } from '../generated/prisma';
import { db } from '../utils/db.server';
import { buildPagination, getPagination } from '../utils/pagination';
import { TAuditLogQuery } from '../types/admin';

export const createAuditLog = async (input: {
  adminId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}) => {
  return db.auditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
};

export const listAuditLogs = async (query: TAuditLogQuery) => {
  const { page, limit, skip, take } = getPagination(query);
  const where: Prisma.AuditLogWhereInput = {
    action: query.action,
    entityType: query.entityType,
    entityId: query.entityId,
  };

  const [items, total] = await db.$transaction([
    db.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, total),
  };
};
