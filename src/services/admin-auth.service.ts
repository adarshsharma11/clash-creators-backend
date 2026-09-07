import { db } from '../utils/db.server';
import { TAdminRequest } from '../types/admin';

const adminSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
} as const;

export const getAdminById = async (id: string): Promise<TAdminRequest | null> => {
  return db.admin.findUnique({
    where: { id },
    select: adminSelect,
  });
};

export const getAdminByEmail = async (email: string) => {
  return db.admin.findUnique({
    where: { email },
    select: {
      ...adminSelect,
      passwordHash: true,
    },
  });
};

export const touchAdminLogin = async (id: string) => {
  return db.admin.update({
    where: { id },
    data: { lastLoginAt: new Date() },
    select: adminSelect,
  });
};
