import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { getMaintenanceMode, setMaintenanceMode } from '../controllers/settingsController.js';

const router = Router();

router.get('/maintenance', getMaintenanceMode);
router.put('/maintenance', authenticateToken, requireRole('admin'), setMaintenanceMode);

export default router;
