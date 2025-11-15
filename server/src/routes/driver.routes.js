import { Router } from 'express';
import { driverController } from '../controllers/driver.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate());
router.use(authorize('driver'));

router.get('/me', driverController.me);
router.put('/me', driverController.update);
router.get('/me/proposals', driverController.proposals);

export default router;
