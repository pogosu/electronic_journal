import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { getDisciplines, createDiscipline, deleteDiscipline } from '../controllers/disciplineController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getDisciplines);
router.post('/', requireRole('admin'), createDiscipline);
router.delete('/:id', requireRole('admin'), deleteDiscipline);

export default router;
