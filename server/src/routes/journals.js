import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { getJournals, getJournalById, createWork, createLesson, getJournalTable, getJournalAttendanceTable } from '../controllers/journalController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getJournals);
router.get('/:id', getJournalById);
router.get('/:id/table', getJournalTable);
router.get('/:id/attendance-table', getJournalAttendanceTable);
router.post('/:journalId/works', requireRole('admin', 'teacher'), createWork);
router.post('/:journalId/lessons', requireRole('admin', 'teacher'), createLesson);

export default router;
