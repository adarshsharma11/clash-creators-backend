import { NextFunction, Request, Response } from 'express';
import * as CreatorService from '../services/creator.service';
import * as AchievementService from '../services/achievement.service';
import {
  creatorClashQuerySchema,
  creatorQuerySchema,
  updateCreatorProfileSchema,
  upsertSocialAccountSchema,
} from '../types/creator';
import { paginationSchema } from '../types/common';
import { sendPaginatedResponse, sendSuccessResponse } from '../utils/responseHandler';

export const listCreators = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = creatorQuerySchema.parse(request.query);
    const result = await CreatorService.listCreators(query);
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = updateCreatorProfileSchema.parse(request.body);
    const creator = await CreatorService.updateOwnCreatorProfile(request.user?.id ?? '', body);
    return sendSuccessResponse(response, creator);
  } catch (error) {
    next(error);
  }
};

export const upsertMySocial = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = upsertSocialAccountSchema.parse(request.body);
    const social = await CreatorService.upsertOwnSocialAccount(request.user?.id ?? '', body);
    return sendSuccessResponse(response, social);
  } catch (error) {
    next(error);
  }
};

export const getCreator = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const creator = await CreatorService.getCreatorByUsername(request.params.username);
    return sendSuccessResponse(response, creator);
  } catch (error) {
    next(error);
  }
};

export const getCreatorClashes = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = creatorClashQuerySchema.parse(request.query);
    const result = await CreatorService.getCreatorClashes(request.params.username, query);
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getCreatorSupporters = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = paginationSchema.parse(request.query);
    const result = await CreatorService.getCreatorSupporters(request.params.username, query);
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getCreatorSupports = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = paginationSchema.parse(request.query);
    const result = await CreatorService.getCreatorSupports(request.params.username, query);
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getCreatorAchievements = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const achievements = await AchievementService.getCreatorAchievements(request.params.username);
    return sendSuccessResponse(response, achievements);
  } catch (error) {
    next(error);
  }
};
