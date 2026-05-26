import { query } from '../config/db.js';

export default class LessonType {
  #id;
  #name;
  #slug;

  constructor(data = {}) {
    this.#id = data.id ?? null;
    this.#name = data.name ?? '';
    this.#slug = data.slug ?? '';
  }

  get id() {
    return this.#id;
  }

  get name() {
    return this.#name;
  }

  get slug() {
    return this.#slug;
  }

  static async findById(id) {
    const result = await query('SELECT * FROM lesson_types WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return new LessonType(result.rows[0]);
  }

  static async findAll(options = {}) {
    const { orderBy = 'name', where = null } = options;
    let sql = 'SELECT * FROM lesson_types';
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
    return result.rows.map((row) => new LessonType(row));
  }

  static async findOne(where) {
    const keys = Object.keys(where);
    const values = Object.values(where);
    const conditions = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    const result = await query(
      `SELECT * FROM lesson_types WHERE ${conditions} LIMIT 1`,
      values
    );
    if (result.rows.length === 0) return null;
    return new LessonType(result.rows[0]);
  }

  static async deleteById(id) {
    await query('DELETE FROM lesson_types WHERE id = $1', [id]);
  }

  async save() {
    if (this.#id) {
      await query('UPDATE lesson_types SET name = $1, slug = $2 WHERE id = $3', [
        this.#name,
        this.#slug,
        this.#id,
      ]);
    } else {
      const result = await query(
        'INSERT INTO lesson_types (name, slug) VALUES ($1, $2) RETURNING id',
        [this.#name, this.#slug]
      );
      this.#id = result.rows[0].id;
    }
  }

  async delete() {
    await query('DELETE FROM lesson_types WHERE id = $1', [this.#id]);
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      slug: this.#slug,
    };
  }
}
