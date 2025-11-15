import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate());
router.use(authorize('admin'));

router.get('/summary', adminController.summary);
router.get('/payments', adminController.payments);
router.get('/events', adminController.events);
router.get('/users', adminController.users);
router.patch('/users/:id', adminController.toggleUser);

export default router;
