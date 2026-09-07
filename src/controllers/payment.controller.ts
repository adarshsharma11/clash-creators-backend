import { NextFunction, Request, Response } from 'express';
import * as PaymentService from '../services/payment.service';
import { verifyRazorpaySchema } from '../types/admin';
import { sendSuccessResponse } from '../utils/responseHandler';

export const verifyRazorpay = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = verifyRazorpaySchema.parse(request.body);
    const result = await PaymentService.verifyCheckoutPayment({
      userId: request.user?.id ?? '',
      razorpayOrderId: body.razorpay_order_id,
      razorpayPaymentId: body.razorpay_payment_id,
      razorpaySignature: body.razorpay_signature,
    });
    return sendSuccessResponse(response, result);
  } catch (error) {
    next(error);
  }
};

export const razorpayWebhook = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const rawBody = Buffer.isBuffer(request.body)
      ? request.body
      : Buffer.from(typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {}));
    const signature = request.get('x-razorpay-signature') ?? undefined;
    const result = await PaymentService.processRazorpayWebhook(rawBody, signature);
    return sendSuccessResponse(response, result);
  } catch (error) {
    next(error);
  }
};
