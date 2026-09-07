import { Router } from 'express';
import * as WinnerController from '../controllers/winner.controller';

const router = Router();

router.get('/', WinnerController.listWinners);

export default router;
