import express from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { 
  getWorksByJournal, 
  createWork, 
  updateWork, 
  deleteWork,
  getWorkDictionaries 
} from '../controllers/workController.js';

const router = express.Router();

// Публичные справочники для преподавателя
router.get('/dictionaries', authenticateToken, requireRole('teacher', 'admin', 'deanery'), getWorkDictionaries);

// Работа с конкретным журналом
router.get('/journal/:journalId', authenticateToken, getWorksByJournal);
router.post('/journal/:journalId', authenticateToken, requireRole('teacher', 'admin', 'deanery'), createWork);

// Работа с конкретной работой
router.put('/:id', authenticateToken, requireRole('teacher', 'admin', 'deanery'), updateWork);
router.delete('/:id', authenticateToken, requireRole('teacher', 'admin', 'deanery'), deleteWork);

export default router;
