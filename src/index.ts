import * as dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pino } from 'pino';

import authRouter from './routes/auth.router';
import categoryRouter from './routes/category.router';
import creatorRouter from './routes/creator.router';
import clashRouter from './routes/clash.router';
import supportRouter from './routes/support.router';
import reportRouter from './routes/report.router';
import achievementRouter from './routes/achievement.router';
import adminRouter from './routes/admin.router';
import paymentRouter from './routes/payment.router';
import winnerRouter from './routes/winner.router';
import leaderboardRouter from './routes/leaderboard.router';

import { notFoundHandler } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';
import requestLogger from './middleware/requestLogger';
import { securityHeaders } from './middleware/security-headers';
import { env, validateEnv } from './config/env';
import * as HealthController from './controllers/health.controller';
import * as PaymentController from './controllers/payment.controller';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

validateEnv();

export const logger = pino({ name: 'clashcreators-api' });

const app = express();

app.disable('x-powered-by');
app.use(securityHeaders);

app.use(
  cors({
    origin: env.frontendUrl,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
  })
);

app.post(
  '/api/payments/razorpay/webhook',
  express.raw({ type: 'application/json', limit: '256kb' }),
  PaymentController.razorpayWebhook
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(requestLogger);

app.get('/api/health', HealthController.getHealth);
app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/creators', creatorRouter);
app.use('/api/clashes', clashRouter);
app.use('/api/support', supportRouter);
app.use('/api/reports', reportRouter);
app.use('/api/achievements', achievementRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/winners', winnerRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.port;

// app.listen(PORT, () => {
//   logger.info(`Listening on PORT ${PORT}`);
// });

export default app;
