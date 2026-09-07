import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { requireAdmin, requireRole } from '../middleware/admin-auth-middleware';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', requireAdmin, requireRole('ADMIN'), categoryController.createCategory);
router.put('/:id', requireAdmin, requireRole('ADMIN'), categoryController.updateCategory);
router.delete('/:id', requireAdmin, requireRole('SUPER_ADMIN'), categoryController.deleteCategory);

export default router;