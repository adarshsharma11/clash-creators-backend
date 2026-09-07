import { Prisma } from '../generated/prisma';
import { db } from '../utils/db.server';
import { badRequest, notFound } from '../utils/AppError';
import { z } from 'zod';
import { createAuditLog } from './audit.service';

const settingValidators: Record<string, z.ZodType> = {
  supportPointMinimum: z.number().int().min(1),
  supportPointMaximum: z.number().int().min(1),
  clashMinimumParticipants: z.number().int().min(2),
  clashMaximumParticipants: z.number().int().min(2),
  platformName: z.string().min(1).max(100),
  maintenanceMode: z.boolean(),
};

const toJsonValue = (value: unknown): Prisma.InputJsonValue => {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};

export const listSettings = async () => {
  return db.platformSetting.findMany({
    orderBy: { key: 'asc' },
    select: {
      key: true,
      value: true,
      description: true,
      updatedAt: true,
    },
  });
};

export const getSetting = async (key: string) => {
  return db.platformSetting.findUnique({
    where: { key },
    select: {
      key: true,
      value: true,
      description: true,
      updatedAt: true,
    },
  });
};

export const getNumericSetting = async (key: string, fallback: number): Promise<number> => {
  const setting = await db.platformSetting.findUnique({ where: { key } });
  if (typeof setting?.value === 'number') {
    return setting.value;
  }
  return fallback;
};

export const updateSetting = async (key: string, value: unknown, adminId: string) => {
  const existing = await db.platformSetting.findUnique({ where: { key } });
  if (!existing) {
    throw notFound('Setting not found');
  }

  const validator = settingValidators[key];
  if (!validator) {
    throw badRequest('This setting cannot be updated');
  }

  const parsed = validator.parse(value);
  const updated = await db.platformSetting.update({
    where: { key },
    data: { value: toJsonValue(parsed) },
    select: {
      key: true,
      value: true,
      description: true,
      updatedAt: true,
    },
  });

  await createAuditLog({
    adminId,
    action: 'SETTING_UPDATED',
    entityType: 'PlatformSetting',
    entityId: updated.key,
    metadata: { key: updated.key },
  });

  return updated;
};
