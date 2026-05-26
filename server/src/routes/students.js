import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { getMyGrades, getMyAttendance, getMyJournals, getMyStats, getMyGradesFull, getMyProfile } from '../controllers/studentController.js';

const router = Router();

router.use(authenticateToken, requireRole('student'));

router.get('/grades', getMyGrades);
router.get('/grades-full', getMyGradesFull);
router.get('/attendance', getMyAttendance);
router.get('/journals', getMyJournals);
router.get('/stats', getMyStats);
router.get('/profile', getMyProfile);

export default router;
