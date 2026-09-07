import { NextFunction, Request, Response } from 'express';
import * as AdminAuthService from '../services/admin-auth.service';
import * as AdminService from '../services/admin.service';
import * as ReportService from '../services/report.service';
import * as AchievementService from '../services/achievement.service';
import * as SettingsService from '../services/settings.service';
import * as AuditService from '../services/audit.service';
import * as WinnerService from '../services/winner.service';
import * as PaymentService from '../services/payment.service';
import { comparePasswords } from '../utils/bcryptHandler';
import { generateToken } from '../utils/jwtHandler';
import {
  adminClashQuerySchema,
  adminCreatorQuerySchema,
  adminCreatorStatusSchema,
  adminLoginSchema,
  adminPaymentQuerySchema,
  adminReportQuerySchema,
  auditLogQuerySchema,
  createAchievementSchema,
  createClashSchema,
  updateAchievementSchema,
  updateClashSchema,
  updateReportSchema,
  updateSettingSchema,
} from '../types/admin';
import {
  sendCodedErrorResponse,
  sendPaginatedResponse,
  sendSuccessNoDataResponse,
  sendSuccessResponse,
  sendUnauthorizedResponse,
} from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, clearCookieOptions, cookieOptions } from '../utils/cookies';
import { env } from '../config/env';
import { createAuditLog } from '../services/audit.service';

export const login = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = adminLoginSchema.parse(request.body);
    const admin = await AdminAuthService.getAdminByEmail(body.email);
    if (!admin || !admin.isActive) {
      return sendCodedErrorResponse(response, HttpStatusCode.UNAUTHORIZED, 'AUTH_INVALID_CREDENTIALS', 'Invalid admin credentials');
    }

    const matches = await comparePasswords(body.password, admin.passwordHash);
    if (!matches) {
      return sendCodedErrorResponse(response, HttpStatusCode.UNAUTHORIZED, 'AUTH_INVALID_CREDENTIALS', 'Invalid admin credentials');
    }

    const token = generateToken({ id: admin.id, typ: 'admin' }, env.adminJwtExpiresIn);
    response.cookie(ADMIN_COOKIE, token, cookieOptions(ADMIN_COOKIE_MAX_AGE));

    await AdminAuthService.touchAdminLogin(admin.id);
    await createAuditLog({
      adminId: admin.id,
      action: 'ADMIN_LOGIN',
      entityType: 'Admin',
      entityId: admin.id,
    });
    return sendSuccessResponse(response, {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    response.cookie(ADMIN_COOKIE, '', clearCookieOptions());
    return sendSuccessNoDataResponse(response, 'Admin logout successful');
  } catch (error) {
    next(error);
  }
};

export const me = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const admin = request.admin;
    if (!admin) {
      return sendUnauthorizedResponse(response, 'Admin authentication required');
    }
    return sendSuccessResponse(response, {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const data = await AdminService.getDashboard();
    return sendSuccessResponse(response, data);
  } catch (error) {
    next(error);
  }
};

export const listCreators = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = adminCreatorQuerySchema.parse(request.query);
    const result = await AdminService.listAdminCreators(query);
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const updateCreatorStatus = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = adminCreatorStatusSchema.parse(request.body);
    const result = await AdminService.updateCreatorStatus(request.params.id, request.admin?.id ?? '', body.status);
    return sendSuccessResponse(response, result);
  } catch (error) {
    next(error);
  }
};

export const listClashes = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = adminClashQuerySchema.parse(request.query);
    const result = await AdminService.listAdminClashes(query);
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const createClash = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = createClashSchema.parse(request.body);
    const clash = await AdminService.createClash(request.admin?.id ?? '', body);
    return sendSuccessResponse(response, clash, HttpStatusCode.CREATED);
  } catch (error) {
    next(error);
  }
};

export const updateClash = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = updateClashSchema.parse(request.body);
    const clash = await AdminService.updateClash(request.params.id, request.admin?.id ?? '', body);
    return sendSuccessResponse(response, clash);
  } catch (error) {
    next(error);
  }
};

export const completeClash = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await WinnerService.completeClash(request.params.id, request.admin?.id ?? '');
    return sendSuccessResponse(response, result);
  } catch (error) {
    next(error);
  }
};

export const listReports = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = adminReportQuerySchema.parse(request.query);
    const result = await ReportService.listReports(query);
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const updateReport = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = updateReportSchema.parse(request.body);
    const report = await ReportService.updateReport(request.params.id, request.admin?.id ?? '', body);
    return sendSuccessResponse(response, report);
  } catch (error) {
    next(error);
  }
};

export const createAchievement = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = createAchievementSchema.parse(request.body);
    const achievement = await AchievementService.createAchievement(request.admin?.id ?? '', body);
    return sendSuccessResponse(response, achievement, HttpStatusCode.CREATED);
  } catch (error) {
    next(error);
  }
};

export const updateAchievement = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = updateAchievementSchema.parse(request.body);
    const achievement = await AchievementService.updateAchievement(request.params.id, request.admin?.id ?? '', body);
    return sendSuccessResponse(response, achievement);
  } catch (error) {
    next(error);
  }
};

export const deleteAchievement = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await AchievementService.deleteAchievement(request.params.id, request.admin?.id ?? '');
    return sendSuccessResponse(response, result);
  } catch (error) {
    next(error);
  }
};

export const listSettings = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const settings = await SettingsService.listSettings();
    return sendSuccessResponse(response, settings);
  } catch (error) {
    next(error);
  }
};

export const updateSetting = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = updateSettingSchema.parse(request.body);
    const setting = await SettingsService.updateSetting(request.params.key, body.value, request.admin?.id ?? '');
    return sendSuccessResponse(response, setting);
  } catch (error) {
    next(error);
  }
};

export const listAuditLogs = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = auditLogQuerySchema.parse(request.query);
    const result = await AuditService.listAuditLogs(query);
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const listAdminAchievements = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const achievements = await AchievementService.listAchievements();
    return sendSuccessResponse(response, achievements);
  } catch (error) {
    next(error);
  }
};

export const listPayments = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const query = adminPaymentQuerySchema.parse(request.query);
    const result = await PaymentService.listAdminPayments(query);
    return sendPaginatedResponse(response, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getPayment = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const payment = await PaymentService.getAdminPaymentById(request.params.id);
    return sendSuccessResponse(response, payment);
  } catch (error) {
    next(error);
  }
};

