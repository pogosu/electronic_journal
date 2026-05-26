import bcrypt from 'bcryptjs';
import { query, getClient } from '../config/db.js';

export default class User {
  #id;
  #login;
  #passwordHash;
  #fullName;
  #role;
  #isBlocked;
  #createdAt;
  #updatedAt;

  constructor(data = {}) {
    this.#id = data.id ?? null;
    this.#login = data.login ?? '';
    this.#passwordHash = data.password_hash ?? data.passwordHash ?? '';
    this.#fullName = data.full_name ?? data.fullName ?? '';
    this.#role = data.role ?? '';
    this.#isBlocked = data.is_blocked ?? data.isBlocked ?? false;
    this.#createdAt = data.created_at ?? data.createdAt ?? null;
    this.#updatedAt = data.updated_at ?? data.updatedAt ?? null;
  }

  get id() {
    return this.#id;
  }

  get login() {
    return this.#login;
  }

  get fullName() {
    return this.#fullName;
  }

  get role() {
    return this.#role;
  }

  get isBlocked() {
    return this.#isBlocked;
  }

  get passwordHash() {
    return this.#passwordHash;
  }

  set fullName(value) {
    this.#fullName = value;
  }

  set role(value) {
    this.#role = value;
  }

  set isBlocked(value) {
    this.#isBlocked = value;
  }

  set passwordHash(value) {
    this.#passwordHash = value;
  }

  static async findById(id) {
    const result = await query(
      `SELECT u.*, r.name as role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  static async findByLogin(login) {
    const result = await query(
      `SELECT u.*, r.name as role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.login = $1`,
      [login]
    );
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  static async findByLoginWithDetails(login) {
    const result = await query(
      `SELECT u.*, r.name as role, t.department, s.group_id, g.name as group_name, g.admission_year as group_year
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN teachers t ON t.user_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN groups g ON g.id = s.group_id
       WHERE u.login = $1`,
      [login]
    );
    return result.rows[0] ?? null;
  }

  static async findByIdWithDetails(id) {
    const result = await query(
      `SELECT u.*, r.name as role, t.department, s.group_id, g.name as group_name, g.admission_year as group_year
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN teachers t ON t.user_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN groups g ON g.id = s.group_id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  static async findAll(options = {}) {
    const { search, role } = options;
    let sql = `SELECT u.id, u.login, u.full_name, r.name as role, u.is_blocked, u.created_at,
                      t.department, g.name as group_name, g.admission_year
               FROM users u
               JOIN roles r ON r.id = u.role_id
               LEFT JOIN teachers t ON t.user_id = u.id
               LEFT JOIN students s ON s.user_id = u.id
               LEFT JOIN groups g ON g.id = s.group_id`;
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`u.full_name ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }
    if (role) {
      conditions.push(`r.name = $${params.length + 1}`);
      params.push(role);
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY u.full_name';
    const result = await query(sql, params);
    return result.rows;
  }

  static async create({ login, password, fullName, role }) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
    const hash = await bcrypt.hash(password, saltRounds);
    const roleRes = await query('SELECT id FROM roles WHERE name = $1', [role]);
    if (roleRes.rows.length === 0) throw new Error('Неверная роль');
    const roleId = roleRes.rows[0].id;

    const result = await query(
      `INSERT INTO users (login, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [login, hash, fullName, roleId]
    );
    return new User({ ...result.rows[0], role });
  }

  static async createWithRole({ login, password, fullName, role, department, groupId }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
      const hash = await bcrypt.hash(password, saltRounds);

      const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [role]);
      if (roleRes.rows.length === 0) throw new Error('Неверная роль');
      const roleId = roleRes.rows[0].id;

      const userRes = await client.query(
        `INSERT INTO users (login, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [login, hash, fullName, roleId]
      );
      const userId = userRes.rows[0].id;

      if (role === 'teacher' && department) {
        await client.query('INSERT INTO teachers (user_id, department) VALUES ($1, $2)', [userId, department]);
      }
      if (role === 'student' && groupId) {
        await client.query('INSERT INTO students (user_id, group_id) VALUES ($1, $2)', [userId, groupId]);
      }

      await client.query('COMMIT');
      return { id: userId, login, fullName, role };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async save() {
    if (this.#id) {
      const roleRes = await query('SELECT id FROM roles WHERE name = $1', [this.#role]);
      if (roleRes.rows.length === 0) throw new Error('Неверная роль');
      await query(
        `UPDATE users SET full_name = $1, role_id = $2, is_blocked = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
        [this.#fullName, roleRes.rows[0].id, this.#isBlocked, this.#id]
      );
    }
  }

  async delete() {
    await query('DELETE FROM users WHERE id = $1', [this.#id]);
  }

  static async updateStudentGroup(userId, groupId) {
    await query('UPDATE students SET group_id = $1 WHERE user_id = $2', [groupId, userId]);
  }

  static async updateTeacherDepartment(userId, department) {
    await query('UPDATE teachers SET department = $1 WHERE user_id = $2', [department, userId]);
  }

  verifyPassword(password) {
    return bcrypt.compareSync(password, this.#passwordHash);
  }

  changePassword(newPwd) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
    this.#passwordHash = bcrypt.hashSync(newPwd, saltRounds);
  }

  toJSON() {
    return {
      id: this.#id,
      login: this.#login,
      fullName: this.#fullName,
      role: this.#role,
      isBlocked: this.#isBlocked,
    };
  }
}
