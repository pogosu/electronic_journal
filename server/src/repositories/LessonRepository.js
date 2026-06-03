import { query } from '../config/db.js';
import Lesson from '../models/Lesson.js';

export default class LessonRepository {
  static async findById(id) {
    const result = await query(
      `SELECT l.*, lt.name as lesson_type_name, lt.slug as lesson_type_slug
       FROM lessons l
       JOIN lesson_types lt ON lt.id = l.lesson_type_id
       WHERE l.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return new Lesson(result.rows[0]);
  }

  static async findByJournal(journalId) {
    const result = await query(
      `SELECT l.*, lt.name as lesson_type_name, lt.slug as lesson_type_slug
       FROM lessons l
       JOIN lesson_types lt ON lt.id = l.lesson_type_id
       WHERE l.journal_id = $1
       ORDER BY l.display_order, l.lesson_date`,
      [journalId]
    );
    return result.rows.map((row) => new Lesson(row));
  }

  static async create({ journalId, lessonDate, lessonTypeId, displayOrder }) {
    const result = await query(
      `INSERT INTO lessons (journal_id, lesson_date, lesson_type_id, display_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [journalId, lessonDate, lessonTypeId, displayOrder]
    );
    return LessonRepository.findById(result.rows[0].id);
  }

  static async update(id, { lessonDate, lessonTypeId, displayOrder }) {
    await query(
      'UPDATE lessons SET lesson_date = $1, lesson_type_id = $2, display_order = $3 WHERE id = $4',
      [lessonDate, lessonTypeId, displayOrder, id]
    );
    return LessonRepository.findById(id);
  }

  static async deleteById(id) {
    await query('DELETE FROM lessons WHERE id = $1', [id]);
  }

  static async canDelete(id) {
    const result = await query('SELECT id FROM attendances WHERE lesson_id = $1 LIMIT 1', [id]);
    return result.rows.length === 0;
  }

  static async reorder(journalId, lessonIds) {
    for (let i = 0; i < lessonIds.length; i++) {
      await query(
        'UPDATE lessons SET display_order = $1 WHERE id = $2 AND journal_id = $3',
        [i, lessonIds[i], journalId]
      );
    }
  }
}
