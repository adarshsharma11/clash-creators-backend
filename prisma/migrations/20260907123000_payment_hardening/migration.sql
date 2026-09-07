-- Payment idempotency and Razorpay order tracking
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- System events (payment/support) can be audited without an admin actor
ALTER TABLE "AuditLog" ALTER COLUMN "adminId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "Winner_createdAt_idx" ON "Winner"("createdAt");
CREATE INDEX IF NOT EXISTS "Winner_clashId_idx" ON "Winner"("clashId");
