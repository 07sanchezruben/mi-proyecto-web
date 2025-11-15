import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post('/register/driver', authController.registerDriver);
router.post('/register/company', authController.registerCompany);
router.post('/register/workshop', authController.registerWorkshop);
router.post('/login', authController.login);
router.get('/me', authenticate(), authController.me);
router.get('/verify-email', authController.verifyEmail);

export default router;
