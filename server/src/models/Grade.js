import { query } from '../config/db.js';

export default class Grade {
  #id;
  #studentId;
  #workId;
  #score;
  #gradeDate;
  #teacherId;

  constructor(data = {}) {
    this.#id = data.id ?? null;
    this.#studentId = data.student_id ?? data.studentId ?? null;
    this.#workId = data.work_id ?? data.workId ?? null;
    this.#score = data.score !== null && data.score !== undefined ? parseFloat(data.score) : null;
    this.#gradeDate = data.grade_date ?? data.gradeDate ?? null;
    this.#teacherId = data.teacher_id ?? data.teacherId ?? null;
  }

  get id() { return this.#id; }
  get studentId() { return this.#studentId; }
  get workId() { return this.#workId; }
  get score() { return this.#score; }
  get gradeDate() { return this.#gradeDate; }
  get teacherId() { return this.#teacherId; }

  set score(value) { this.#score = value !== null && value !== undefined ? parseFloat(value) : null; }
  set teacherId(value) { this.#teacherId = value; }

  static async findById(id) {
    const result = await query('SELECT * FROM grades WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return new Grade(result.rows[0]);
  }

  static async findByStudent(studentId, options = {}) {
    let sql = `SELECT g.*, w.title as work_title, w.max_score, w.is_mandatory, d.name as discipline_name
               FROM grades g
               JOIN works w ON w.id = g.work_id
               JOIN journals j ON j.id = w.journal_id
               JOIN disciplines d ON d.id = j.discipline_id
               WHERE g.student_id = $1`;
    const params = [studentId];
    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    } else {
      sql += ` ORDER BY g.grade_date DESC`;
    }
    const result = await query(sql, params);
    return result.rows;
  }

  static async findByWork(workId) {
    const result = await query(
      `SELECT g.*, u.full_name as student_name
       FROM grades g
       JOIN students s ON s.id = g.student_id
       JOIN users u ON u.id = s.user_id
       WHERE g.work_id = $1`,
      [workId]
    );
    return result.rows.map((row) => new Grade(row));
  }

  static async findByJournal(journalId) {
    const result = await query(
      `SELECT g.student_id, g.work_id, g.score
       FROM grades g
       JOIN works w ON w.id = g.work_id
       WHERE w.journal_id = $1`,
      [journalId]
    );
    return result.rows.map((row) => new Grade(row));
  }

  static async findWithFilters({ studentId, workId, journalId, role, userId }) {
    let sql = `SELECT g.*, u.full_name as student_name, w.title as work_title, w.max_score, w.is_mandatory, d.name as discipline_name
               FROM grades g
               JOIN students s ON s.id = g.student_id
               JOIN users u ON u.id = s.user_id
               JOIN works w ON w.id = g.work_id
               JOIN journals j ON j.id = w.journal_id
               JOIN disciplines d ON d.id = j.discipline_id`;
    const params = [];
    const conditions = [];

    if (studentId) {
      conditions.push(`g.student_id = $${params.length + 1}`);
      params.push(studentId);
    }
    if (workId) {
      conditions.push(`g.work_id = $${params.length + 1}`);
      params.push(workId);
    }
    if (journalId) {
      conditions.push(`w.journal_id = $${params.length + 1}`);
      params.push(journalId);
    }
    if (role === 'student' && userId) {
      conditions.push(`g.student_id = (SELECT id FROM students WHERE user_id = $${params.length + 1})`);
      params.push(userId);
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY g.grade_date DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  async save() {
    if (this.#id) {
      await query(
        'UPDATE grades SET score = $1, grade_date = CURRENT_DATE, teacher_id = $2 WHERE id = $3',
        [this.#score, this.#teacherId, this.#id]
      );
    } else {
      const result = await query(
        `INSERT INTO grades (student_id, work_id, score, teacher_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [this.#studentId, this.#workId, this.#score, this.#teacherId]
      );
      this.#id = result.rows[0].id;
    }
  }

  async delete() {
    await query('DELETE FROM grades WHERE id = $1', [this.#id]);
  }

  static async findByStudentAndWork(studentId, workId) {
    const result = await query(
      'SELECT id FROM grades WHERE student_id = $1 AND work_id = $2',
      [studentId, workId]
    );
    return result.rows[0]?.id ?? null;
  }

  static async deleteByStudentAndWork(studentId, workId) {
    await query('DELETE FROM grades WHERE student_id = $1 AND work_id = $2', [studentId, workId]);
  }

  isDebt(work) {
    if (!work || !work.isMandatory) return false;
    if (this.#score === null) return false;
    const gradeSystem = work.gradeSystemName;
    if (gradeSystem === 'Зачёт/Незачёт') return this.#score === 0;
    if (gradeSystem === '5-балльная') return this.#score < 3;
    if (gradeSystem === 'Произвольная') return this.#score < work.minScore;
    return false;
  }

  toJSON() {
    return {
      id: this.#id,
      student_id: this.#studentId,
      work_id: this.#workId,
      score: this.#score,
      grade_date: this.#gradeDate,
      teacher_id: this.#teacherId,
    };
  }
}
