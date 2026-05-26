import User from './User.js';
import Group from './Group.js';
import Discipline from './Discipline.js';
import AuditLog from './AuditLog.js';

/**
 * Администратор системы.
 * Имеет полный доступ к управлению пользователями, группами, дисциплинами и аудиту.
 */
export default class Admin extends User {
  constructor(data = {}) {
    super(data);
    if (!this.role) this.role = 'admin';
  }

  // ==================== Users ====================

  async findAllUsers(options = {}) {
    return User.findAll(options);
  }

  async createUser(data) {
    return User.createWithRole(data);
  }

  async updateUser(id, data) {
    const user = await User.findById(id);
    if (!user) throw new Error('Пользователь не найден');
    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.role !== undefined) user.role = data.role;
    if (data.isBlocked !== undefined) user.isBlocked = data.isBlocked;
    await user.save();
    return user;
  }

  async deleteUser(id) {
    const user = await User.findById(id);
    if (!user) throw new Error('Пользователь не найден');
    await user.delete();
    return { deleted: true };
  }

  async updateStudentGroup(userId, groupId) {
    await User.updateStudentGroup(userId, groupId);
    return { updated: true };
  }

  async updateTeacherDepartment(userId, department) {
    await User.updateTeacherDepartment(userId, department);
    return { updated: true };
  }

  // ==================== Groups ====================

  async findAllGroups() {
    return Group.findAll({ orderBy: 'name' });
  }

  async createGroup(data) {
    const group = new Group(data);
    await group.save();
    return group;
  }

  async updateGroup(id, data) {
    const group = await Group.findById(id);
    if (!group) throw new Error('Группа не найдена');
    if (data.name !== undefined) group.name = data.name;
    if (data.admissionYear !== undefined) group.admissionYear = data.admissionYear;
    await group.save();
    return group;
  }

  async deleteGroup(id) {
    const hasStudents = await Group.hasStudents(id);
    if (hasStudents) throw new Error('Нельзя удалить группу с студентами');
    await Group.deleteById(id);
    return { deleted: true };
  }

  // ==================== Disciplines ====================

  async findAllDisciplines() {
    return Discipline.findAll({ orderBy: 'name' });
  }

  async findDisciplinesBySearch(search) {
    return Discipline.findWithSearch(search);
  }

  async createDiscipline(data) {
    const discipline = new Discipline(data);
    await discipline.save();
    return discipline;
  }

  async updateDiscipline(id, data) {
    const discipline = await Discipline.findById(id);
    if (!discipline) throw new Error('Дисциплина не найдена');
    if (data.name !== undefined) discipline.name = data.name;
    await discipline.save();
    return discipline;
  }

  async deleteDiscipline(id) {
    await Discipline.deleteById(id);
    return { deleted: true };
  }

  // ==================== Audit Logs ====================

  async getAuditLogs(options = {}) {
    return AuditLog.findAll(options);
  }

  // ==================== Permissions ====================

  canManageUsers() { return true; }
  canManageGroups() { return true; }
  canManageDisciplines() { return true; }
  canViewAuditLogs() { return true; }
  canViewAllJournals() { return true; }
  canViewAllStudents() { return true; }

  toJSON() {
    return { ...super.toJSON() };
  }
}
