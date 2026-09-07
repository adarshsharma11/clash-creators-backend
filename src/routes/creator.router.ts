import { Router } from 'express';
import * as CreatorController from '../controllers/creator.controller';
import { requireAuth } from '../middleware/auth-middleware';

const router = Router();

router.get('/', CreatorController.listCreators);
router.patch('/me', requireAuth, CreatorController.updateMe);
router.put('/me/socials', requireAuth, CreatorController.upsertMySocial);
router.get('/:username', CreatorController.getCreator);
router.get('/:username/clashes', CreatorController.getCreatorClashes);
router.get('/:username/supporters', CreatorController.getCreatorSupporters);
router.get('/:username/supports', CreatorController.getCreatorSupports);
router.get('/:username/achievements', CreatorController.getCreatorAchievements);

export default router;
