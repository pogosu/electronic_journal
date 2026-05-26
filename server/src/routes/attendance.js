import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { getAttendances, setAttendance, getAttendanceStats } from '../controllers/attendanceController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAttendances);
router.post('/', requireRole('teacher', 'admin', 'deanery'), setAttendance);
router.get('/stats/:journalId', getAttendanceStats);

export default router;
