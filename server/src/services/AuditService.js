import AuditLog from '../models/AuditLog.js';

class AuditService {
  async logChange({ userId, action, tableName, oldValue, newValue }) {
    await AuditLog.create({ userId, action, tableName, oldValue, newValue });
  }

  async findLogs(options = {}) {
    return AuditLog.findAll(options);
  }
}

export default new AuditService();
