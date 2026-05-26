import { query } from '../config/db.js';

export default class Attendance {
  #id;
  #studentId;
  #lessonId;
  #status;
  #attendanceDate;

  constructor(data = {}) {
    this.#id = data.id ?? null;
    this.#studentId = data.student_id ?? data.studentId ?? null;
    this.#lessonId = data.lesson_id ?? data.lessonId ?? null;
    this.#status = data.status ?? null;
    this.#attendanceDate = data.attendance_date ?? data.attendanceDate ?? null;
  }

  get id() { return this.#id; }
  get studentId() { return this.#studentId; }
  get lessonId() { return this.#lessonId; }
  get status() { return this.#status; }
  get attendanceDate() { return this.#attendanceDate; }

  set status(value) { this.#status = value; }

  static async findById(id) {
    const result = await query('SELECT * FROM attendances WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return new Attendance(result.rows[0]);
  }

  static async findByStudent(studentId) {
    const result = await query(
      `SELECT a.*, l.lesson_date, lt.name as lesson_type_name, lt.slug as lesson_type_slug, d.name as discipline_name, j.semester
       FROM attendances a
       JOIN lessons l ON l.id = a.lesson_id
       JOIN lesson_types lt ON lt.id = l.lesson_type_id
       JOIN journals j ON j.id = l.journal_id
       JOIN disciplines d ON d.id = j.discipline_id
       WHERE a.student_id = $1
       ORDER BY l.lesson_date DESC`,
      [studentId]
    );
    return result.rows;
  }

  static async findByLesson(lessonId) {
    const result = await query(
      `SELECT a.*, u.full_name as student_name
       FROM attendances a
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.user_id
       WHERE a.lesson_id = $1`,
      [lessonId]
    );
    return result.rows.map((row) => new Attendance(row));
  }

  static async findByJournal(journalId) {
    const result = await query(
      `SELECT a.student_id, a.lesson_id, a.status
       FROM attendances a
       JOIN lessons l ON l.id = a.lesson_id
       WHERE l.journal_id = $1`,
      [journalId]
    );
    return result.rows.map((row) => new Attendance(row));
  }

  static async getStatsByJournal(journalId) {
    const result = await query(
      `SELECT a.status, COUNT(*) as count
       FROM attendances a
       JOIN lessons l ON l.id = a.lesson_id
       WHERE l.journal_id = $1
       GROUP BY a.status`,
      [journalId]
    );
    return result.rows;
  }

  static async findWithFilters({ lessonId, studentId, journalId, role, userId }) {
    let sql = `SELECT a.*, u.full_name as student_name, l.lesson_date, lt.name as lesson_type_name, lt.slug as lesson_type_slug, d.name as discipline_name
               FROM attendances a
               JOIN students s ON s.id = a.student_id
               JOIN users u ON u.id = s.user_id
               JOIN lessons l ON l.id = a.lesson_id
               JOIN lesson_types lt ON lt.id = l.lesson_type_id
               JOIN journals j ON j.id = l.journal_id
               JOIN disciplines d ON d.id = j.discipline_id`;
    const params = [];
    const conditions = [];

    if (lessonId) {
      conditions.push(`a.lesson_id = $${params.length + 1}`);
      params.push(lessonId);
    }
    if (studentId) {
      conditions.push(`a.student_id = $${params.length + 1}`);
      params.push(studentId);
    }
    if (journalId) {
      conditions.push(`l.journal_id = $${params.length + 1}`);
      params.push(journalId);
    }
    if (role === 'student' && userId) {
      conditions.push(`a.student_id = (SELECT id FROM students WHERE user_id = $${params.length + 1})`);
      params.push(userId);
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY l.lesson_date DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  async save() {
    if (this.#id) {
      await query(
        'UPDATE attendances SET status = $1, attendance_date = CURRENT_DATE WHERE id = $2',
        [this.#status, this.#id]
      );
    } else {
      const result = await query(
        `INSERT INTO attendances (student_id, lesson_id, status) VALUES ($1, $2, $3)
         ON CONFLICT (student_id, lesson_id) DO UPDATE SET status = EXCLUDED.status, attendance_date = CURRENT_DATE
         RETURNING id`,
        [this.#studentId, this.#lessonId, this.#status]
      );
      this.#id = result.rows[0]?.id ?? this.#id;
    }
  }

  async delete() {
    await query('DELETE FROM attendances WHERE id = $1', [this.#id]);
  }

  isAbsent() {
    return this.#status === 'absent';
  }

  toJSON() {
    return {
      id: this.#id,
      student_id: this.#studentId,
      lesson_id: this.#lessonId,
      status: this.#status,
      attendance_date: this.#attendanceDate,
    };
  }
}
