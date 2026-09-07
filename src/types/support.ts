import { z } from 'zod';
import { idSchema, paginationSchema } from './common';

export const createSupportSchema = z.object({
  clashId: idSchema,
  creatorId: idSchema,
  points: z.number().int().positive(),
});

export const supportIdParamsSchema = z.object({
  id: idSchema,
});

export const creatorSupportQuerySchema = paginationSchema;

export type TCreateSupport = z.infer<typeof createSupportSchema>;
