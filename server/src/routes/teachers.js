import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { getMyJournals, getMyStudents, getMyDisciplines, getMyGroupsByDiscipline } from '../controllers/teacherController.js';

const router = Router();

router.use(authenticateToken, requireRole('teacher', 'admin', 'deanery'));

router.get('/journals', getMyJournals);
router.get('/students', getMyStudents);
router.get('/disciplines', getMyDisciplines);
router.get('/disciplines/:disciplineId/groups', getMyGroupsByDiscipline);

export default router;
