import { z } from 'zod';
import { clashStatusSchema, idSchema, paginationSchema } from './common';

export const clashQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  status: clashStatusSchema.optional(),
});

export const clashIdParamsSchema = z.object({
  id: idSchema,
});

export type TClashQuery = z.infer<typeof clashQuerySchema>;
