import { query } from '../config/db.js';
import Discipline from '../models/Discipline.js';

export default class DisciplineRepository {
  static async findAll(options = {}) {
    const { orderBy = 'name' } = options;
    const result = await query(`SELECT * FROM disciplines ORDER BY ${orderBy}`);
    return result.rows.map((row) => new Discipline(row));
  }

  static async findById(id) {
    const result = await query('SELECT * FROM disciplines WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return new Discipline(result.rows[0]);
  }

  static async findWithSearch(search) {
    if (!search) {
      return DisciplineRepository.findAll({ orderBy: 'name' });
    }
    const result = await query(
      'SELECT * FROM disciplines WHERE name ILIKE $1 ORDER BY name',
      [`%${search}%`]
    );
    return result.rows.map((row) => new Discipline(row));
  }

  static async create({ name }) {
    const result = await query(
      'INSERT INTO disciplines (name) VALUES ($1) RETURNING *',
      [name]
    );
    return new Discipline(result.rows[0]);
  }

  static async update(id, { name }) {
    const result = await query(
      'UPDATE disciplines SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    return new Discipline(result.rows[0]);
  }

  static async deleteById(id) {
    await query('DELETE FROM disciplines WHERE id = $1', [id]);
  }
}
