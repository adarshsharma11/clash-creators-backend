import { db } from '../utils/db.server';
import { conflict, notFound } from '../utils/AppError';
import { TCreateAchievement, TUpdateAchievement } from '../types/admin';
import { createAuditLog } from './audit.service';

export const listAchievements = async () => {
  return db.achievement.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
    },
  });
};

export const getCreatorAchievements = async (username: string) => {
  const creator = await db.creatorProfile.findFirst({
    where: { user: { username } },
    select: { id: true },
  });
  if (!creator) {
    throw notFound('Creator not found');
  }

  return db.creatorAchievement.findMany({
    where: { creatorId: creator.id },
    orderBy: { earnedAt: 'desc' },
    select: {
      earnedAt: true,
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
  });
};

export const createAchievement = async (adminId: string, input: TCreateAchievement) => {
  const achievement = await db.achievement.create({
    data: input,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
    },
  });

  await createAuditLog({
    adminId,
    action: 'ACHIEVEMENT_CREATED',
    entityType: 'Achievement',
    entityId: achievement.id,
    metadata: { slug: achievement.slug },
  });

  return achievement;
};

export const updateAchievement = async (id: string, adminId: string, input: TUpdateAchievement) => {
  const existing = await db.achievement.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('Achievement not found');
  }

  const achievement = await db.achievement.update({
    where: { id },
    data: input,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
    },
  });

  await createAuditLog({
    adminId,
    action: 'ACHIEVEMENT_UPDATED',
    entityType: 'Achievement',
    entityId: id,
  });

  return achievement;
};

export const deleteAchievement = async (id: string, adminId: string) => {
  const existing = await db.achievement.findUnique({
    where: { id },
    include: { _count: { select: { creators: true } } },
  });
  if (!existing) {
    throw notFound('Achievement not found');
  }
  if (existing._count.creators > 0) {
    throw conflict('Cannot delete an achievement that has already been awarded');
  }

  await db.achievement.delete({ where: { id } });
  await createAuditLog({
    adminId,
    action: 'ACHIEVEMENT_DELETED',
    entityType: 'Achievement',
    entityId: id,
  });

  return { id };
};
