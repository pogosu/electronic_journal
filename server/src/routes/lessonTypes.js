import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { getLessonTypes, createLessonType } from '../controllers/lessonTypeController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getLessonTypes);
router.post('/', requireRole('admin'), createLessonType);

export default router;
