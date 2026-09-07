import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';
import { requireAdmin, requireRole } from '../middleware/admin-auth-middleware';
import { authRateLimit } from '../middleware/rate-limit';

const router = Router();

router.post('/login', authRateLimit, AdminController.login);
router.post('/logout', AdminController.logout);
router.get('/me', requireAdmin, AdminController.me);
router.get('/dashboard', requireAdmin, AdminController.getDashboard);

router.get('/creators', requireAdmin, requireRole('ADMIN'), AdminController.listCreators);
router.patch('/creators/:id/status', requireAdmin, requireRole('ADMIN'), AdminController.updateCreatorStatus);

router.get('/clashes', requireAdmin, requireRole('ADMIN'), AdminController.listClashes);
router.post('/clashes', requireAdmin, requireRole('ADMIN'), AdminController.createClash);
router.patch('/clashes/:id', requireAdmin, requireRole('ADMIN'), AdminController.updateClash);
router.post('/clashes/:id/complete', requireAdmin, requireRole('ADMIN'), AdminController.completeClash);

router.get('/reports', requireAdmin, AdminController.listReports);
router.patch('/reports/:id', requireAdmin, AdminController.updateReport);

router.get('/achievements', requireAdmin, requireRole('ADMIN'), AdminController.listAdminAchievements);
router.post('/achievements', requireAdmin, requireRole('ADMIN'), AdminController.createAchievement);
router.patch('/achievements/:id', requireAdmin, requireRole('ADMIN'), AdminController.updateAchievement);
router.delete('/achievements/:id', requireAdmin, requireRole('SUPER_ADMIN'), AdminController.deleteAchievement);

router.get('/payments', requireAdmin, requireRole('ADMIN'), AdminController.listPayments);
router.get('/payments/:id', requireAdmin, requireRole('ADMIN'), AdminController.getPayment);

router.get('/settings', requireAdmin, requireRole('SUPER_ADMIN'), AdminController.listSettings);
router.patch('/settings/:key', requireAdmin, requireRole('SUPER_ADMIN'), AdminController.updateSetting);

router.get('/audit-logs', requireAdmin, AdminController.listAuditLogs);

export default router;
