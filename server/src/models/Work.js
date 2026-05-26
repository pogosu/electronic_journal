import { query } from '../config/db.js';

export default class Work {
  #id;
  #journalId;
  #title;
  #workTypeId;
  #workTypeName;
  #gradeSystemId;
  #gradeSystemName;
  #minScore;
  #maxScore;
  #isMandatory;
  #deadline;
  #displayOrder;
  #isActive;

  constructor(data = {}) {
    this.#id = data.id ?? null;
    this.#journalId = data.journal_id ?? data.journalId ?? null;
    this.#title = data.title ?? '';
    this.#workTypeId = data.work_type_id ?? data.workTypeId ?? null;
    this.#workTypeName = data.work_type_name ?? data.workTypeName ?? null;
    this.#gradeSystemId = data.grade_system_id ?? data.gradeSystemId ?? null;
    this.#gradeSystemName = data.grade_system_name ?? data.gradeSystemName ?? null;
    this.#minScore = parseFloat(data.min_score ?? data.minScore ?? 0);
    this.#maxScore = parseFloat(data.max_score ?? data.maxScore ?? 0);
    this.#isMandatory = data.is_mandatory ?? data.isMandatory ?? true;
    this.#deadline = data.deadline ?? null;
    this.#displayOrder = data.display_order ?? data.displayOrder ?? 0;
    this.#isActive = data.is_active ?? data.isActive ?? true;
  }

  get id() { return this.#id; }
  get journalId() { return this.#journalId; }
  get title() { return this.#title; }
  get workTypeId() { return this.#workTypeId; }
  get workTypeName() { return this.#workTypeName; }
  get gradeSystemId() { return this.#gradeSystemId; }
  get gradeSystemName() { return this.#gradeSystemName; }
  get minScore() { return this.#minScore; }
  get maxScore() { return this.#maxScore; }
  get isMandatory() { return this.#isMandatory; }
  get deadline() { return this.#deadline; }
  get displayOrder() { return this.#displayOrder; }
  get isActive() { return this.#isActive; }

  set title(value) { this.#title = value; }
  set workTypeId(value) { this.#workTypeId = value; }
  set gradeSystemId(value) { this.#gradeSystemId = value; }
  set minScore(value) { this.#minScore = parseFloat(value); }
  set maxScore(value) { this.#maxScore = parseFloat(value); }
  set isMandatory(value) { this.#isMandatory = value; }
  set deadline(value) { this.#deadline = value; }
  set displayOrder(value) { this.#displayOrder = value; }

  static async findById(id) {
    const result = await query(
      `SELECT w.*, wt.name as work_type_name, gs.name as grade_system_name
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
      `SELECT w.*, wt.name as work_type_name, gs.name as grade_system_name
       FROM works w
       JOIN work_types wt ON wt.id = w.work_type_id
       JOIN grade_systems gs ON gs.id = w.grade_system_id
       WHERE w.journal_id = $1 AND w.is_active = true
       ORDER BY w.display_order, w.id`,
      [journalId]
    );
    return result.rows.map((row) => new Work(row));
  }

  static async findDictionaries() {
    const [workTypesRes, gradeSystemsRes, lessonTypesRes] = await Promise.all([
      query('SELECT * FROM work_types ORDER BY name'),
      query('SELECT * FROM grade_systems ORDER BY name'),
      query('SELECT * FROM lesson_types ORDER BY name'),
    ]);
    return {
      workTypes: workTypesRes.rows,
      gradeSystems: gradeSystemsRes.rows.filter((s) => s.name !== '100-балльная'),
      lessonTypes: lessonTypesRes.rows,
    };
  }

  validateScore(score) {
    const num = parseFloat(score);
    return num >= this.#minScore && num <= this.#maxScore;
  }

  async save() {
    if (this.#id) {
      await query(
        `UPDATE works SET title = $1, work_type_id = $2, grade_system_id = $3, min_score = $4, max_score = $5,
         is_mandatory = $6, deadline = $7, display_order = $8 WHERE id = $9`,
        [this.#title, this.#workTypeId, this.#gradeSystemId, this.#minScore, this.#maxScore,
         this.#isMandatory, this.#deadline, this.#displayOrder, this.#id]
      );
    } else {
      const result = await query(
        `INSERT INTO works (journal_id, title, work_type_id, grade_system_id, min_score, max_score, is_mandatory, deadline, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [this.#journalId, this.#title, this.#workTypeId, this.#gradeSystemId, this.#minScore, this.#maxScore,
         this.#isMandatory, this.#deadline, this.#displayOrder]
      );
      this.#id = result.rows[0].id;
    }
  }

  async delete() {
    const gradesRes = await query('SELECT COUNT(*) FROM grades WHERE work_id = $1', [this.#id]);
    if (parseInt(gradesRes.rows[0].count) > 0) {
      await query('UPDATE works SET is_active = false WHERE id = $1', [this.#id]);
    } else {
      await query('DELETE FROM works WHERE id = $1', [this.#id]);
    }
  }

  static async reorder(journalId, workIds) {
    for (let i = 0; i < workIds.length; i++) {
      await query(
        'UPDATE works SET display_order = $1 WHERE id = $2 AND journal_id = $3',
        [i, workIds[i], journalId]
      );
    }
  }

  toJSON() {
    return {
      id: this.#id,
      journal_id: this.#journalId,
      title: this.#title,
      work_type_id: this.#workTypeId,
      work_type_name: this.#workTypeName,
      grade_system_id: this.#gradeSystemId,
      grade_system_name: this.#gradeSystemName,
      min_score: this.#minScore,
      max_score: this.#maxScore,
      is_mandatory: this.#isMandatory,
      deadline: this.#deadline,
      display_order: this.#displayOrder,
      is_active: this.#isActive,
    };
  }
}
