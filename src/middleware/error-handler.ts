import { Prisma } from '../generated/prisma';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { sendCodedErrorResponse, sendErrorResponse, sendValidationError } from '../utils/responseHandler';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';
import HttpStatusCode from '../utils/HttpStatusCode';

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  if (error instanceof z.ZodError) {
    const errors = error.errors.map((issue) => issue.message);
    return sendValidationError(response, 'Validation Error', errors, HttpStatusCode.UNPROCESSABLE_ENTITY);
  }

  if (error instanceof AppError) {
    return sendCodedErrorResponse(
      response,
      error.statusCode,
      error.code,
      error.message,
      env.isDevelopment ? error.details : undefined
    );
  }

  if (error instanceof TokenExpiredError) {
    return sendCodedErrorResponse(response, HttpStatusCode.UNAUTHORIZED, 'AUTH_UNAUTHORIZED', 'Session expired');
  }

  if (error instanceof JsonWebTokenError) {
    return sendCodedErrorResponse(response, HttpStatusCode.UNAUTHORIZED, 'AUTH_UNAUTHORIZED', 'Invalid session');
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return sendCodedErrorResponse(response, HttpStatusCode.CONFLICT, 'CONFLICT', 'A record with this value already exists');
    }
    if (error.code === 'P2025') {
      return sendCodedErrorResponse(response, HttpStatusCode.NOT_FOUND, 'NOT_FOUND', 'Record not found');
    }
    return sendCodedErrorResponse(
      response,
      HttpStatusCode.BAD_REQUEST,
      'DATABASE_ERROR',
      env.isDevelopment ? error.message : 'A database error occurred'
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError || error instanceof Prisma.PrismaClientRustPanicError) {
    return sendCodedErrorResponse(
      response,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      'DATABASE_ERROR',
      'Database is unavailable'
    );
  }

  const message = error instanceof Error ? error.message : 'Internal Server Error';
  return sendErrorResponse(
    response,
    env.isDevelopment ? message : 'Internal Server Error',
    HttpStatusCode.INTERNAL_SERVER_ERROR
  );
};
