import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.post('/create-intent', authenticate(), authorize('company'), paymentController.createIntent);
router.post('/webhook', paymentController.webhook);

export default router;
