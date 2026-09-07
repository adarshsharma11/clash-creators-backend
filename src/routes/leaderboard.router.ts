import { Router } from 'express';
import * as LeaderboardController from '../controllers/leaderboard.controller';

const router = Router();

router.get('/', LeaderboardController.listHomepageLeaderboard);

export default router;
