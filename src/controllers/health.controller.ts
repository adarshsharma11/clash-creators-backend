import { NextFunction, Request, Response } from 'express';
import { db } from '../utils/db.server';
import { sendSuccessResponse } from '../utils/responseHandler';

export const getHealth = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    await db.$queryRaw`SELECT 1`;
    return sendSuccessResponse(response, { status: 'ok' });
  } catch (error) {
    next(error);
  }
};
