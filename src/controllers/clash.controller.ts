import { NextFunction, Request, Response } from 'express';
import * as ClashService from '../services/clash.service';
import { clashQuerySchema } from '../types/clash';
import { paginationSchema } from '../types/common';
import { sendPaginatedResponse, sendSuccessResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

export const listClashes = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = clashQuerySchema.parse(request.query);
    const result = await ClashService.listClashes(query, Boolean(request.admin));
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getClash = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const clash = await ClashService.getClashById(request.params.id);
    return sendSuccessResponse(response, clash);
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = paginationSchema.parse(request.query);
    const result = await ClashService.getClashLeaderboardPage(request.params.id, query);
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getWinner = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const winner = await ClashService.getClashWinner(request.params.id);
    return sendSuccessResponse(response, winner);
  } catch (error) {
    next(error);
  }
};

export const joinClash = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await ClashService.joinClash(request.params.id, request.user?.id ?? '');
    return sendSuccessResponse(response, result, result.alreadyJoined ? HttpStatusCode.OK : HttpStatusCode.CREATED);
  } catch (error) {
    next(error);
  }
};
