export type PaymentIntent = {
  provider: 'RAZORPAY';
  providerPaymentId: string | null;
  amount: string;
  currency: string;
  checkoutPayload: {
    keyId: string | null;
    orderId: string | null;
    amount: string;
    currency: string;
  };
};

export interface PaymentProvider {
  readonly name: 'RAZORPAY';
  createIntent(input: { amount: number; currency: string; supportId: string }): Promise<PaymentIntent>;
  verifySignature(payload: unknown): Promise<boolean>;
}
