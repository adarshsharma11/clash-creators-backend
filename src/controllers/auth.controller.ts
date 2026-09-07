import { NextFunction, Request, Response } from 'express';
import * as UserService from '../services/user.service';
import { loginSchema, signupSchema } from '../types/zod';
import { sendCodedErrorResponse, sendSuccessNoDataResponse, sendSuccessResponse, sendUnauthorizedResponse } from '../utils/responseHandler';
import { comparePasswords } from '../utils/bcryptHandler';
import { generateToken } from '../utils/jwtHandler';
import { clearCookieOptions, cookieOptions, USER_COOKIE, USER_COOKIE_MAX_AGE } from '../utils/cookies';
import { env } from '../config/env';
import HttpStatusCode from '../utils/HttpStatusCode';

const setUserCookie = (response: Response, userId: string) => {
  const token = generateToken({ id: userId, typ: 'user' }, env.jwtExpiresIn);
  response.cookie(USER_COOKIE, token, cookieOptions(USER_COOKIE_MAX_AGE));
};

export const signup = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = signupSchema.parse(request.body);
    const user = await UserService.createUser(body);
    setUserCookie(response, user.id);
    return sendSuccessResponse(response, user, HttpStatusCode.CREATED);
  } catch (error) {
    next(error);
  }
};

export const login = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const userRequest = loginSchema.parse(request.body);
    const user = await UserService.getUserByUsernameOrEmail(userRequest.username);
    if (!user || !user.passwordHash || !user.isActive) {
      return sendCodedErrorResponse(response, HttpStatusCode.UNAUTHORIZED, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials');
    }

    const passwordCompare = await comparePasswords(userRequest.password, user.passwordHash);
    if (!passwordCompare) {
      return sendCodedErrorResponse(response, HttpStatusCode.UNAUTHORIZED, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials');
    }

    setUserCookie(response, user.id);
    return sendSuccessResponse(response, {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const session = await UserService.getSessionUser(request.user?.id ?? '');
    if (!session) {
      return sendUnauthorizedResponse(response, 'Unauthorized');
    }
    return sendSuccessResponse(response, {
      user: {
        id: session.id,
        email: session.email,
        username: session.username,
        fullName: session.fullName,
        avatarUrl: session.avatarUrl,
        role: session.role,
        isActive: session.isActive,
      },
      creatorProfile: session.creatorProfile
        ? {
            id: session.creatorProfile.id,
            displayName: session.creatorProfile.displayName,
            bio: session.creatorProfile.bio,
            avatarUrl: session.creatorProfile.avatarUrl,
            status: session.creatorProfile.status,
            category: session.creatorProfile.category,
          }
        : null,
      socialAccounts: session.creatorProfile?.socialAccounts ?? [],
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    response.cookie(USER_COOKIE, '', clearCookieOptions());
    return sendSuccessNoDataResponse(response, 'Logout Successful');
  } catch (error) {
    next(error);
  }
};

export const validateLoginData = (request: Request, response: Response, next: NextFunction) => {
  try {
    loginSchema.parse(request.body);
    next();
  } catch (error) {
    next(error);
  }
};
