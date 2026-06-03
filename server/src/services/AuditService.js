import AuditLogRepository from '../repositories/AuditLogRepository.js';

class AuditService {
  async logChange({ userId, action, tableName, oldValue, newValue }) {
    await AuditLogRepository.create({ userId, action, tableName, oldValue, newValue });
  }

  async findLogs(options = {}) {
    return AuditLogRepository.findAll(options);
  }
}

export default new AuditService();
