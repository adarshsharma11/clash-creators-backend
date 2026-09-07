import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { PaymentIntent, PaymentProvider } from './PaymentProvider';
import { paiseFromPoints, verifyCheckoutSignature } from './razorpay-signature';

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status?: string;
};

const basicAuth = (): string =>
  Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64');

export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = 'RAZORPAY' as const;

  async createIntent(input: { amount: number; currency: string; supportId: string }): Promise<PaymentIntent> {
    const amountPaise = paiseFromPoints(input.amount);

    if (!env.razorpayKeyId || !env.razorpayKeySecret) {
      if (!env.isDevelopment) {
        throw new AppError(500, 'PAYMENT_CREATION_FAILED', 'Razorpay is not configured');
      }
      return {
        provider: this.name,
        providerPaymentId: null,
        amount: input.amount.toFixed(2),
        currency: input.currency,
        checkoutPayload: {
          keyId: env.razorpayKeyId || null,
          orderId: `order_demo_${input.supportId}`,
          amount: input.amount.toFixed(2),
          currency: input.currency,
        },
      };
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: input.currency,
        receipt: input.supportId.slice(0, 40),
        notes: { supportId: input.supportId },
      }),
    });

    if (!response.ok) {
      throw new AppError(502, 'PAYMENT_CREATION_FAILED', 'Unable to create Razorpay order');
    }

    const order = (await response.json()) as RazorpayOrder;
    return {
      provider: this.name,
      providerPaymentId: null,
      amount: input.amount.toFixed(2),
      currency: order.currency ?? input.currency,
      checkoutPayload: {
        keyId: env.razorpayKeyId,
        orderId: order.id,
        amount: input.amount.toFixed(2),
        currency: order.currency ?? input.currency,
      },
    };
  }

  async verifySignature(payload: unknown): Promise<boolean> {
    if (!payload || typeof payload !== 'object') {
      return false;
    }
    const body = payload as { orderId?: string; paymentId?: string; signature?: string };
    if (!body.orderId || !body.paymentId || !body.signature) {
      return false;
    }
    return verifyCheckoutSignature(body.orderId, body.paymentId, body.signature, env.razorpayKeySecret);
  }

  async fetchOrder(orderId: string): Promise<{ amount: number; currency: string; status: string } | null> {
    if (!env.razorpayKeyId || !env.razorpayKeySecret) {
      return null;
    }
    const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers: { Authorization: `Basic ${basicAuth()}` },
    });
    if (!response.ok) {
      return null;
    }
    const order = (await response.json()) as { amount: number; currency: string; status: string };
    return { amount: order.amount, currency: order.currency, status: order.status };
  }

  async fetchPayment(paymentId: string): Promise<{ amount: number; currency: string; status: string; orderId: string } | null> {
    if (!env.razorpayKeyId || !env.razorpayKeySecret) {
      return null;
    }
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${basicAuth()}` },
    });
    if (!response.ok) {
      return null;
    }
    const payment = (await response.json()) as {
      amount: number;
      currency: string;
      status: string;
      order_id: string;
    };
    return {
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      orderId: payment.order_id,
    };
  }
}

export const paymentProvider = new RazorpayPaymentProvider();
