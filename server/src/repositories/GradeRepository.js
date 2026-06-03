import { query } from '../config/db.js';
import Grade from '../models/Grade.js';

export default class GradeRepository {
  static async findById(id) {
    const result = await query('SELECT * FROM grades WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return new Grade(result.rows[0]);
  }

  static async findFullById(id) {
    const result = await query(
      `SELECT g.*, u.full_name as student_name, w.title as work_title, w.max_score, w.min_score, w.is_mandatory, d.name as discipline_name, gs.name as grade_system_name
       FROM grades g
       JOIN students s ON s.id = g.student_id
       JOIN users u ON u.id = s.user_id
       JOIN works w ON w.id = g.work_id
       JOIN journals j ON j.id = w.journal_id
       JOIN disciplines d ON d.id = j.discipline_id
       LEFT JOIN grade_systems gs ON gs.id = w.grade_system_id
       WHERE g.id = $1`,
      [id]
    );
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

  static async save(grade) {
    if (grade.id) {
      await query(
        'UPDATE grades SET score = $1, grade_date = CURRENT_DATE, teacher_id = $2 WHERE id = $3',
        [grade.score, grade.teacherId, grade.id]
      );
    } else {
      const result = await query(
        `INSERT INTO grades (student_id, work_id, score, teacher_id) VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id, work_id) DO UPDATE SET score = EXCLUDED.score, grade_date = CURRENT_DATE, teacher_id = EXCLUDED.teacher_id
         RETURNING id`,
        [grade.studentId, grade.workId, grade.score, grade.teacherId]
      );
      if (result.rows[0]?.id) {
        grade.id = result.rows[0].id;
      }
    }
    return grade;
  }
}
