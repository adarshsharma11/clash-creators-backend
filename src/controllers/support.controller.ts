import { NextFunction, Request, Response } from 'express';
import * as SupportService from '../services/support.service';
import { createSupportSchema } from '../types/support';
import { sendSuccessResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

const readIdempotencyKey = (request: Request): string | undefined => {
  const header = request.get('Idempotency-Key') ?? request.get('idempotency-key');
  if (!header) {
    return undefined;
  }
  return header.trim().slice(0, 128);
};

export const createSupport = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = createSupportSchema.parse(request.body);
    const result = await SupportService.createSupport(request.user?.id ?? '', body, readIdempotencyKey(request));
    return sendSuccessResponse(response, {
      ...result,
      keyId: result.payment.checkout.keyId,
      orderId: result.payment.checkout.orderId,
      amount: result.payment.checkout.amount,
      currency: result.payment.checkout.currency,
      supportId: result.payment.checkout.supportId,
    }, HttpStatusCode.CREATED);
  } catch (error) {
    next(error);
  }
};

export const getSupport = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const support = await SupportService.getSupportById(
      request.params.id,
      request.user?.id ?? '',
      Boolean(request.admin)
    );
    return sendSuccessResponse(response, support);
  } catch (error) {
    next(error);
  }
};

export const confirmSupportDemo = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const support = await SupportService.confirmSupportForDemo(request.params.id, request.user?.id ?? '');
    return sendSuccessResponse(response, support);
  } catch (error) {
    next(error);
  }
};
