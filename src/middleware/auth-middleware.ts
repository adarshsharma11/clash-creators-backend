import { NextFunction, Request, Response } from 'express';
import * as UserService from '../services/user.service';
import { sendUnauthorizedResponse, sendForbiddenResponse } from '../utils/responseHandler';
import { verifyUserToken } from '../utils/jwtHandler';
import { TloginRequest } from '../types/general';
import { USER_COOKIE } from '../utils/cookies';

const protectAuth = async (request: Request, response: Response, next: NextFunction) => {
  const token = request.cookies?.[USER_COOKIE] as string | undefined;
  if (token) {
    try {
      const decoded = verifyUserToken(token);
      const authUser = await UserService.getUserByID(decoded.id);
      if (authUser?.username) {
        request.user = toLoginRequest(authUser);
      }
      next();
    } catch (error) {
      next(error);
    }
  } else {
    return sendUnauthorizedResponse(response, 'Unauthorized - you need to login');
  }
};

const requireAuth = async (request: Request, response: Response, next: NextFunction) => {
  await protectAuth(request, response, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }
    if (response.headersSent) {
      return;
    }
    if (!request.user) {
      return sendUnauthorizedResponse(response, 'Unauthorized - you need to login');
    }
    if (!request.user.isActive) {
      return sendForbiddenResponse(response, 'Account is inactive');
    }
    next();
  });
};

export { protectAuth, requireAuth };

function toLoginRequest(authUser: TloginRequest): TloginRequest {
  return {
    id: authUser.id,
    email: authUser.email,
    username: authUser.username,
    fullName: authUser.fullName,
    avatarUrl: authUser.avatarUrl,
    role: authUser.role,
    isActive: authUser.isActive,
  };
}
