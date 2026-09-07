import { CookieOptions } from 'express';
import { env } from '../config/env';

export const cookieOptions = (maxAgeMs: number): CookieOptions => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  path: '/',
  maxAge: maxAgeMs,
});

export const clearCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  path: '/',
  expires: new Date(0),
});

export const USER_COOKIE = 'jwt';
export const ADMIN_COOKIE = 'admin_jwt';
export const USER_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
export const ADMIN_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
