import { query } from '../config/db.js';
import { Entity } from './base/index.js';

export default class Lesson extends Entity {
  static tableName = 'lessons';
  static columns = ['journal_id', 'lesson_date', 'lesson_type_id', 'display_order'];

  #journalId;
  #lessonDate;
  #lessonTypeId;
  #lessonTypeName;
  #lessonTypeSlug;
  #displayOrder;

  constructor(data = {}) {
    super(data);
    this.#journalId = data.journal_id ?? data.journalId ?? null;
    this.#lessonDate = data.lesson_date ?? data.lessonDate ?? null;
    this.#lessonTypeId = data.lesson_type_id ?? data.lessonTypeId ?? null;
    this.#lessonTypeName = data.lesson_type_name ?? data.lessonTypeName ?? null;
    this.#lessonTypeSlug = data.lesson_type_slug ?? data.lessonTypeSlug ?? null;
    this.#displayOrder = data.display_order ?? data.displayOrder ?? 0;
  }

  get journalId() { return this.#journalId; }
  get lessonDate() { return this.#lessonDate; }
  get lessonTypeId() { return this.#lessonTypeId; }
  get lessonTypeName() { return this.#lessonTypeName; }
  get lessonTypeSlug() { return this.#lessonTypeSlug; }
  get displayOrder() { return this.#displayOrder; }

  set lessonDate(value) { this.#lessonDate = value; }
  set lessonTypeId(value) { this.#lessonTypeId = value; }
  set displayOrder(value) { this.#displayOrder = value; }

  getColumnValues() {
    return [this.#journalId, this.#lessonDate, this.#lessonTypeId, this.#displayOrder];
  }

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

  toJSON() {
    return {
      id: this.id,
      journal_id: this.#journalId,
      lesson_date: this.#lessonDate,
      lesson_type_id: this.#lessonTypeId,
      lesson_type_name: this.#lessonTypeName,
      lesson_type_slug: this.#lessonTypeSlug,
      display_order: this.#displayOrder,
    };
  }
}
