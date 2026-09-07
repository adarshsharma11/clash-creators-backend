import { z } from 'zod';
import { SocialPlatform } from '../generated/prisma';
import { clashStatusSchema, creatorStatusSchema, paginationSchema, usernameSchema } from './common';

export const creatorQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  status: creatorStatusSchema.optional(),
});

export const creatorUsernameParamsSchema = z.object({
  username: usernameSchema,
});

export const creatorClashQuerySchema = paginationSchema.extend({
  status: clashStatusSchema.optional(),
});

export const updateCreatorProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(500).optional().nullable(),
  avatarUrl: z.string().trim().url().max(500).optional().nullable(),
  categoryId: z.string().trim().min(1).max(64).optional().nullable(),
});

export const upsertSocialAccountSchema = z.object({
  platform: z.nativeEnum(SocialPlatform),
  username: z.string().trim().max(80).optional().nullable(),
  displayName: z.string().trim().max(80).optional().nullable(),
  profileUrl: z.string().trim().url().max(500),
  isPrimary: z.boolean().optional(),
});

export type TCreatorQuery = z.infer<typeof creatorQuerySchema>;
export type TCreatorClashQuery = z.infer<typeof creatorClashQuerySchema>;
export type TUpdateCreatorProfile = z.infer<typeof updateCreatorProfileSchema>;
export type TUpsertSocialAccount = z.infer<typeof upsertSocialAccountSchema>;
