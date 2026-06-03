import Admin from '../models/Admin.js';
import UserRepository from '../repositories/UserRepository.js';
import GroupRepository from '../repositories/GroupRepository.js';
import DisciplineRepository from '../repositories/DisciplineRepository.js';
import AuditLogRepository from '../repositories/AuditLogRepository.js';
import AuditService from '../services/AuditService.js';

export async function getUsers(req, res, next) {
  try {
    const { search, role } = req.query;
    const admin = new Admin(req.user);
    const users = await UserRepository.findAll({ search, role });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { login, password, fullName, role, department, groupId } = req.body;
    const admin = new Admin(req.user);
    const user = await admin.createUser({ login, password, fullName, role, department, groupId }, UserRepository);
    const auditValue = { id: user.id, login: user.login, full_name: user.fullName, role: user.role, department: user.department, group: user.group };
    await AuditService.logChange({ userId: req.user.userId, action: 'CREATE_USER', tableName: 'users', newValue: auditValue });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { fullName, role, isBlocked } = req.body;
    const admin = new Admin(req.user);
    const oldValue = (await UserRepository.findById(id))?.toJSON();
    const user = await admin.updateUser(id, { fullName, role, isBlocked }, UserRepository);
    await AuditService.logChange({ userId: req.user.userId, action: 'UPDATE_USER', tableName: 'users', oldValue, newValue: user.toJSON() });
    res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const admin = new Admin(req.user);
    const oldValue = (await UserRepository.findById(id))?.toJSON();
    await admin.deleteUser(id, UserRepository);
    await AuditService.logChange({ userId: req.user.userId, action: 'DELETE_USER', tableName: 'users', oldValue });
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const { startDate, endDate, userId, action } = req.query;
    const admin = new Admin(req.user);
    const logs = await admin.viewAuditLog({ startDate, endDate, userId, action }, AuditLogRepository);
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

export async function getGroups(req, res, next) {
  try {
    const groups = await GroupRepository.findAll({ orderBy: 'name' });
    res.json(groups.map((g) => g.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function createGroup(req, res, next) {
  try {
    const { name, admissionYear } = req.body;
    const admin = new Admin(req.user);
    const group = await admin.createGroup({ name, admissionYear }, GroupRepository);
    await AuditService.logChange({ userId: req.user.userId, action: 'CREATE_GROUP', tableName: 'groups', newValue: group.toJSON() });
    res.status(201).json(group.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function updateGroup(req, res, next) {
  try {
    const { id } = req.params;
    const { name, admissionYear } = req.body;
    const admin = new Admin(req.user);
    const oldValue = (await GroupRepository.findById(id))?.toJSON();
    const updated = await admin.updateGroup(id, { name, admissionYear }, GroupRepository);
    await AuditService.logChange({ userId: req.user.userId, action: 'UPDATE_GROUP', tableName: 'groups', oldValue, newValue: updated.toJSON() });
    res.json(updated.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteGroup(req, res, next) {
  try {
    const { id } = req.params;
    const hasStudents = await GroupRepository.hasStudents(id);
    if (hasStudents) {
      return res.status(400).json({ error: 'Нельзя удалить группу с студентами' });
    }
    const admin = new Admin(req.user);
    await admin.deleteGroup(id, GroupRepository);
    await AuditService.logChange({ userId: req.user.userId, action: 'DELETE_GROUP', tableName: 'groups', newValue: { deleted: true, id: parseInt(id, 10) } });
    res.json({ message: 'Группа удалена' });
  } catch (err) {
    next(err);
  }
}

export async function updateUserGroup(req, res, next) {
  try {
    const { id } = req.params;
    const { groupId } = req.body;
    await UserRepository.updateStudentGroup(id, groupId);
    await AuditService.logChange({ userId: req.user.userId, action: 'UPDATE_STUDENT_GROUP', tableName: 'students', newValue: { userId: id, groupId } });
    res.json({ message: 'Группа обновлена' });
  } catch (err) {
    next(err);
  }
}

export async function updateUserDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { department } = req.body;
    await UserRepository.updateTeacherDepartment(id, department);
    await AuditService.logChange({ userId: req.user.userId, action: 'UPDATE_TEACHER_DEPT', tableName: 'teachers', newValue: { userId: id, department } });
    res.json({ message: 'Кафедра обновлена' });
  } catch (err) {
    next(err);
  }
}
