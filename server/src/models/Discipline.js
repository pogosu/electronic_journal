import { query } from '../config/db.js';

export default class Discipline {
  #id;
  #name;

  constructor(data = {}) {
    this.#id = data.id ?? null;
    this.#name = data.name ?? '';
  }

  get id() {
    return this.#id;
  }

  get name() {
    return this.#name;
  }

  set name(value) {
    this.#name = value;
  }

  static async findById(id) {
    const result = await query('SELECT * FROM disciplines WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return new Discipline(result.rows[0]);
  }

  static async findAll(options = {}) {
    const { orderBy = 'name', where = null } = options;
    let sql = 'SELECT * FROM disciplines';
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
    return result.rows.map((row) => new Discipline(row));
  }

  static async findOne(where) {
    const keys = Object.keys(where);
    const values = Object.values(where);
    const conditions = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    const result = await query(
      `SELECT * FROM disciplines WHERE ${conditions} LIMIT 1`,
      values
    );
    if (result.rows.length === 0) return null;
    return new Discipline(result.rows[0]);
  }

  static async findWithSearch(search) {
    if (!search) {
      return Discipline.findAll({ orderBy: 'name' });
    }
    const result = await query(
      'SELECT * FROM disciplines WHERE name ILIKE $1 ORDER BY name',
      [`%${search}%`]
    );
    return result.rows.map((row) => new Discipline(row));
  }

  static async deleteById(id) {
    await query('DELETE FROM disciplines WHERE id = $1', [id]);
  }

  async save() {
    if (this.#id) {
      await query('UPDATE disciplines SET name = $1 WHERE id = $2', [
        this.#name,
        this.#id,
      ]);
    } else {
      const result = await query(
        'INSERT INTO disciplines (name) VALUES ($1) RETURNING id',
        [this.#name]
      );
      this.#id = result.rows[0].id;
    }
  }

  async delete() {
    await query('DELETE FROM disciplines WHERE id = $1', [this.#id]);
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
    };
  }
}
