import User from './User.js';

export default class Admin extends User {
  constructor(data = {}) {
    super(data);
    if (!this.role) this.role = 'admin';
  }

  async createUser(data, userRepo) {
    return userRepo.createWithRole(data);
  }

  async updateUser(id, data, userRepo) {
    const user = await userRepo.findById(id);
    if (!user) throw new Error('Пользователь не найден');
    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.role !== undefined) user.role = data.role;
    if (data.isBlocked !== undefined) user.isBlocked = data.isBlocked;
    return userRepo.save(user);
  }

  async deleteUser(id, userRepo) {
    await userRepo.deleteById(id);
  }

  async createGroup(data, groupRepo) {
    return groupRepo.create(data);
  }

  async updateGroup(id, data, groupRepo) {
    return groupRepo.update(id, data);
  }

  async deleteGroup(id, groupRepo) {
    await groupRepo.deleteById(id);
  }

  async createDiscipline(data, disciplineRepo) {
    return disciplineRepo.create(data);
  }

  async updateDiscipline(id, data, disciplineRepo) {
    return disciplineRepo.update(id, data);
  }

  async deleteDiscipline(id, disciplineRepo) {
    await disciplineRepo.deleteById(id);
  }

  async viewAuditLog(options, auditLogRepo) {
    return auditLogRepo.findAll(options);
  }
}
