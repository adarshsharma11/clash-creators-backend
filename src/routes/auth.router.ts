import express from 'express';
import * as AuthController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth-middleware';
import { authRateLimit } from '../middleware/rate-limit';

const router = express.Router();

router.post('/signup', authRateLimit, AuthController.signup);
router.post('/login', authRateLimit, AuthController.validateLoginData, AuthController.login);
router.get('/me', requireAuth, AuthController.me);
router.post('/logout', AuthController.logout);

export default router;
