import { Router } from 'express';
import * as SupportController from '../controllers/support.controller';
import { requireAuth } from '../middleware/auth-middleware';
import { attachAdminIfPresent } from '../middleware/admin-auth-middleware';
import { paymentRateLimit } from '../middleware/rate-limit';

const router = Router();

router.post('/', requireAuth, paymentRateLimit, SupportController.createSupport);
router.get('/:id', requireAuth, attachAdminIfPresent, SupportController.getSupport);
router.post('/:id/confirm', requireAuth, SupportController.confirmSupportDemo);

export default router;
