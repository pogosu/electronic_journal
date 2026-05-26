import User from './User.js';
import { query } from '../config/db.js';

export default class Student extends User {
  #studentId;
  #groupId;
  #groupName;

  constructor(data = {}) {
    super(data);
    this.#studentId = data.student_id ?? data.studentId ?? null;
    this.#groupId = data.group_id ?? data.groupId ?? null;
    this.#groupName = data.group_name ?? data.groupName ?? null;
  }

  get studentId() {
    return this.#studentId;
  }

  get groupId() {
    return this.#groupId;
  }

  get groupName() {
    return this.#groupName;
  }

  static async findByUserId(userId) {
    const result = await query(
      `SELECT u.*, r.name as role, s.id as student_id, s.group_id, g.name as group_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       JOIN students s ON s.user_id = u.id
       LEFT JOIN groups g ON g.id = s.group_id
       WHERE u.id = $1`,
      [userId]
    );
    if (result.rows.length === 0) return null;
    return new Student(result.rows[0]);
  }

  static async findById(studentId) {
    const result = await query(
      `SELECT u.*, r.name as role, s.id as student_id, s.group_id, g.name as group_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       JOIN students s ON s.user_id = u.id
       LEFT JOIN groups g ON g.id = s.group_id
       WHERE s.id = $1`,
      [studentId]
    );
    if (result.rows.length === 0) return null;
    return new Student(result.rows[0]);
  }

  static async findByGroupId(groupId) {
    const result = await query(
      `SELECT u.*, r.name as role, s.id as student_id, s.group_id, g.name as group_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       JOIN students s ON s.user_id = u.id
       LEFT JOIN groups g ON g.id = s.group_id
       WHERE s.group_id = $1
       ORDER BY u.full_name`,
      [groupId]
    );
    return result.rows.map((row) => new Student(row));
  }

