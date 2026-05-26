import User from './User.js';
import { query } from '../config/db.js';

export default class Teacher extends User {
  #teacherId;
  #department;

  constructor(data = {}) {
    super(data);
    this.#teacherId = data.teacher_id ?? data.teacherId ?? null;
    this.#department = data.department ?? '';
  }

  get teacherId() {
    return this.#teacherId;
  }

  get department() {
    return this.#department;
  }

  static async findByUserId(userId) {
    const result = await query(
      `SELECT u.*, r.name as role, t.id as teacher_id, t.department
       FROM users u
       JOIN roles r ON r.id = u.role_id
       JOIN teachers t ON t.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    if (result.rows.length === 0) return null;
    return new Teacher(result.rows[0]);
  }

  static async getIdByUserId(userId) {
    const result = await query('SELECT id FROM teachers WHERE user_id = $1', [userId]);
    return result.rows[0]?.id ?? null;
  }

  static async findById(teacherId) {
    const result = await query(
      `SELECT u.*, r.name as role, t.id as teacher_id, t.department
       FROM users u
       JOIN roles r ON r.id = u.role_id
       JOIN teachers t ON t.user_id = u.id
       WHERE t.id = $1`,
      [teacherId]
    );
    if (result.rows.length === 0) return null;
    return new Teacher(result.rows[0]);
  }

  async getJournals() {
    const result = await query(
      `SELECT j.*, g.name as group_name, d.name as discipline_name
       FROM journals j
       JOIN groups g ON g.id = j.group_id
       JOIN disciplines d ON d.id = j.discipline_id
       WHERE j.teacher_id = $1
       ORDER BY d.name, g.name`,
      [this.#teacherId]
    );
    return result.rows;
  }

  async getStudents() {
    const result = await query(
      `SELECT DISTINCT u.id, u.full_name, g.name as group_name, g.admission_year
       FROM students s
       JOIN users u ON u.id = s.user_id
       JOIN groups g ON g.id = s.group_id
       JOIN journals j ON j.group_id = s.group_id
       WHERE j.teacher_id = $1
       ORDER BY u.full_name`,
      [this.#teacherId]
    );
    return result.rows;
  }

  async getDisciplines() {
    const result = await query(
      `SELECT DISTINCT d.id, d.name
       FROM teacher_assignments ta
       JOIN disciplines d ON d.id = ta.discipline_id
       WHERE ta.teacher_id = $1
       ORDER BY d.name`,
      [this.#teacherId]
    );
    return result.rows;
  }

  async getGroupsForDiscipline(disciplineId) {
    const result = await query(
      `SELECT g.id, g.name, g.admission_year,
              gj.id as grade_journal_id, aj.id as attendance_journal_id, ta.semester,
              COALESCE((
                SELECT COUNT(DISTINCT s2.id)
                FROM students s2
                JOIN journals j2 ON j2.group_id = s2.group_id AND j2.discipline_id = $2
                JOIN works w2 ON w2.journal_id = j2.id AND w2.is_active = true AND w2.is_mandatory = true
                JOIN work_types wt2 ON wt2.id = w2.work_type_id AND wt2.slug IN ('credit', 'final_exam')
                JOIN grade_systems gs2 ON gs2.id = w2.grade_system_id
                LEFT JOIN grades gr2 ON gr2.work_id = w2.id AND gr2.student_id = s2.id
                WHERE s2.group_id = g.id
                  AND (
                    gr2.score IS NULL
                    OR (gs2.name = 'Зачёт/Незачёт' AND gr2.score = 0)
                    OR (gs2.name = '5-балльная' AND gr2.score < 3)
                    OR (gs2.name = 'Произвольная' AND gr2.score < w2.min_score)
                  )
              ), 0) as debt_count
       FROM teacher_assignments ta
       JOIN groups g ON g.id = ta.group_id
       LEFT JOIN journals gj ON gj.group_id = g.id AND gj.discipline_id = ta.discipline_id AND gj.type = 'grades' AND gj.semester = ta.semester
       LEFT JOIN journals aj ON aj.group_id = g.id AND aj.discipline_id = ta.discipline_id AND aj.type = 'attendance' AND aj.semester = ta.semester
       WHERE ta.teacher_id = $1 AND ta.discipline_id = $2`,
      [this.#teacherId, disciplineId]
    );
    return result.rows;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      teacherId: this.#teacherId,
      department: this.#department,
    };
  }
}
