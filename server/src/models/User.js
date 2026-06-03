import bcrypt from 'bcryptjs';

export default class User {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.login = data.login ?? '';
    this.passwordHash = data.passwordHash ?? data.password_hash ?? '';
    this.fullName = data.fullName ?? data.full_name ?? '';
    this.role = data.role ?? '';
    this.isBlocked = data.isBlocked ?? data.is_blocked ?? false;
  }

  verifyPassword(password) {
    return bcrypt.compareSync(password, this.passwordHash);
  }

  changePassword(newPwd) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
    this.passwordHash = bcrypt.hashSync(newPwd, saltRounds);
  }

  toJSON() {
    return {
      id: this.id,
      login: this.login,
      full_name: this.fullName,
      role: this.role,
      is_blocked: this.isBlocked,
    };
  }
}
