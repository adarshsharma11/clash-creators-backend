import { NextFunction, Request, Response } from 'express';
import * as WinnerService from '../services/winner.service';
import { winnersQuerySchema } from '../types/admin';
import { sendPaginatedResponse } from '../utils/responseHandler';

export const listWinners = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = winnersQuerySchema.parse(request.query);
    const result = await WinnerService.listWinners(query);
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};
