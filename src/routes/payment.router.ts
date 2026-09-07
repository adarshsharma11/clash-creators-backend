import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth-middleware';
import { paymentRateLimit } from '../middleware/rate-limit';

const router = Router();

router.post('/razorpay/verify', requireAuth, paymentRateLimit, PaymentController.verifyRazorpay);

export default router;
