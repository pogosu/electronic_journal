import UserRepository from '../repositories/UserRepository.js';
import AuditService from './AuditService.js';

class UserService {
  async createUserWithRole(data, user) {
    const result = await UserRepository.createWithRole(data);
    const auditValue = { id: result.id, login: result.login, full_name: result.fullName, role: result.role, department: result.department, group: result.group };
    await AuditService.logChange({ userId: user.userId, action: 'CREATE_USER', tableName: 'users', newValue: auditValue });
    return result;
  }

  async findAllWithDetails(options) {
    return UserRepository.findAll(options);
  }

  async findByIdWithDetails(id) {
    return UserRepository.findByIdWithDetails(id);
  }

  async updateUser(id, data, user) {
    const userObj = await UserRepository.findById(id);
    if (!userObj) throw new Error('Пользователь не найден');
    const oldValue = userObj.toJSON();

    if (data.fullName !== undefined) userObj.fullName = data.fullName;
    if (data.role !== undefined) userObj.role = data.role;
    if (data.isBlocked !== undefined) userObj.isBlocked = data.isBlocked;

    await UserRepository.save(userObj);
    await AuditService.logChange({ userId: user.userId, action: 'UPDATE_USER', tableName: 'users', oldValue, newValue: userObj.toJSON() });
    return userObj.toJSON();
  }

  async deleteUser(id, user) {
    const userObj = await UserRepository.findById(id);
    if (!userObj) throw new Error('Пользователь не найден');
    const oldValue = userObj.toJSON();
    await UserRepository.deleteById(id);
    await AuditService.logChange({ userId: user.userId, action: 'DELETE_USER', tableName: 'users', oldValue });
    return { deleted: true };
  }

  async updateStudentGroup(userId, groupId, actor) {
    await UserRepository.updateStudentGroup(userId, groupId);
    await AuditService.logChange({ userId: actor.userId, action: 'UPDATE_STUDENT_GROUP', tableName: 'students', newValue: { userId, groupId } });
  }

  async updateTeacherDepartment(userId, department, actor) {
    await UserRepository.updateTeacherDepartment(userId, department);
    await AuditService.logChange({ userId: actor.userId, action: 'UPDATE_TEACHER_DEPT', tableName: 'teachers', newValue: { userId, department } });
  }
}

export default new UserService();
