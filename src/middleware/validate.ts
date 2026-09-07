import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

export const validateBody =
  (schema: ZodSchema) =>
  (request: Request, _response: Response, next: NextFunction) => {
    request.body = schema.parse(request.body);
    next();
  };

export const validateQuery =
  (schema: ZodSchema) =>
  (request: Request, _response: Response, next: NextFunction) => {
    request.query = schema.parse(request.query);
    next();
  };

export const validateParams =
  (schema: ZodSchema) =>
  (request: Request, _response: Response, next: NextFunction) => {
    request.params = schema.parse(request.params);
    next();
  };
