import { query, getClient } from '../config/db.js';
import { Entity } from './base/index.js';

export default class Assignment extends Entity {
  static tableName = 'teacher_assignments';
  static columns = ['teacher_id', 'group_id', 'discipline_id', 'semester'];

  #teacherId;
  #groupId;
  #disciplineId;
  #semester;
  #createdAt;

  constructor(data = {}) {
    super(data);
    this.#teacherId = data.teacher_id ?? data.teacherId ?? null;
    this.#groupId = data.group_id ?? data.groupId ?? null;
    this.#disciplineId = data.discipline_id ?? data.disciplineId ?? null;
    this.#semester = data.semester ?? '';
    this.#createdAt = data.created_at ?? data.createdAt ?? null;
  }

  get teacherId() { return this.#teacherId; }
  get groupId() { return this.#groupId; }
  get disciplineId() { return this.#disciplineId; }
  get semester() { return this.#semester; }

  getColumnValues() {
    return [this.#teacherId, this.#groupId, this.#disciplineId, this.#semester];
  }

  static async findAll(options = {}) {
    const { teacherUserId } = options;
    let sql = `SELECT ta.*, u.full_name as teacher_name, g.name as group_name, g.admission_year, d.name as discipline_name
               FROM teacher_assignments ta
               JOIN teachers t ON t.id = ta.teacher_id
               JOIN users u ON u.id = t.user_id
               JOIN groups g ON g.id = ta.group_id
               JOIN disciplines d ON d.id = ta.discipline_id`;
    const params = [];

    if (teacherUserId) {
      sql += ` WHERE ta.teacher_id = (SELECT id FROM teachers WHERE user_id = $1)`;
      params.push(teacherUserId);
    }
    sql += ' ORDER BY d.name, g.name';

    const result = await query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT ta.*, u.full_name as teacher_name, g.name as group_name, d.name as discipline_name
       FROM teacher_assignments ta
       JOIN teachers t ON t.id = ta.teacher_id
       JOIN users u ON u.id = t.user_id
       JOIN groups g ON g.id = ta.group_id
       JOIN disciplines d ON d.id = ta.discipline_id
       WHERE ta.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return new Assignment(result.rows[0]);
  }

  static async create({ teacherId, groupId, disciplineId, semester }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO teacher_assignments (teacher_id, group_id, discipline_id, semester)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [teacherId, groupId, disciplineId, semester]
      );

      await client.query(
        `INSERT INTO journals (group_id, teacher_id, discipline_id, semester, type)
         VALUES ($1, $2, $3, $4, 'grades')`,
        [groupId, teacherId, disciplineId, semester]
      );

      await client.query(
        `INSERT INTO journals (group_id, teacher_id, discipline_id, semester, type)
         VALUES ($1, $2, $3, $4, 'attendance')`,
        [groupId, teacherId, disciplineId, semester]
      );

      await client.query('COMMIT');
      return new Assignment(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async deleteJournals(assignment) {
    await query(
      `DELETE FROM journals
       WHERE teacher_id = $1 AND group_id = $2 AND discipline_id = $3 AND semester = $4`,
      [assignment.teacherId, assignment.groupId, assignment.disciplineId, assignment.semester]
    );
  }

  toJSON() {
    return {
      id: this.id,
      teacher_id: this.#teacherId,
      group_id: this.#groupId,
      discipline_id: this.#disciplineId,
      semester: this.#semester,
    };
  }
}
