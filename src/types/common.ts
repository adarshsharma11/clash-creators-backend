import { z } from 'zod';
import { ClashStatus, CreatorStatus, ReportReason, ReportStatus } from '../generated/prisma';

export const idSchema = z.string().trim().min(1).max(64);
export const usernameSchema = z.string().trim().min(1).max(50);
export const slugSchema = z.string().trim().min(1).max(120);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const creatorStatusSchema = z.nativeEnum(CreatorStatus);
export const clashStatusSchema = z.nativeEnum(ClashStatus);
export const reportReasonSchema = z.nativeEnum(ReportReason);
export const reportStatusSchema = z.nativeEnum(ReportStatus);

export type TPaginationQuery = z.infer<typeof paginationSchema>;
