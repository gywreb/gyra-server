import { Router } from 'express';
import authController from '../controllers/authController';
import { basicAuth } from '../middlewares/basicAuth';

const router = Router();

router.post('/register', basicAuth, authController.register);
router.post('/login', basicAuth, authController.login);

export default router;
