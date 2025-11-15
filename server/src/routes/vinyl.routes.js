import { Router } from 'express';
import { vinylController } from '../controllers/vinyl.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate());
router.use(authorize('company'));

router.get('/', vinylController.list);
router.post('/', vinylController.create);
router.delete('/:id', vinylController.remove);

export default router;
