import { Router } from 'express';
import { proposalController } from '../controllers/proposal.controller.js';
import { messageController } from '../controllers/message.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate());

router.get('/', proposalController.list);
router.patch('/:id/accept', proposalController.accept);
router.patch('/:id/reject', proposalController.reject);
router.patch('/:id/select-workshop', proposalController.selectWorkshop);
router.get('/:id/messages', messageController.list);
router.post('/:id/messages', messageController.create);

export default router;
