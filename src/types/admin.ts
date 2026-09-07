import type { AdminRole } from '../generated/prisma';
import { z } from 'zod';
import { clashStatusSchema, creatorStatusSchema, idSchema, paginationSchema, reportReasonSchema, reportStatusSchema } from './common';

export type TAdminRequest = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
};

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(50),
});

export const adminCreatorQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
  status: creatorStatusSchema.optional(),
  category: z.string().trim().max(80).optional(),
});

export const adminCreatorStatusSchema = z.object({
  status: creatorStatusSchema,
});

export const adminClashQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
  status: clashStatusSchema.optional(),
  category: z.string().trim().max(80).optional(),
});

export const createClashSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(160)
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
    description: z.string().trim().max(2000).optional().nullable(),
    categoryId: idSchema,
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    maxParticipants: z.number().int().min(2).max(64).optional().nullable(),
  })
  .refine((data) => data.endsAt.getTime() > data.startsAt.getTime(), {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  });

export const updateClashSchema = z
  .object({
    title: z.string().trim().min(2).max(160).optional(),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(160)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    categoryId: idSchema.optional(),
    status: clashStatusSchema.optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    maxParticipants: z.number().int().min(2).max(64).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return data.endsAt.getTime() > data.startsAt.getTime();
      }
      return true;
    },
    {
      message: 'endsAt must be after startsAt',
      path: ['endsAt'],
    }
  );

export const adminReportQuerySchema = paginationSchema.extend({
  status: reportStatusSchema.optional(),
  reason: reportReasonSchema.optional(),
});

export const updateReportSchema = z.object({
  status: z.enum(['REVIEWED', 'RESOLVED', 'REJECTED']),
});

export const createAchievementSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(400).optional().nullable(),
  icon: z.string().trim().max(80).optional().nullable(),
});

export const updateAchievementSchema = createAchievementSchema.partial();

export const updateSettingSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown()), z.array(z.unknown())]),
});

export const auditLogQuerySchema = paginationSchema.extend({
  action: z.string().trim().max(80).optional(),
  entityType: z.string().trim().max(80).optional(),
  entityId: idSchema.optional(),
});

export const adminPaymentQuerySchema = paginationSchema.extend({
  status: z.enum(['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  search: z.string().trim().max(80).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const verifyRazorpaySchema = z.object({
  razorpay_order_id: z.string().trim().min(1).max(80),
  razorpay_payment_id: z.string().trim().min(1).max(80),
  razorpay_signature: z.string().trim().min(1).max(200),
});

export const winnersQuerySchema = paginationSchema.extend({
  category: z.string().trim().max(80).optional(),
  clashId: idSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const leaderboardQuerySchema = paginationSchema.extend({
  category: z.string().trim().max(80).optional(),
  period: z.enum(['all', 'today']).default('all'),
});

export type TAdminLogin = z.infer<typeof adminLoginSchema>;
export type TCreateClash = z.infer<typeof createClashSchema>;
export type TUpdateClash = z.infer<typeof updateClashSchema>;
export type TAdminCreatorQuery = z.infer<typeof adminCreatorQuerySchema>;
export type TAdminClashQuery = z.infer<typeof adminClashQuerySchema>;
export type TAdminReportQuery = z.infer<typeof adminReportQuerySchema>;
export type TUpdateReport = z.infer<typeof updateReportSchema>;
export type TCreateAchievement = z.infer<typeof createAchievementSchema>;
export type TUpdateAchievement = z.infer<typeof updateAchievementSchema>;
export type TUpdateSetting = z.infer<typeof updateSettingSchema>;
export type TAuditLogQuery = z.infer<typeof auditLogQuerySchema>;
export type TAdminPaymentQuery = z.infer<typeof adminPaymentQuerySchema>;
export type TVerifyRazorpay = z.infer<typeof verifyRazorpaySchema>;
export type TWinnersQuery = z.infer<typeof winnersQuerySchema>;
export type TLeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
