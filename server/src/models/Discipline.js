import { Entity } from './base/index.js';

export default class Discipline extends Entity {
  static tableName = 'disciplines';
  static columns = ['name'];

  #name;

  constructor(data = {}) {
    super(data);
    this.#name = data.name ?? '';
  }

  get name() {
    return this.#name;
  }

  set name(value) {
    this.#name = value;
  }

  getColumnValues() {
    return [this.#name];
  }

  static async findWithSearch(search) {
    if (!search) {
      return Discipline.findAll({ orderBy: 'name' });
    }
    const { query } = await import('../config/db.js');
    const result = await query(
      'SELECT * FROM disciplines WHERE name ILIKE $1 ORDER BY name',
      [`%${search}%`]
    );
    return result.rows.map((row) => new Discipline(row));
  }

  toJSON() {
    return {
      id: this.id,
      name: this.#name,
    };
  }
}
