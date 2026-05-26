import { query } from '../config/db.js';

export default class AuditLog {
  #action;
  #entityName;
  #oldValue;
  #newValue;
  #changedAt;
  #user;

  constructor(action, entityName, oldValue, newValue, changedAt, user) {
    this.#action = action;
    this.#entityName = entityName;
    this.#oldValue = oldValue;
    this.#newValue = newValue;
    this.#changedAt = changedAt;
    this.#user = user;
  }

  static async create({ userId, action, tableName, oldValue, newValue }) {
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, old_value, new_value, changed_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [userId, action, tableName, oldValue ? JSON.stringify(oldValue) : null, JSON.stringify(newValue)]
    );
  }

  static async findAll(options = {}) {
    const { startDate, endDate, userId, action, limit = 1000 } = options;
    let sql = `SELECT al.*, u.login, u.full_name
               FROM audit_logs al
               LEFT JOIN users u ON u.id = al.user_id`;
    const params = [];
    const conditions = [];

    if (startDate) {
      conditions.push(`al.changed_at >= $${params.length + 1}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`al.changed_at <= $${params.length + 1}`);
      params.push(endDate);
    }
    if (userId) {
      conditions.push(`al.user_id = $${params.length + 1}`);
      params.push(userId);
    }
    if (action) {
      conditions.push(`al.action = $${params.length + 1}`);
      params.push(action);
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ` ORDER BY al.changed_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }

  get action() {
    return this.#action;
  }

  get entityName() {
    return this.#entityName;
  }

  get oldValue() {
    return this.#oldValue;
  }

  get newValue() {
    return this.#newValue;
  }

  get changedAt() {
    return this.#changedAt;
  }

  get user() {
    return this.#user;
  }

  log(user, action, entityName, data) {
    this.#user = user;
    this.#action = action;
    this.#entityName = entityName;
    this.#newValue = data;
    this.#changedAt = new Date();
  }

  toJSON() {
    return {
      action: this.#action,
      entityName: this.#entityName,
      oldValue: this.#oldValue,
      newValue: this.#newValue,
      changedAt: this.#changedAt,
      user: this.#user ? this.#user.login : null,
    };
  }
}
