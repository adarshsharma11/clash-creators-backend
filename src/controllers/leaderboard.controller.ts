import { NextFunction, Request, Response } from 'express';
import * as LeaderboardService from '../services/leaderboard.service';
import { leaderboardQuerySchema } from '../types/admin';
import { sendPaginatedResponse } from '../utils/responseHandler';

export const listHomepageLeaderboard = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = leaderboardQuerySchema.parse(request.query);
    const result = await LeaderboardService.getHomepageLeaderboard(query);
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};
