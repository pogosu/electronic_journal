import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { updateLesson, deleteLesson, reorderLessons, reorderWorks } from '../controllers/lessonController.js';

const router = Router();

router.use(authenticateToken);

router.put('/:id', requireRole('teacher', 'admin', 'deanery'), updateLesson);
router.delete('/:id', requireRole('teacher', 'admin', 'deanery'), deleteLesson);
router.post('/journal/:journalId/reorder', requireRole('teacher', 'admin'), reorderLessons);
router.post('/works/journal/:journalId/reorder', requireRole('teacher', 'admin'), reorderWorks);

export default router;
