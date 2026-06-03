export default class AuditLog {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.action = data.action;
    this.entityName = data.entityName ?? data.table_name ?? null;
    this.oldValue = data.oldValue ?? data.old_value ?? null;
    this.newValue = data.newValue ?? data.new_value ?? null;
    this.changedAt = data.changedAt ?? data.changed_at ?? null;
    this.userId = data.userId ?? data.user_id ?? null;
    this.login = data.login;
    this.fullName = data.fullName ?? data.full_name ?? null;
  }

  toJSON() {
    return {
      id: this.id,
      action: this.action,
      table_name: this.entityName,
      old_value: this.oldValue,
      new_value: this.newValue,
      changed_at: this.changedAt,
      user_id: this.userId,
      login: this.login,
      full_name: this.fullName,
    };
  }
}
