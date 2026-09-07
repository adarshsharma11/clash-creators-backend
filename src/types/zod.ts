import { z } from 'zod';

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores')
    .transform((value) => value.toLowerCase()),
  email: z.string().trim().email().max(120).transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/[A-Za-z]/, 'Password must include a letter')
    .regex(/[0-9]/, 'Password must include a number'),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(120).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(72),
});

export const userSchema = loginSchema;

export const userUpdateSchema = z.object({
  username: z.string().trim().min(3).max(30).optional(),
  fullName: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(120).optional(),
  password: z.string().min(8).max(72).optional(),
});

export type TSignup = z.infer<typeof signupSchema>;
export type TUserSchema = z.infer<typeof loginSchema>;
export type TuserUpdateSchema = z.infer<typeof userUpdateSchema>;
