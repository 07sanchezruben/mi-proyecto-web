import { Router } from 'express';
import { workshopController } from '../controllers/workshop.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate());
router.use(authorize('workshop'));
router.put('/:id', workshopController.updateSlot);

export default router;
