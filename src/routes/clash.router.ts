import { Router } from 'express';
import * as ClashController from '../controllers/clash.controller';
import { attachAdminIfPresent } from '../middleware/admin-auth-middleware';
import { writeRateLimit } from '../middleware/rate-limit';

const router = Router();

router.get('/', attachAdminIfPresent, ClashController.listClashes);
router.get('/:id', ClashController.getClash);
router.get('/:id/leaderboard', ClashController.getLeaderboard);
router.get('/:id/winner', ClashController.getWinner);
router.post('/:id/join', writeRateLimit, ClashController.joinClash);

export default router;
