import { query } from '../config/db.js';

export default class Journal {
  #id;
  #groupId;
  #groupName;
  #teacherId;
  #teacherName;
  #disciplineId;
  #disciplineName;
  #semester;
  #type;
  #admissionYear;

  constructor(data = {}) {
    this.#id = data.id ?? null;
    this.#groupId = data.group_id ?? data.groupId ?? null;
    this.#groupName = data.group_name ?? data.groupName ?? null;
    this.#teacherId = data.teacher_id ?? data.teacherId ?? null;
    this.#teacherName = data.teacher_name ?? data.teacherName ?? null;
    this.#disciplineId = data.discipline_id ?? data.disciplineId ?? null;
    this.#disciplineName = data.discipline_name ?? data.disciplineName ?? null;
    this.#semester = data.semester ?? '';
    this.#type = data.type ?? 'grades';
    this.#admissionYear = data.admission_year ?? data.admissionYear ?? null;
  }

  get id() { return this.#id; }
  get groupId() { return this.#groupId; }
  get groupName() { return this.#groupName; }
  get teacherId() { return this.#teacherId; }
  get disciplineId() { return this.#disciplineId; }
  get disciplineName() { return this.#disciplineName; }
  get semester() { return this.#semester; }
  get type() { return this.#type; }

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
    const { groupId, teacherId, discipline } = options;
    let sql = `SELECT j.*, g.name as group_name, g.admission_year, u.full_name as teacher_name, d.name as discipline_name
               FROM journals j
               JOIN groups g ON g.id = j.group_id
               JOIN teachers t ON t.id = j.teacher_id
               JOIN users u ON u.id = t.user_id
               JOIN disciplines d ON d.id = j.discipline_id`;
    const params = [];
    const conditions = [];

    if (groupId) {
      conditions.push(`j.group_id = $${params.length + 1}`);
      params.push(groupId);
    }
    if (teacherId) {
      conditions.push(`j.teacher_id = $${params.length + 1}`);
      params.push(teacherId);
    }
    if (discipline) {
      conditions.push(`d.name ILIKE $${params.length + 1}`);
      params.push(`%${discipline}%`);
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY d.name, g.name';
    const result = await query(sql, params);
    return result.rows.map((row) => new Journal(row));
  }

  async getWorks() {
    const result = await query(
      `SELECT w.*, wt.name as work_type_name, wt.slug as work_type_slug, gs.name as grade_system_name
       FROM works w
       JOIN work_types wt ON wt.id = w.work_type_id
       JOIN grade_systems gs ON gs.id = w.grade_system_id
       WHERE w.journal_id = $1 AND w.is_active = true
       ORDER BY w.display_order, w.id`,
      [this.#id]
    );
    return result.rows;
  }

  async getLessons() {
    const result = await query(
      `SELECT l.*, lt.name as lesson_type_name, lt.slug as lesson_type_slug
       FROM lessons l
       JOIN lesson_types lt ON lt.id = l.lesson_type_id
       WHERE l.journal_id = $1
       ORDER BY l.display_order, l.lesson_date`,
      [this.#id]
    );
    return result.rows;
  }

  async getStudents() {
    const result = await query(
      `SELECT s.id, u.full_name, u.login
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.group_id = $1
       ORDER BY u.full_name`,
      [this.#groupId]
    );
    return result.rows;
  }

  async getGradeTable() {
    const [worksRes, studentsRes] = await Promise.all([
      this.getWorks(),
      this.getStudents(),
    ]);

    const gradesRes = await query(
      `SELECT g.student_id, g.work_id, g.score
       FROM grades g
       JOIN works w ON w.id = g.work_id
       WHERE w.journal_id = $1`,
      [this.#id]
    );

    const gradeMap = new Map();
    for (const g of gradesRes.rows) {
      gradeMap.set(`${g.student_id}-${g.work_id}`, g.score);
    }

    const table = studentsRes.map((s) => ({
      studentId: s.id,
      fullName: s.full_name,
      grades: worksRes.map((w) => ({
        workId: w.id,
        title: w.title,
        score: gradeMap.get(`${s.id}-${w.id}`) ?? null,
        maxScore: parseFloat(w.max_score),
        minScore: parseFloat(w.min_score),
        gradeSystem: w.grade_system_name,
        isMandatory: w.is_mandatory,
      })),
    }));

    return {
      journal: {
        id: this.#id,
        discipline_name: this.#disciplineName,
        group_name: this.#groupName,
        semester: this.#semester,
      },
      works: worksRes,
      table,
    };
  }

  async getAttendanceTable() {
    const [lessonsRes, studentsRes] = await Promise.all([
      this.getLessons(),
      this.getStudents(),
    ]);

    const attendancesRes = await query(
      `SELECT a.student_id, a.lesson_id, a.status
       FROM attendances a
       JOIN lessons l ON l.id = a.lesson_id
       WHERE l.journal_id = $1`,
      [this.#id]
    );

    const attendanceMap = new Map();
    for (const a of attendancesRes.rows) {
      attendanceMap.set(`${a.student_id}-${a.lesson_id}`, a.status);
    }

    const table = studentsRes.map((s) => ({
      studentId: s.id,
      fullName: s.full_name,
      attendances: lessonsRes.map((l) => ({
        lessonId: l.id,
        lessonDate: l.lesson_date,
        lessonTypeId: l.lesson_type_id,
        lessonTypeName: l.lesson_type_name,
        lessonTypeSlug: l.lesson_type_slug,
        status: attendanceMap.get(`${s.id}-${l.id}`) ?? null,
      })),
    }));

    return {
      journal: {
        id: this.#id,
        discipline_name: this.#disciplineName,
        group_name: this.#groupName,
        semester: this.#semester,
      },
      lessons: lessonsRes,
      table,
    };
  }

  async save() {
    if (this.#id) {
      await query(
        'UPDATE journals SET group_id = $1, teacher_id = $2, discipline_id = $3, semester = $4, type = $5 WHERE id = $6',
        [this.#groupId, this.#teacherId, this.#disciplineId, this.#semester, this.#type, this.#id]
      );
    } else {
      const result = await query(
        'INSERT INTO journals (group_id, teacher_id, discipline_id, semester, type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [this.#groupId, this.#teacherId, this.#disciplineId, this.#semester, this.#type]
      );
      this.#id = result.rows[0].id;
    }
  }

  async delete() {
    await query('DELETE FROM journals WHERE id = $1', [this.#id]);
  }

  toJSON() {
    return {
      id: this.#id,
      group_id: this.#groupId,
      group_name: this.#groupName,
      teacher_id: this.#teacherId,
      teacher_name: this.#teacherName,
      discipline_id: this.#disciplineId,
      discipline_name: this.#disciplineName,
      semester: this.#semester,
      type: this.#type,
      admission_year: this.#admissionYear,
    };
  }
}
