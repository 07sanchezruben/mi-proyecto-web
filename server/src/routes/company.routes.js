import { Router } from 'express';
import { companyController } from '../controllers/company.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate());
router.use(authorize('company'));

router.get('/me', companyController.me);
router.put('/me', companyController.update);
router.get('/me/matches', companyController.matches);
router.post('/me/proposals', companyController.proposals);

export default router;
