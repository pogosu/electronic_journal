import { Router } from 'express';
import { login, logout, me } from '../controllers/authController.js';
import { checkLoginBlock } from '../middlewares/loginRateLimit.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.post('/login', checkLoginBlock, login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, me);

export default router;
