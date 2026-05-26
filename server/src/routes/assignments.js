import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { getAssignments, createAssignment, deleteAssignment } from '../controllers/assignmentController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAssignments);
router.post('/', requireRole('admin'), createAssignment);
router.delete('/:id', requireRole('admin'), deleteAssignment);

export default router;
