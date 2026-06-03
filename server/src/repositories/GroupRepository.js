import { query } from '../config/db.js';
import Group from '../models/Group.js';

export default class GroupRepository {
  static async findAll(options = {}) {
    const { orderBy = 'name' } = options;
    const result = await query(`SELECT * FROM groups ORDER BY ${orderBy}`);
    return result.rows.map((row) => new Group(row));
  }

  static async findById(id) {
    const result = await query('SELECT * FROM groups WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return new Group(result.rows[0]);
  }

  static async create({ name, admissionYear }) {
    const result = await query(
      'INSERT INTO groups (name, admission_year) VALUES ($1, $2) RETURNING *',
      [name, admissionYear]
    );
    return new Group(result.rows[0]);
  }

  static async update(id, { name, admissionYear }) {
    const result = await query(
      'UPDATE groups SET name = $1, admission_year = $2 WHERE id = $3 RETURNING *',
      [name, admissionYear, id]
    );
    return new Group(result.rows[0]);
  }

  static async deleteById(id) {
    await query('DELETE FROM groups WHERE id = $1', [id]);
  }

  static async hasStudents(id) {
    const result = await query('SELECT COUNT(*) as cnt FROM students WHERE group_id = $1', [id]);
    return parseInt(result.rows[0].cnt, 10) > 0;
  }

  static async getStudentCount(id) {
    const result = await query('SELECT COUNT(*) as cnt FROM students WHERE group_id = $1', [id]);
    return parseInt(result.rows[0].cnt, 10);
  }
}
