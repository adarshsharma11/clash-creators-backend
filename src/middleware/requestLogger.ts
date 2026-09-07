import type { RequestHandler } from 'express';
import { randomUUID } from 'crypto';
import pino, { type LevelWithSilent } from 'pino';
import type { ServerResponse } from 'node:http';

enum LogLevel {
  Fatal = 'fatal',
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Trace = 'trace',
  Silent = 'silent',
}

const customLogLevel = (res: ServerResponse, err?: Error): LevelWithSilent => {
  if (err || res.statusCode >= 500) return LogLevel.Error;
  if (res.statusCode >= 400) return LogLevel.Warn;
  if (res.statusCode >= 300) return LogLevel.Silent;
  return LogLevel.Info;
};

const logger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  base: null,
});

const SENSITIVE = /password|token|authorization|cookie|secret|signature|jwt/i;

const requestLogger: RequestHandler = (req, res, next) => {
  const requestId = (typeof req.headers['x-request-id'] === 'string' && req.headers['x-request-id']) || randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const startTime = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
    const level = customLogLevel(res);
    if (level === LogLevel.Silent) return;

    const path = SENSITIVE.test(req.originalUrl) ? req.path : req.originalUrl;
    logger[level]({
      requestId,
      method: req.method,
      path,
      status: res.statusCode,
      durationMs: Number(duration),
    });
  });

  next();
};

export default requestLogger;
