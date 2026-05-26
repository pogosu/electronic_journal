import { query } from '../config/db.js';

export default class Group {
  #id;
  #name;
  #admissionYear;

  constructor(data = {}) {
    this.#id = data.id ?? null;
    this.#name = data.name ?? '';
    this.#admissionYear = data.admission_year ?? data.admissionYear ?? 0;
  }

  get id() {
    return this.#id;
  }

  get name() {
    return this.#name;
  }

  get admissionYear() {
    return this.#admissionYear;
  }

  get course() {
    const now = new Date();
    return now.getFullYear() - this.#admissionYear + (now.getMonth() >= 8 ? 1 : 0);
  }

  set name(value) {
    this.#name = value;
  }

  set admissionYear(value) {
    this.#admissionYear = value;
  }

  static async findById(id) {
    const result = await query('SELECT * FROM groups WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return new Group(result.rows[0]);
  }

  static async findAll(options = {}) {
    const { orderBy = 'name', where = null } = options;
    let sql = 'SELECT * FROM groups';
    const params = [];

    if (where) {
      const keys = Object.keys(where);
      const conditions = keys.map((k, i) => {
        params.push(where[k]);
        return `${k} = $${i + 1}`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY ${orderBy}`;
    const result = await query(sql, params);
    return result.rows.map((row) => new Group(row));
  }

  static async findOne(where) {
    const keys = Object.keys(where);
    const values = Object.values(where);
    const conditions = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    const result = await query(
      `SELECT * FROM groups WHERE ${conditions} LIMIT 1`,
      values
    );
    if (result.rows.length === 0) return null;
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

  async save() {
    if (this.#id) {
      await query('UPDATE groups SET name = $1, admission_year = $2 WHERE id = $3', [
        this.#name,
        this.#admissionYear,
        this.#id,
      ]);
    } else {
      const result = await query(
        'INSERT INTO groups (name, admission_year) VALUES ($1, $2) RETURNING id',
        [this.#name, this.#admissionYear]
      );
      this.#id = result.rows[0].id;
    }
  }

  async delete() {
    await query('DELETE FROM groups WHERE id = $1', [this.#id]);
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      admission_year: this.#admissionYear,
      course: this.course,
    };
  }
}
