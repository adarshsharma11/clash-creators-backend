import { NextFunction, Request, Response } from 'express';
import * as AchievementService from '../services/achievement.service';
import { sendSuccessResponse } from '../utils/responseHandler';

export const listAchievements = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const achievements = await AchievementService.listAchievements();
    return sendSuccessResponse(response, achievements);
  } catch (error) {
    next(error);
  }
};
