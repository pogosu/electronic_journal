import Teacher from '../models/Teacher.js';
import Discipline from '../models/Discipline.js';
import { query } from '../config/db.js';

export async function getMyJournals(req, res, next) {
  try {
    if (req.user.role === 'admin' || req.user.role === 'deanery') {
      const result = await query(
        `SELECT j.*, g.name as group_name, d.name as discipline_name
         FROM journals j
         JOIN groups g ON g.id = j.group_id
         JOIN disciplines d ON d.id = j.discipline_id
         ORDER BY d.name, g.name`
      );
      return res.json(result.rows);
    }
    const teacher = await Teacher.findByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ error: 'Преподаватель не найден' });
    }
    const journals = await teacher.getJournals();
    res.json(journals);
  } catch (err) {
    next(err);
  }
}

export async function getMyStudents(req, res, next) {
  try {
    if (req.user.role === 'admin' || req.user.role === 'deanery') {
      const result = await query(
        `SELECT DISTINCT u.id, u.full_name, g.name as group_name, g.admission_year
         FROM students s
         JOIN users u ON u.id = s.user_id
         JOIN groups g ON g.id = s.group_id
         ORDER BY u.full_name`
      );
      return res.json(result.rows);
    }
    const teacher = await Teacher.findByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ error: 'Преподаватель не найден' });
    }
    const students = await teacher.getStudents();
    res.json(students);
  } catch (err) {
    next(err);
  }
}

export async function getMyDisciplines(req, res, next) {
  try {
    if (req.user.role === 'admin' || req.user.role === 'deanery') {
      const disciplines = await Discipline.findAll({ orderBy: 'name' });
      return res.json(disciplines.map((d) => d.toJSON()));
    }
    const teacher = await Teacher.findByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ error: 'Преподаватель не найден' });
    }
    const disciplines = await teacher.getDisciplines();
    res.json(disciplines);
  } catch (err) {
    next(err);
  }
}

export async function getMyGroupsByDiscipline(req, res, next) {
  try {
    const { disciplineId } = req.params;
    if (req.user.role === 'admin' || req.user.role === 'deanery') {
      const result = await query(
        `SELECT g.id, g.name, g.admission_year,
                gj.id as grade_journal_id, aj.id as attendance_journal_id, ta.semester,
                COALESCE((
                  SELECT COUNT(DISTINCT s2.id)
                  FROM students s2
                  JOIN journals j2 ON j2.group_id = s2.group_id AND j2.discipline_id = $1
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
         WHERE ta.discipline_id = $1`,
        [disciplineId]
      );
      return res.json(result.rows);
    }
    const teacher = await Teacher.findByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ error: 'Преподаватель не найден' });
    }
    const groups = await teacher.getGroupsForDiscipline(disciplineId);
    res.json(groups);
  } catch (err) {
    next(err);
  }
}
