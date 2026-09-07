import { NextFunction, Request, Response } from 'express';
import { AdminRole } from '../generated/prisma';
import { sendForbiddenResponse, sendUnauthorizedResponse } from '../utils/responseHandler';
import { verifyAdminToken } from '../utils/jwtHandler';
import * as AdminAuthService from '../services/admin-auth.service';
import { ADMIN_COOKIE } from '../utils/cookies';

export const attachAdminIfPresent = async (request: Request, _response: Response, next: NextFunction) => {
  const token = request.cookies?.[ADMIN_COOKIE] as string | undefined;
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyAdminToken(token);
    const admin = await AdminAuthService.getAdminById(decoded.id);
    if (admin?.isActive) {
      request.admin = admin;
    }
    next();
  } catch {
    next();
  }
};

export const requireAdmin = async (request: Request, response: Response, next: NextFunction) => {
  const token = request.cookies?.[ADMIN_COOKIE] as string | undefined;
  if (!token) {
    return sendUnauthorizedResponse(response, 'Admin authentication required');
  }

  try {
    const decoded = verifyAdminToken(token);
    const admin = await AdminAuthService.getAdminById(decoded.id);
    if (!admin) {
      return sendUnauthorizedResponse(response, 'Admin authentication required');
    }
    if (!admin.isActive) {
      return sendForbiddenResponse(response, 'Admin account is inactive');
    }
    request.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole =
  (...roles: AdminRole[]) =>
  (request: Request, response: Response, next: NextFunction) => {
    if (!request.admin) {
      return sendUnauthorizedResponse(response, 'Admin authentication required');
    }
    if (request.admin.role === 'SUPER_ADMIN' || roles.includes(request.admin.role)) {
      next();
      return;
    }
    return sendForbiddenResponse(response, 'Insufficient admin role');
  };
