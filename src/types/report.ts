import { z } from 'zod';
import { idSchema, reportReasonSchema } from './common';

export const createReportSchema = z
  .object({
    creatorId: idSchema.optional(),
    clashId: idSchema.optional(),
    reason: reportReasonSchema,
    description: z.string().trim().max(1000).optional(),
  })
  .refine((data) => Boolean(data.creatorId || data.clashId), {
    message: 'A report must target a creator or a clash',
    path: ['creatorId'],
  });

export type TCreateReport = z.infer<typeof createReportSchema>;
