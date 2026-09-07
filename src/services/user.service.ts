import { db } from '../utils/db.server';
import { TloginRead, TloginRequest } from '../types/general';
import { TSignup, TuserUpdateSchema } from '../types/zod';
import { hashPassword } from '../utils/bcryptHandler';
import { conflict } from '../utils/AppError';

const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  isActive: true,
} as const;

export const getUserByUsername = async (username: string): Promise<TloginRead | null> => {
  return db.user.findUnique({
    where: { username: username.toLowerCase() },
  });
};

export const getUserByEmail = async (email: string): Promise<TloginRead | null> => {
  return db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
};

export const getUserByUsernameOrEmail = async (identifier: string): Promise<TloginRead | null> => {
  const normalized = identifier.toLowerCase();
  return db.user.findFirst({
    where: {
      OR: [{ username: normalized }, { email: normalized }],
    },
  });
};

export const getUserByID = async (id: string): Promise<TloginRequest | null> => {
  return db.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
};

export const getSessionUser = async (id: string) => {
  return db.user.findUnique({
    where: { id },
    select: {
      ...publicUserSelect,
      creatorProfile: {
        select: {
          id: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          status: true,
          category: { select: { id: true, name: true, slug: true } },
          socialAccounts: {
            select: {
              platform: true,
              username: true,
              displayName: true,
              profileUrl: true,
              isPrimary: true,
              isVerified: true,
            },
          },
        },
      },
    },
  });
};

export const createUser = async (input: TSignup) => {
  const existing = await db.user.findFirst({
    where: {
      OR: [{ email: input.email }, { username: input.username }],
    },
    select: { email: true, username: true },
  });
  if (existing) {
    throw conflict(
      existing.email === input.email ? 'Email is already registered' : 'Username is already taken',
      'USER_ALREADY_EXISTS'
    );
  }

  const passwordHash = await hashPassword(input.password);
  return db.user.create({
    data: {
      fullName: input.fullName,
      username: input.username,
      email: input.email,
      passwordHash,
    },
    select: publicUserSelect,
  });
};

export const updateUserByID = async (
  id: string,
  data: TuserUpdateSchema
): Promise<Omit<TloginRequest, 'id'> | null> => {
  return db.user.update({
    where: { id },
    data: {
      username: data.username,
      fullName: data.fullName,
      email: data.email,
    },
    select: {
      email: true,
      username: true,
      fullName: true,
      avatarUrl: true,
      role: true,
      isActive: true,
    },
  });
};
