import User from '../models/User.js';
import Group from '../models/Group.js';
import AuditLog from '../models/AuditLog.js';

export async function getUsers(req, res, next) {
  try {
    const { search, role } = req.query;
    const users = await User.findAll({ search, role });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { login, password, fullName, role, department, groupId } = req.body;
    const user = await User.createWithRole({ login, password, fullName, role, department, groupId });
    await AuditLog.create({
      userId: req.user.userId,
      action: 'CREATE_USER',
      tableName: 'users',
      newValue: user,
    });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { fullName, role, isBlocked } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const oldValue = user.toJSON();
    user.fullName = fullName;
    user.role = role;
    user.isBlocked = isBlocked;
    await user.save();
    await AuditLog.create({
      userId: req.user.userId,
      action: 'UPDATE_USER',
      tableName: 'users',
      oldValue,
      newValue: user.toJSON(),
    });
    res.json({ message: 'Пользователь обновлён' });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const { startDate, endDate, userId, action } = req.query;
    const logs = await AuditLog.findAll({ startDate, endDate, userId, action });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

export async function getGroups(req, res, next) {
  try {
    const groups = await Group.findAll({ orderBy: 'name' });
    res.json(groups.map((g) => g.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const oldValue = user.toJSON();
    await user.delete();
    await AuditLog.create({
      userId: req.user.userId,
      action: 'DELETE_USER',
      tableName: 'users',
      oldValue,
      newValue: { deleted: true, id: parseInt(id, 10) },
    });
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    next(err);
  }
}

export async function updateUserGroup(req, res, next) {
  try {
    const { id } = req.params;
    const { groupId } = req.body;
    await User.updateStudentGroup(id, groupId);
    await AuditLog.create({
      userId: req.user.userId,
      action: 'UPDATE_USER_GROUP',
      tableName: 'students',
      newValue: { user_id: parseInt(id, 10), group_id: groupId },
    });
    res.json({ message: 'Группа обновлена' });
  } catch (err) {
    next(err);
  }
}

export async function updateUserDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { department } = req.body;
    await User.updateTeacherDepartment(id, department);
    await AuditLog.create({
      userId: req.user.userId,
      action: 'UPDATE_USER_DEPARTMENT',
      tableName: 'teachers',
      newValue: { user_id: parseInt(id, 10), department },
    });
    res.json({ message: 'Кафедра обновлена' });
  } catch (err) {
    next(err);
  }
}

export async function updateGroup(req, res, next) {
  try {
    const { id } = req.params;
    const { name, admissionYear } = req.body;
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    const oldValue = group.toJSON();
    group.name = name;
    group.admissionYear = admissionYear;
    await group.save();
    await AuditLog.create({
      userId: req.user.userId,
      action: 'UPDATE_GROUP',
      tableName: 'groups',
      oldValue,
      newValue: group.toJSON(),
    });
    res.json(group.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteGroup(req, res, next) {
  try {
    const { id } = req.params;
    const hasStudents = await Group.hasStudents(id);
    if (hasStudents) {
      return res.status(400).json({ error: 'Нельзя удалить группу с студентами' });
    }
    await Group.deleteById(id);
    await AuditLog.create({
      userId: req.user.userId,
      action: 'DELETE_GROUP',
      tableName: 'groups',
      newValue: { deleted: true, id: parseInt(id, 10) },
    });
    res.json({ message: 'Группа удалена' });
  } catch (err) {
    next(err);
  }
}

export async function createGroup(req, res, next) {
  try {
    const { name, admissionYear } = req.body;
    const group = new Group({ name, admissionYear });
    await group.save();
    await AuditLog.create({
      userId: req.user.userId,
      action: 'CREATE_GROUP',
      tableName: 'groups',
      newValue: group.toJSON(),
    });
    res.status(201).json(group.toJSON());
  } catch (err) {
    next(err);
  }
}
