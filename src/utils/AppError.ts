export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown, code = 'BAD_REQUEST'): AppError =>
  new AppError(400, code, message, details);

export const unauthorized = (message = 'Unauthorized', code = 'AUTH_UNAUTHORIZED'): AppError =>
  new AppError(401, code, message);

export const forbidden = (message = 'Forbidden', code = 'AUTH_FORBIDDEN'): AppError =>
  new AppError(403, code, message);

export const notFound = (message: string, code = 'NOT_FOUND'): AppError => new AppError(404, code, message);

export const conflict = (message: string, code = 'CONFLICT'): AppError => new AppError(409, code, message);

export const tooManyRequests = (message = 'Too many requests', code = 'RATE_LIMITED'): AppError =>
  new AppError(429, code, message);