  async getProfile() {
    const groupRes = await query('SELECT name, admission_year FROM groups WHERE id = $1', [this.#groupId]);
    const groupRow = groupRes.rows[0] || { name: null, admission_year: null };
    const now = new Date();
    const course = groupRow.admission_year
      ? now.getFullYear() - parseInt(groupRow.admission_year) + (now.getMonth() >= 8 ? 1 : 0)
      : null;
    return {
      fullName: this.fullName,
      groupName: groupRow.name,
      admissionYear: groupRow.admission_year,
      course,
    };
  }

  async getMyGradesFullData() {
    const result = await query(
      `SELECT 
        j.id as journal_id,
        j.semester,
        d.id as discipline_id,
        d.name as discipline_name,
        w.id as work_id,
        w.title as work_title,
        w.max_score,
        w.min_score,
        w.is_mandatory,
        w.deadline,
        w.display_order,
        w.is_active,
        wt.name as work_type_name,
        gs.name as grade_system_name,
        g.score
       FROM journals j
       JOIN groups g2 ON g2.id = j.group_id
       JOIN students s ON s.group_id = g2.id
       JOIN disciplines d ON d.id = j.discipline_id
       LEFT JOIN works w ON w.journal_id = j.id
       LEFT JOIN work_types wt ON wt.id = w.work_type_id
       LEFT JOIN grade_systems gs ON gs.id = w.grade_system_id
       LEFT JOIN grades g ON g.work_id = w.id AND g.student_id = s.id
       WHERE j.type = 'grades' AND s.id = $1 AND w.is_active = true
       ORDER BY d.name, w.display_order`,
      [this.#studentId]
    );

    const byDiscipline = {};
    for (const row of result.rows) {
      const dName = row.discipline_name;
      if (!byDiscipline[dName]) {
        byDiscipline[dName] = {
          discipline: dName,
          disciplineId: row.discipline_id,
          semester: row.semester,
          works: [],
          progressPercent: 0,
          totalWorks: 0,
          completedWorks: 0,
          debtsCount: 0,
        };
      }
      const score = row.score !== null ? parseFloat(row.score) : null;
      const maxScore = parseFloat(row.max_score) || 0;
      const minScore = parseFloat(row.min_score) || 0;
      let isDebt = false;
      if (score !== null && row.is_mandatory && maxScore > 0) {
        if (row.grade_system_name === 'Зачёт/Незачёт') {
          isDebt = score === 0;
        } else if (row.grade_system_name === '5-балльная') {
          isDebt = score < 3;
        } else if (row.grade_system_name === 'Произвольная') {
          isDebt = score < minScore;
        }
      }
      byDiscipline[dName].works.push({
        workId: row.work_id,
        title: row.work_title,
        type: row.work_type_name,
        gradeSystem: row.grade_system_name,
        maxScore,
        isMandatory: row.is_mandatory,
        deadline: row.deadline,
        score,
        isDebt,
      });
      byDiscipline[dName].totalWorks++;
      if (score !== null) {
        byDiscipline[dName].completedWorks++;
        if (isDebt) byDiscipline[dName].debtsCount++;
      }
    }

    for (const d of Object.values(byDiscipline)) {
      const scored = d.works.filter((w) => w.score !== null);
      const totalScore = scored.reduce((s, w) => s + w.score, 0);
      const totalMax = d.works.reduce((s, w) => s + w.maxScore, 0);
      d.progressPercent = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
    }

    return { disciplines: Object.values(byDiscipline) };
  }

  async getFullStats() {
    const gradesRes = await query(
      `SELECT g.score, w.max_score, w.min_score, w.is_mandatory, w.title, d.name as discipline_name, gs.name as grade_system_name, wt.slug as work_type_slug
       FROM grades g
       JOIN works w ON w.id = g.work_id
       JOIN grade_systems gs ON gs.id = w.grade_system_id
       JOIN work_types wt ON wt.id = w.work_type_id
       JOIN journals j ON j.id = w.journal_id
       JOIN disciplines d ON d.id = j.discipline_id
       WHERE g.student_id = $1`,
      [this.#studentId]
    );

    const attendanceRes = await query(
      `SELECT a.status, d.name as discipline_name
       FROM attendances a
       JOIN lessons l ON l.id = a.lesson_id
       JOIN journals j ON j.id = l.journal_id
       JOIN disciplines d ON d.id = j.discipline_id
       WHERE a.student_id = $1`,
      [this.#studentId]
    );

    const grades = gradesRes.rows;
    const attendances = attendanceRes.rows;

    // Exam average: only credit/final_exam works with numeric grade systems
    const examGrades = grades.filter((g) =>
      ['credit', 'final_exam'].includes(g.work_type_slug) &&
      g.grade_system_name !== 'Зачёт/Незачёт'
    );
    const examAvgScore = examGrades.length > 0
      ? examGrades.reduce((sum, g) => sum + parseFloat(g.score), 0) / examGrades.length
      : 0;

    const presentCount = attendances.filter((a) => a.status === 'present' || a.status === 'excused').length;
    const attendancePercent = attendances.length > 0
      ? (presentCount / attendances.length) * 100
      : 100;

    const debts = grades.filter((g) => {
      if (!g.is_mandatory) return false;
      const score = parseFloat(g.score);
      if (g.grade_system_name === 'Зачёт/Незачёт') return score === 0;
      if (g.grade_system_name === '5-балльная') return score < 3;
      if (g.grade_system_name === 'Произвольная') return score < parseFloat(g.min_score || 0);
      return false;
    });

    const disciplineMap = {};
    for (const g of grades) {
      if (!disciplineMap[g.discipline_name]) disciplineMap[g.discipline_name] = { grades: [], attendance: { present: 0, total: 0 } };
      disciplineMap[g.discipline_name].grades.push(g);
    }
    for (const a of attendances) {
      if (!disciplineMap[a.discipline_name]) disciplineMap[a.discipline_name] = { grades: [], attendance: { present: 0, total: 0 } };
      disciplineMap[a.discipline_name].attendance.total++;
      if (a.status === 'present' || a.status === 'excused') disciplineMap[a.discipline_name].attendance.present++;
    }
    const perDiscipline = Object.entries(disciplineMap).map(([name, data]) => {
      const totalScore = data.grades.reduce((s, g) => s + parseFloat(g.score || 0), 0);
      const totalMax = data.grades.reduce((s, g) => s + parseFloat(g.max_score || 0), 0);
      const progressPercent = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
      return {
        discipline: name,
        progressPercent: progressPercent.toFixed(1),
        attendancePercent: data.attendance.total > 0 ? ((data.attendance.present / data.attendance.total) * 100).toFixed(1) : '100.0',
        gradesCount: data.grades.length,
        attendanceCount: data.attendance.total,
        debts: data.grades.filter((g) => {
          if (!g.is_mandatory) return false;
          const score = parseFloat(g.score);
          if (g.grade_system_name === 'Зачёт/Незачёт') return score === 0;
          if (g.grade_system_name === '5-балльная') return score < 3;
          if (g.grade_system_name === 'Произвольная') return score < parseFloat(g.min_score || 0);
          return false;
        }).map((g) => ({ title: g.title, score: g.score, maxScore: g.max_score })),
      };
    });

    return {
      examAverageScore: examAvgScore.toFixed(2),
      attendancePercent: attendancePercent.toFixed(1),
      totalGrades: grades.length,
      totalAttendances: attendances.length,
      debtsCount: debts.length,
      debts: debts.map((d) => ({ title: d.title, score: d.score, maxScore: d.max_score, discipline: d.discipline_name })),
      perDiscipline,
    };
  }

  toJSON() {
    return {
      ...super.toJSON(),
      studentId: this.#studentId,
      groupId: this.#groupId,
      groupName: this.#groupName,
    };
  }
}
