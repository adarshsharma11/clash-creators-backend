import { Request, Response } from 'express';
import { sendCodedErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

export const notFoundHandler = (request: Request, response: Response) => {
  return sendCodedErrorResponse(
    response,
    HttpStatusCode.NOT_FOUND,
    'NOT_FOUND',
    `Route ${request.method} ${request.originalUrl} was not found`
  );
};
