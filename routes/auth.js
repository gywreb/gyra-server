import { Router } from 'express';
import authController from '../controllers/authController';
import { basicAuth } from '../middlewares/basicAuth';
import { jwtAuth } from '../middlewares/jwtAuth';

const router = Router();

router.post('/register', basicAuth, authController.register);
router.post('/login', basicAuth, authController.login);
router.get('/getCurrent', jwtAuth, authController.getCurrent);

export default router;
