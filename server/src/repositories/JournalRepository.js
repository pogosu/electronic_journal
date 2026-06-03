import { query } from '../config/db.js';
import Journal from '../models/Journal.js';

export default class JournalRepository {
  static async findById(id) {
    const result = await query(
      `SELECT j.*, g.name as group_name, g.admission_year, u.full_name as teacher_name, d.name as discipline_name
       FROM journals j
       JOIN groups g ON g.id = j.group_id
       JOIN teachers t ON t.id = j.teacher_id
       JOIN users u ON u.id = t.user_id
       JOIN disciplines d ON d.id = j.discipline_id
       WHERE j.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return new Journal(result.rows[0]);
  }

  static async findAll(options = {}) {
    const { groupId, teacherId, discipline, type } = options;
    let sql = `SELECT j.*, g.name as group_name, g.admission_year, u.full_name as teacher_name, d.name as discipline_name
               FROM journals j
               JOIN groups g ON g.id = j.group_id
               JOIN teachers t ON t.id = j.teacher_id
               JOIN users u ON u.id = t.user_id
               JOIN disciplines d ON d.id = j.discipline_id`;
    const params = [];
    const conditions = [];
    if (groupId) { conditions.push(`j.group_id = $${params.length + 1}`); params.push(groupId); }
    if (teacherId) { conditions.push(`j.teacher_id = $${params.length + 1}`); params.push(teacherId); }
    if (discipline) { conditions.push(`d.name ILIKE $${params.length + 1}`); params.push(`%${discipline}%`); }
    if (type) { conditions.push(`j.type = $${params.length + 1}`); params.push(type); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY d.name, g.name';
    const result = await query(sql, params);
    return result.rows.map((row) => new Journal(row));
  }

  static async create({ groupId, teacherId, disciplineId, semester, type }) {
    const result = await query(
      `INSERT INTO journals (group_id, teacher_id, discipline_id, semester, type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [groupId, teacherId, disciplineId, semester, type]
    );
    return JournalRepository.findById(result.rows[0].id);
  }

  static async getWorks(journalId) {
    const result = await query(
      `SELECT w.*, wt.name as work_type_name, wt.slug as work_type_slug, gs.name as grade_system_name
       FROM works w
       JOIN work_types wt ON wt.id = w.work_type_id
       JOIN grade_systems gs ON gs.id = w.grade_system_id
       WHERE w.journal_id = $1
       ORDER BY w.display_order, w.id`,
      [journalId]
    );
    return result.rows;
  }

  static async getLessons(journalId) {
    const result = await query(
      `SELECT l.*, lt.name as lesson_type_name, lt.slug as lesson_type_slug
       FROM lessons l
       JOIN lesson_types lt ON lt.id = l.lesson_type_id
       WHERE l.journal_id = $1
       ORDER BY l.display_order, l.lesson_date`,
      [journalId]
    );
    return result.rows;
  }

  static async getStudents(journalId) {
    const result = await query(
      `SELECT s.id, u.full_name, u.login
       FROM students s
       JOIN users u ON u.id = s.user_id
       JOIN journals j ON j.group_id = s.group_id
       WHERE j.id = $1
       ORDER BY u.full_name`,
      [journalId]
    );
    return result.rows;
  }

  static async getGradeTable(journalId) {
    const journal = await JournalRepository.findById(journalId);
    const students = await JournalRepository.getStudents(journalId);
    const works = await JournalRepository.getWorks(journalId);
    const gradesResult = await query(
      `SELECT g.student_id, g.work_id, g.score
       FROM grades g
       JOIN works w ON w.id = g.work_id
       WHERE w.journal_id = $1`,
      [journalId]
    );
    const gradeMap = {};
    for (const g of gradesResult.rows) {
      gradeMap[`${g.student_id}-${g.work_id}`] = g.score !== null && g.score !== undefined ? parseFloat(g.score) : null;
    }
    return {
      journal: {
        id: journal.id,
        discipline_name: journal.disciplineName,
        group_name: journal.groupName,
        semester: journal.semester,
      },
      works: works.map((w) => ({
        id: w.id,
        title: w.title,
        work_type_name: w.work_type_name,
        work_type_slug: w.work_type_slug,
        grade_system_name: w.grade_system_name,
        max_score: w.max_score,
        min_score: w.min_score,
        is_mandatory: w.is_mandatory,
        deadline: w.deadline,
      })),
      table: students.map((s) => ({
        studentId: s.id,
        fullName: s.full_name,
        grades: works.map((w) => ({
          workId: w.id,
          title: w.title,
          score: gradeMap[`${s.id}-${w.id}`] ?? null,
          maxScore: w.max_score,
          minScore: w.min_score,
          gradeSystem: w.grade_system_name,
          isMandatory: w.is_mandatory,
        })),
      })),
    };
  }

  static async getAttendanceTable(journalId) {
    const journal = await JournalRepository.findById(journalId);
    const students = await JournalRepository.getStudents(journalId);
    const lessons = await JournalRepository.getLessons(journalId);
    const attendanceResult = await query(
      `SELECT a.student_id, a.lesson_id, a.status
       FROM attendances a
       JOIN lessons l ON l.id = a.lesson_id
       WHERE l.journal_id = $1`,
      [journalId]
    );
    const attendanceMap = {};
    for (const a of attendanceResult.rows) {
      attendanceMap[`${a.student_id}-${a.lesson_id}`] = a.status;
    }
    return {
      journal: {
        id: journal.id,
        discipline_name: journal.disciplineName,
        group_name: journal.groupName,
        semester: journal.semester,
      },
      lessons: lessons.map((l) => ({
        id: l.id,
        lesson_date: l.lesson_date,
        lesson_type_name: l.lesson_type_name,
        lesson_type_slug: l.lesson_type_slug,
        display_order: l.display_order,
      })),
      table: students.map((s) => ({
        studentId: s.id,
        fullName: s.full_name,
        attendances: lessons.map((l) => ({
          lessonId: l.id,
          lessonDate: l.lesson_date,
          lessonTypeId: l.lesson_type_id,
          lessonTypeName: l.lesson_type_name,
          lessonTypeSlug: l.lesson_type_slug,
          status: attendanceMap[`${s.id}-${l.id}`] ?? null,
        })),
      })),
    };
  }
}
