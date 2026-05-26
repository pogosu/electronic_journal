import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { getGrades, setGrade, getStudentStats } from '../controllers/gradeController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getGrades);
router.post('/', requireRole('teacher', 'admin', 'deanery'), setGrade);
router.get('/stats/:studentId', getStudentStats);

export default router;
