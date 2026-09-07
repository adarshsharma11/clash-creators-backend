import { Router } from 'express';
import * as AchievementController from '../controllers/achievement.controller';

const router = Router();

router.get('/', AchievementController.listAchievements);

export default router;
