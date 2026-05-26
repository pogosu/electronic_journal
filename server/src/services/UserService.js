import User from '../models/User.js';
import AuditService from './AuditService.js';

class UserService {
  async createUserWithRole(data, user) {
    const result = await User.createWithRole(data);
    await AuditService.logChange({ userId: user.userId, action: 'CREATE_USER', tableName: 'users', newValue: result });
    return result;
  }

  async findAllWithDetails(options) {
    return User.findAll(options);
  }

  async findByIdWithDetails(id) {
    return User.findByIdWithDetails(id);
  }

  async updateUser(id, data, user) {
    const userObj = await User.findById(id);
    if (!userObj) throw new Error('Пользователь не найден');
    const oldValue = userObj.toJSON();

    if (data.fullName) userObj.fullName = data.fullName;
    if (data.role) userObj.role = data.role;
    if (data.isBlocked !== undefined) userObj.isBlocked = data.isBlocked;

    await userObj.save();
    await AuditService.logChange({ userId: user.userId, action: 'UPDATE_USER', tableName: 'users', oldValue, newValue: userObj.toJSON() });
    return userObj.toJSON();
  }

  async deleteUser(id, user) {
    const userObj = await User.findById(id);
    if (!userObj) throw new Error('Пользователь не найден');
    const oldValue = userObj.toJSON();
    await userObj.delete();
    await AuditService.logChange({ userId: user.userId, action: 'DELETE_USER', tableName: 'users', oldValue });
    return { deleted: true };
  }

  async updateStudentGroup(userId, groupId, actor) {
    await User.updateStudentGroup(userId, groupId);
    await AuditService.logChange({ userId: actor.userId, action: 'UPDATE_STUDENT_GROUP', tableName: 'students', newValue: { userId, groupId } });
  }

  async updateTeacherDepartment(userId, department, actor) {
    await User.updateTeacherDepartment(userId, department);
    await AuditService.logChange({ userId: actor.userId, action: 'UPDATE_TEACHER_DEPT', tableName: 'teachers', newValue: { userId, department } });
  }
}

export default new UserService();
