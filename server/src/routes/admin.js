import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { createUserSchema, updateUserSchema } from '../validators/userSchemas.js';
import {
  getUsers, createUser, updateUser, deleteUser,
  updateUserGroup, updateUserDepartment,
  getAuditLogs, getGroups, createGroup, updateGroup, deleteGroup
} from '../controllers/adminController.js';

const router = Router();

router.use(authenticateToken, requireRole('admin'));

router.get('/users', getUsers);
router.post('/users', validateBody(createUserSchema), createUser);
router.put('/users/:id', validateBody(updateUserSchema), updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/group', updateUserGroup);
router.put('/users/:id/department', updateUserDepartment);
router.get('/audit-logs', getAuditLogs);
router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.put('/groups/:id', updateGroup);
router.delete('/groups/:id', deleteGroup);

export default router;
