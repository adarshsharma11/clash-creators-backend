import { Router } from 'express';
import * as ReportController from '../controllers/report.controller';
import { requireAuth } from '../middleware/auth-middleware';
import { writeRateLimit } from '../middleware/rate-limit';

const router = Router();

router.post('/', requireAuth, writeRateLimit, ReportController.createReport);

export default router;
