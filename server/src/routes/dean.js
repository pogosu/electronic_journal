import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { getGroupSummaries, getDisciplineSummaries, getStudentSummariesByGroup, getGroupDisciplines } from '../controllers/deanController.js';
import { getGroups } from '../controllers/adminController.js';

const router = Router();

router.use(authenticateToken, requireRole('admin', 'deanery'));

router.get('/summary/groups', getGroupSummaries);
router.get('/summary/disciplines', getDisciplineSummaries);
router.get('/summary/students/:groupId', getStudentSummariesByGroup);
router.get('/groups', getGroups);
router.get('/groups/:groupId/disciplines', getGroupDisciplines);

export default router;
