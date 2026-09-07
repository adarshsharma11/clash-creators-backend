import crypto from 'crypto';

const timingSafeEqual = (expected: string, actual: string): boolean => {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

export const verifyCheckoutSignature = (
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean => {
  if (!secret || !orderId || !paymentId || !signature) {
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return timingSafeEqual(expected, signature);
};

export const verifyWebhookSignature = (rawBody: string, signature: string, secret: string): boolean => {
  if (!secret || !rawBody || !signature) {
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeEqual(expected, signature);
};

export const paiseFromPoints = (points: number): number => Math.round(points * 100);
