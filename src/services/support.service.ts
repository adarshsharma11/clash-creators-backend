import { Prisma } from '../generated/prisma';
import { db } from '../utils/db.server';
import { badRequest, forbidden, notFound } from '../utils/AppError';
import { TCreateSupport } from '../types/support';
import { canSupportClash } from '../domain/clash-rules';
import { isValidSupportPoints } from '../domain/support-rules';
import { getNumericSetting } from './settings.service';
import { paymentProvider } from './payment/RazorpayPaymentProvider';
import { confirmSupportPayment } from './payment-confirmation.service';
import { env } from '../config/env';

const publicSupportSelect = {
  id: true,
  points: true,
  status: true,
  createdAt: true,
  clash: {
    select: { id: true, title: true, slug: true, status: true },
  },
  creator: {
    select: {
      id: true,
      displayName: true,
      user: { select: { username: true, fullName: true } },
    },
  },
  payment: {
    select: {
      id: true,
      provider: true,
      amount: true,
      currency: true,
      status: true,
      razorpayOrderId: true,
    },
  },
} as const;

const toCheckout = (
  supportId: string,
  payment: {
    razorpayOrderId: string | null;
    amount: Prisma.Decimal;
    currency: string;
  }
) => ({
  keyId: env.razorpayKeyId || null,
  orderId: payment.razorpayOrderId,
  amount: payment.amount.toString(),
  currency: payment.currency,
  supportId,
});

const existingPaymentResponse = (payment: {
  id: string;
  provider: 'RAZORPAY';
  amount: Prisma.Decimal;
  currency: string;
  status: string;
  razorpayOrderId: string | null;
  support: {
    id: string;
    points: number;
    status: string;
    createdAt: Date;
    supporterId: string;
  };
}) => ({
  support: {
    id: payment.support.id,
    points: payment.support.points,
    status: payment.support.status,
    createdAt: payment.support.createdAt,
  },
  payment: {
    id: payment.id,
    provider: payment.provider,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    checkout: toCheckout(payment.support.id, payment),
  },
});

export const createSupport = async (userId: string, input: TCreateSupport, idempotencyKey?: string) => {
  const [minimum, maximum] = await Promise.all([
    getNumericSetting('supportPointMinimum', 1),
    getNumericSetting('supportPointMaximum', 1000),
  ]);

  const pointsCheck = isValidSupportPoints(input.points, minimum, maximum);
  if (!pointsCheck.ok) {
    throw badRequest(pointsCheck.reason, undefined, 'INVALID_SUPPORT');
  }

  if (idempotencyKey) {
    const existing = await db.payment.findUnique({
      where: { idempotencyKey },
      include: { support: true },
    });
    if (existing) {
      if (existing.support.supporterId !== userId) {
        throw forbidden('Idempotency key already used');
      }
      return existingPaymentResponse(existing);
    }
  }

  try {
    return await db.$transaction(async (tx) => {
      const clash = await tx.clash.findUnique({ where: { id: input.clashId } });
      if (!clash) {
        throw notFound('Clash not found', 'CLASH_NOT_FOUND');
      }

      const supportWindow = canSupportClash({
        clashStatus: clash.status,
        startsAt: clash.startsAt,
        endsAt: clash.endsAt,
        now: new Date(),
      });
      if (!supportWindow.ok) {
        throw forbidden(supportWindow.reason, 'CLASH_NOT_ACTIVE');
      }

      const creator = await tx.creatorProfile.findUnique({ where: { id: input.creatorId } });
      if (!creator) {
        throw notFound('Creator not found', 'CREATOR_NOT_FOUND');
      }
      if (creator.status !== 'ACTIVE') {
        throw forbidden('Only active creators can receive support');
      }

      const participant = await tx.clashParticipant.findUnique({
        where: {
          clashId_creatorId: {
            clashId: clash.id,
            creatorId: creator.id,
          },
        },
      });
      if (!participant) {
        throw forbidden('Creator must be a participant in this clash');
      }

      const support = await tx.support.create({
        data: {
          supporterId: userId,
          creatorId: creator.id,
          clashId: clash.id,
          points: input.points,
          status: 'PENDING',
        },
      });

      const intent = await paymentProvider.createIntent({
        amount: input.points,
        currency: 'INR',
        supportId: support.id,
      });

      const payment = await tx.payment.create({
        data: {
          supportId: support.id,
          provider: 'RAZORPAY',
          providerPaymentId: intent.providerPaymentId,
          razorpayOrderId: intent.checkoutPayload.orderId,
          idempotencyKey,
          amount: new Prisma.Decimal(intent.amount),
          currency: intent.currency,
          status: 'PENDING',
        },
      });

      return {
        support: {
          id: support.id,
          points: support.points,
          status: support.status,
          createdAt: support.createdAt,
        },
        payment: {
          id: payment.id,
          provider: payment.provider,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          checkout: toCheckout(support.id, payment),
        },
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && idempotencyKey) {
      const existing = await db.payment.findUnique({
        where: { idempotencyKey },
        include: { support: true },
      });
      if (existing && existing.support.supporterId === userId) {
        return existingPaymentResponse(existing);
      }
    }
    throw error;
  }
};

export const getSupportById = async (id: string, userId: string, isAdmin: boolean) => {
  const support = await db.support.findUnique({
    where: { id },
    select: {
      ...publicSupportSelect,
      supporterId: true,
    },
  });

  if (!support) {
    throw notFound('Support not found', 'INVALID_SUPPORT');
  }

  const { supporterId, ...safeSupport } = support;
  if (!isAdmin && supporterId !== userId) {
    throw forbidden('You can only view your own support records');
  }
  return safeSupport;
};

export const confirmSupportForDemo = async (id: string, userId: string) => {
  if (!env.demoSupportConfirm && !env.isDevelopment) {
    throw forbidden('Demo support confirmation is disabled');
  }

  const support = await db.support.findUnique({ where: { id } });
  if (!support) {
    throw notFound('Support not found', 'INVALID_SUPPORT');
  }
  if (support.supporterId !== userId) {
    throw forbidden('You can only confirm your own support records');
  }

  const result = await confirmSupportPayment({ supportId: id });
  return result.support;
};
