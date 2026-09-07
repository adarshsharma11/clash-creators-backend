import { Prisma } from '../generated/prisma';
import { db } from '../utils/db.server';
import { badRequest, forbidden, notFound } from '../utils/AppError';
import { env } from '../config/env';
import { paymentProvider } from './payment/RazorpayPaymentProvider';
import { paiseFromPoints, verifyCheckoutSignature, verifyWebhookSignature } from './payment/razorpay-signature';
import { confirmSupportPayment, failSupportPayment } from './payment-confirmation.service';
import { createAuditLog } from './audit.service';

export const verifyCheckoutPayment = async (input: {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const valid = verifyCheckoutSignature(
    input.razorpayOrderId,
    input.razorpayPaymentId,
    input.razorpaySignature,
    env.razorpayKeySecret
  );
  if (!valid) {
    throw badRequest('Payment signature is invalid', undefined, 'PAYMENT_VERIFICATION_FAILED');
  }

  const payment = await db.payment.findUnique({
    where: { razorpayOrderId: input.razorpayOrderId },
    include: { support: true },
  });
  if (!payment) {
    throw notFound('Payment order not found', 'PAYMENT_VERIFICATION_FAILED');
  }
  if (payment.support.supporterId !== input.userId) {
    throw forbidden('This payment does not belong to the current user', 'AUTH_FORBIDDEN');
  }

  const remote = await paymentProvider.fetchPayment(input.razorpayPaymentId);
  if (remote) {
    if (remote.orderId !== input.razorpayOrderId) {
      throw badRequest('Payment does not belong to this order', undefined, 'PAYMENT_VERIFICATION_FAILED');
    }
    if (remote.currency !== payment.currency) {
      throw badRequest('Payment currency mismatch', undefined, 'PAYMENT_VERIFICATION_FAILED');
    }
    if (remote.amount !== paiseFromPoints(Number(payment.amount))) {
      throw badRequest('Payment amount mismatch', undefined, 'PAYMENT_VERIFICATION_FAILED');
    }
    if (remote.status !== 'captured' && remote.status !== 'authorized') {
      throw badRequest('Payment has not been captured', undefined, 'PAYMENT_VERIFICATION_FAILED');
    }
  }

  const result = await confirmSupportPayment({
    supportId: payment.supportId,
    razorpayPaymentId: input.razorpayPaymentId,
  });

  return {
    supportId: payment.supportId,
    paymentId: payment.id,
    status: result.support.status,
    alreadyProcessed: result.alreadyProcessed,
  };
};

type RazorpayWebhookBody = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        notes?: { supportId?: string };
      };
    };
  };
};

export const processRazorpayWebhook = async (rawBody: Buffer | string, signature: string | undefined) => {
  const payload = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  if (!signature || !verifyWebhookSignature(payload, signature, env.razorpayWebhookSecret)) {
    throw badRequest('Invalid webhook signature', undefined, 'INVALID_WEBHOOK');
  }

  const body = JSON.parse(payload) as RazorpayWebhookBody;
  const entity = body.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const paymentId = entity?.id;
  const supportIdFromNotes = entity?.notes?.supportId;

  const payment = orderId
    ? await db.payment.findUnique({
        where: { razorpayOrderId: orderId },
        include: { support: true },
      })
    : supportIdFromNotes
      ? await db.payment.findUnique({
          where: { supportId: supportIdFromNotes },
          include: { support: true },
        })
      : null;

  if (!payment) {
    return { ignored: true };
  }

  if (body.event === 'payment.captured') {
    const result = await confirmSupportPayment({
      supportId: payment.supportId,
      razorpayPaymentId: paymentId,
    });
    await createAuditLog({
      action: 'PAYMENT_CAPTURED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { supportId: payment.supportId, alreadyProcessed: result.alreadyProcessed },
    });
    return { handled: 'captured', alreadyProcessed: result.alreadyProcessed };
  }

  if (body.event === 'payment.failed') {
    await failSupportPayment(payment.supportId);
    await createAuditLog({
      action: 'PAYMENT_FAILED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { supportId: payment.supportId },
    });
    return { handled: 'failed' };
  }

  return { ignored: true };
};

export const listAdminPayments = async (query: {
  page: number;
  limit: number;
  status?: 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  search?: string;
  from?: Date;
  to?: Date;
}) => {
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where: Prisma.PaymentWhereInput = {
    status: query.status,
    createdAt: query.from || query.to
      ? {
          gte: query.from,
          lte: query.to,
        }
      : undefined,
    OR: query.search
      ? [
          { razorpayOrderId: { contains: query.search, mode: 'insensitive' } },
          { providerPaymentId: { contains: query.search, mode: 'insensitive' } },
          { support: { supporter: { email: { contains: query.search, mode: 'insensitive' } } } },
          { support: { supporter: { username: { contains: query.search, mode: 'insensitive' } } } },
        ]
      : undefined,
  };

  const [items, total] = await db.$transaction([
    db.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: adminPaymentSelect,
    }),
    db.payment.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};

const adminPaymentSelect = {
  id: true,
  provider: true,
  amount: true,
  currency: true,
  status: true,
  razorpayOrderId: true,
  providerPaymentId: true,
  createdAt: true,
  updatedAt: true,
  support: {
    select: {
      id: true,
      points: true,
      status: true,
      supporter: {
        select: { id: true, username: true, fullName: true, email: true },
      },
      creator: {
        select: {
          id: true,
          displayName: true,
          user: { select: { username: true } },
        },
      },
      clash: {
        select: { id: true, title: true, slug: true, status: true },
      },
    },
  },
} as const;

export const getAdminPaymentById = async (id: string) => {
  const payment = await db.payment.findUnique({
    where: { id },
    select: adminPaymentSelect,
  });
  if (!payment) {
    throw notFound('Payment not found');
  }
  return payment;
};
