import { db } from '../utils/db.server';
import { conflict, notFound } from '../utils/AppError';
import { createAuditLog } from './audit.service';

export const confirmSupportPayment = async (input: {
  supportId: string;
  razorpayPaymentId?: string;
  adminId?: string;
}) => {
  const result = await db.$transaction(async (tx) => {
    const support = await tx.support.findUnique({
      where: { id: input.supportId },
      include: { payment: true },
    });
    if (!support) {
      throw notFound('Support not found', 'INVALID_SUPPORT');
    }

    if (support.status === 'CONFIRMED') {
      return {
        alreadyProcessed: true,
        support: {
          id: support.id,
          points: support.points,
          status: support.status,
        },
        payment: support.payment
          ? {
              id: support.payment.id,
              status: support.payment.status,
              razorpayOrderId: support.payment.razorpayOrderId,
              providerPaymentId: support.payment.providerPaymentId,
            }
          : null,
      };
    }

    if (support.status !== 'PENDING') {
      throw conflict('This support cannot be confirmed', 'PAYMENT_ALREADY_PROCESSED');
    }

    const confirmed = await tx.support.updateMany({
      where: { id: support.id, status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });
    if (confirmed.count === 0) {
      throw conflict('This support was already processed', 'PAYMENT_ALREADY_PROCESSED');
    }

    if (support.payment) {
      await tx.payment.update({
        where: { id: support.payment.id },
        data: {
          status: 'PAID',
          providerPaymentId: input.razorpayPaymentId ?? support.payment.providerPaymentId,
        },
      });
    }

    return {
      alreadyProcessed: false,
      support: {
        id: support.id,
        points: support.points,
        status: 'CONFIRMED' as const,
      },
      payment: support.payment
        ? {
            id: support.payment.id,
            status: 'PAID' as const,
            razorpayOrderId: support.payment.razorpayOrderId,
            providerPaymentId: input.razorpayPaymentId ?? support.payment.providerPaymentId,
          }
        : null,
    };
  });

  if (!result.alreadyProcessed) {
    await createAuditLog({
      adminId: input.adminId,
      action: 'SUPPORT_CONFIRMED',
      entityType: 'Support',
      entityId: result.support.id,
      metadata: { paymentId: result.payment?.id ?? null },
    });
  }

  return result;
};

export const failSupportPayment = async (supportId: string) => {
  return db.$transaction(async (tx) => {
    const support = await tx.support.findUnique({
      where: { id: supportId },
      include: { payment: true },
    });
    if (!support || support.status === 'CONFIRMED') {
      return support;
    }
    await tx.support.updateMany({
      where: { id: supportId, status: 'PENDING' },
      data: { status: 'FAILED' },
    });
    if (support.payment && support.payment.status !== 'PAID') {
      await tx.payment.update({
        where: { id: support.payment.id },
        data: { status: 'FAILED' },
      });
    }
    return support;
  });
};
