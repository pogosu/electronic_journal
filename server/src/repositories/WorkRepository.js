import { query } from '../config/db.js';
import Work from '../models/Work.js';

export default class WorkRepository {
  static async findById(id) {
    const result = await query(
      `SELECT w.*, wt.name as work_type_name, wt.slug as work_type_slug, gs.name as grade_system_name
       FROM works w
       JOIN work_types wt ON wt.id = w.work_type_id
       JOIN grade_systems gs ON gs.id = w.grade_system_id
       WHERE w.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return new Work(result.rows[0]);
  }

  static async findByJournal(journalId) {
    const result = await query(
      `SELECT w.*, wt.name as work_type_name, wt.slug as work_type_slug, gs.name as grade_system_name
       FROM works w
       JOIN work_types wt ON wt.id = w.work_type_id
       JOIN grade_systems gs ON gs.id = w.grade_system_id
       WHERE w.journal_id = $1
       ORDER BY w.display_order, w.id`,
      [journalId]
    );
    return result.rows.map((row) => new Work(row));
  }

  static async create({ journalId, title, workTypeId, gradeSystemId, minScore, maxScore, isMandatory, deadline, displayOrder }) {
    const result = await query(
      `INSERT INTO works (journal_id, title, work_type_id, grade_system_id, min_score, max_score, is_mandatory, deadline, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [journalId, title, workTypeId, gradeSystemId, minScore, maxScore, isMandatory, deadline, displayOrder]
    );
    return WorkRepository.findById(result.rows[0].id);
  }

  static async update(id, { title, workTypeId, gradeSystemId, minScore, maxScore, isMandatory, deadline }) {
    await query(
      `UPDATE works SET title = $1, work_type_id = $2, grade_system_id = $3, min_score = $4, max_score = $5, is_mandatory = $6, deadline = $7
       WHERE id = $8`,
      [title, workTypeId, gradeSystemId, minScore, maxScore, isMandatory, deadline, id]
    );
    return WorkRepository.findById(id);
  }

  static async deleteById(id) {
    await query('DELETE FROM works WHERE id = $1', [id]);
  }

  static async reorder(journalId, workIds) {
    for (let i = 0; i < workIds.length; i++) {
      await query(
        'UPDATE works SET display_order = $1 WHERE id = $2 AND journal_id = $3',
        [i, workIds[i], journalId]
      );
    }
  }

  static async findDictionaries() {
    const [workTypes, gradeSystems, lessonTypes] = await Promise.all([
      query('SELECT * FROM work_types ORDER BY name'),
      query('SELECT * FROM grade_systems ORDER BY name'),
      query('SELECT * FROM lesson_types ORDER BY name'),
    ]);
    return {
      workTypes: workTypes.rows,
      gradeSystems: gradeSystems.rows,
      lessonTypes: lessonTypes.rows,
    };
  }
}
