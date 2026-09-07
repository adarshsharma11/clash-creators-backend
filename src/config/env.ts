import * as dotenv from 'dotenv';
import path from 'path';

const isVercel = Boolean(process.env.VERCEL);
const isProductionRuntime = (): boolean =>
  process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production' || isVercel;

if (!isVercel) {
  dotenv.config({ quiet: true, path: path.resolve(process.cwd(), '.env') });
  dotenv.config({
    quiet: true,
    path: path.resolve(process.cwd(), '.env.local'),
    override: true,
  });
}

export const env = {
  isProduction: isProductionRuntime(),
  isDevelopment: !isProductionRuntime(),
  nodeEnv: process.env.NODE_ENV ?? process.env.APP_ENV ?? 'development',
  port: Number(process.env.PORT ?? 6001),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'default-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET ?? 'default-secret-key',
  adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN ?? '30d',
  frontendUrl: process.env.FRONTEND_URL ?? process.env.ORIGIN ?? 'http://localhost:3000',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  demoSupportConfirm: process.env.DEMO_SUPPORT_CONFIRM === 'true',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 30),
};

export const validateEnv = (): void => {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  if (env.isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default-secret-key')) {
    throw new Error('JWT_SECRET must be set in production');
  }
  if (env.isProduction && !process.env.ADMIN_JWT_SECRET) {
    throw new Error('ADMIN_JWT_SECRET must be set in production');
  }
  if (env.isProduction && !process.env.FRONTEND_URL && !process.env.ORIGIN) {
    throw new Error('FRONTEND_URL must be set in production');
  }
};
