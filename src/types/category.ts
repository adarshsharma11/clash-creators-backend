import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  slug: z.string().min(1, 'Category slug is required'),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const categoryUpdateSchema = categorySchema.partial();

export type TCategorySchema = z.infer<typeof categorySchema>;
export type TCategoryID = string;
export type TCategoryUpdate = Partial<TCategorySchema>;
