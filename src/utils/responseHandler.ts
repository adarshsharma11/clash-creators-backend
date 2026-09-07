import { Response } from 'express';
import HttpStatusCode from './HttpStatusCode';
import { PaginationMeta } from './pagination';

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse<T> {
  success: false;
  error: {
    message: T;
  };
}

export const sendSuccessResponse = <T>(
  res: Response,
  data: T,
  status = HttpStatusCode.OK
): Response<SuccessResponse<T>> => {
  return res.status(status).json({ success: true, data });
};

export const sendSuccessNoDataResponse = (
  res: Response,
  message = 'Operation successful',
  status = HttpStatusCode.OK
): Response<SuccessResponse<null>> => {
  return res.status(status).json({ success: true, message });
};

export const sendErrorResponse = <T>(
  res: Response,
  message: T,
  status = HttpStatusCode.INTERNAL_SERVER_ERROR
): Response<ErrorResponse<T>> => {
  return res.status(status).json({ success: false, error: { message } });
};

export const sendNotFoundResponse = <T>(
  res: Response,
  message: T,
  status = HttpStatusCode.NOT_FOUND
): Response<ErrorResponse<T>> => {
  return res.status(status).json({ success: false, error: { code: 'NOT_FOUND', message } });
};

export const sendValidationError = (
  res: Response,
  message: string,
  errors: string[],
  status = HttpStatusCode.BAD_REQUEST
): Response => {
  return res.status(status).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
      errors,
    },
  });
};

export const sendUnauthorizedResponse = (
  res: Response,
  message = 'Unauthorized',
  status = HttpStatusCode.UNAUTHORIZED
): Response => {
  return res.status(status).json({ success: false, error: { code: 'AUTH_UNAUTHORIZED', message } });
};

export const sendForbiddenResponse = (
  res: Response,
  message = 'Forbidden',
  status = HttpStatusCode.FORBIDDEN
): Response => {
  return res.status(status).json({ success: false, error: { code: 'AUTH_FORBIDDEN', message } });
};

export const sendBadRequestResponse = <T>(
  res: Response,
  message: T,
  status = HttpStatusCode.BAD_REQUEST
): Response<ErrorResponse<T>> => {
  return res.status(status).json({ success: false, error: { message } });
};

export const sendPaginatedResponse = <T>(
  res: Response,
  data: T,
  pagination: PaginationMeta,
  status = HttpStatusCode.OK
): Response => {
  return res.status(status).json({ success: true, data, pagination });
};

export const sendCodedErrorResponse = (
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response => {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};
