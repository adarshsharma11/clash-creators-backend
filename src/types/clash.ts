import { z } from 'zod';
import { SocialPlatform } from '../generated/prisma';
import { JOIN_PLATFORMS, normalizeJoinUsername } from '../domain/join-identity';
import { clashStatusSchema, idSchema, paginationSchema } from './common';

export const clashQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  status: clashStatusSchema.optional(),
});

export const clashIdParamsSchema = z.object({
  id: idSchema,
});

export const joinClashSchema = z.object({
  username: z
    .string({ required_error: 'Invalid creator username' })
    .transform(normalizeJoinUsername)
    .pipe(
      z
        .string()
        .min(2, 'Invalid creator username')
        .max(30, 'Invalid creator username')
        .regex(/^[a-zA-Z0-9._]+$/, 'Invalid creator username')
    ),
  platform: z.nativeEnum(SocialPlatform, {
    errorMap: () => ({ message: 'Unsupported platform' }),
  }).refine((value) => (JOIN_PLATFORMS as readonly string[]).includes(value), {
    message: 'Unsupported platform',
  }),
});

export type TClashQuery = z.infer<typeof clashQuerySchema>;
export type TJoinClash = z.infer<typeof joinClashSchema>;
