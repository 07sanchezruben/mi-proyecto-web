import { Router } from 'express';
import { workshopController } from '../controllers/workshop.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate(false), workshopController.list);
router.get('/:id/slots', authenticate(false), workshopController.slots);

router.post('/:id/slots', authenticate(), authorize('workshop'), (req, res, next) => {
  if (Number(req.params.id) !== req.user.id) {
    return res.status(403).json({ message: 'Solo puedes gestionar tu taller' });
  }
  return workshopController.createSlot(req, res, next);
});

router.put('/slots/:id', authenticate(), authorize('workshop'), workshopController.updateSlot);

export default router;
