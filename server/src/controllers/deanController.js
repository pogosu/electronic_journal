import { query } from '../config/db.js';

export async function getGroupSummaries(req, res, next) {
  try {
    const result = await query(
      `WITH group_debtors AS (
         SELECT
           s.group_id,
           COUNT(DISTINCT s.id) as debtor_count
         FROM students s
         JOIN journals j ON j.group_id = s.group_id
         JOIN works w ON w.journal_id = j.id AND w.is_active = true AND w.is_mandatory = true
         LEFT JOIN grades gr ON gr.work_id = w.id AND gr.student_id = s.id
         LEFT JOIN grade_systems gs ON gs.id = w.grade_system_id
         WHERE gr.score IS NULL OR (
           CASE
             WHEN gs.name = 'Зачёт/Незачёт' THEN gr.score = 0
             WHEN gs.name = '5-балльная' THEN gr.score < 3
             WHEN gs.name = 'Произвольная' THEN gr.score < w.min_score
             ELSE false
           END
         )
         GROUP BY s.group_id
       ),
       group_attendance AS (
         SELECT
           s.group_id,
           COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0) as attendance_pct
         FROM students s
         LEFT JOIN attendances a ON a.student_id = s.id
         GROUP BY s.group_id
       )
       SELECT
         g.id,
         g.name,
         g.admission_year,
         (EXTRACT(YEAR FROM CURRENT_DATE) - g.admission_year + CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 9 THEN 1 ELSE 0 END) as course,
         COUNT(DISTINCT s.id) as student_count,
         COALESCE(gd.debtor_count, 0) as debtor_count,
         COALESCE(ga.attendance_pct, 0) as attendance_pct,
         (SELECT MAX(j2.semester) FROM journals j2 WHERE j2.group_id = g.id) as current_semester
       FROM groups g
       LEFT JOIN students s ON s.group_id = g.id
       LEFT JOIN group_debtors gd ON gd.group_id = g.id
       LEFT JOIN group_attendance ga ON ga.group_id = g.id
       GROUP BY g.id, g.name, g.admission_year, gd.debtor_count, ga.attendance_pct
       ORDER BY g.name`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getGroupDisciplines(req, res, next) {
  try {
    const { groupId } = req.params;
    const result = await query(
      `WITH current_semester AS (
         SELECT
           CASE
             WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 9 THEN EXTRACT(YEAR FROM CURRENT_DATE)::text || '-осень'
             WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 2 THEN EXTRACT(YEAR FROM CURRENT_DATE)::text || '-весна'
             ELSE (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::text || '-осень'
           END as semester
       ),
       group_disciplines AS (
         SELECT DISTINCT d.id, d.name
         FROM disciplines d
         JOIN teacher_assignments ta ON ta.discipline_id = d.id AND ta.group_id = $1
       ),
       exam_avg AS (
         SELECT
           j.discipline_id,
           COALESCE(AVG(gr.score), 0) as exam_avg_score
         FROM works w
         JOIN work_types wt ON wt.id = w.work_type_id AND wt.slug IN ('credit', 'final_exam')
         JOIN journals j ON j.id = w.journal_id AND j.group_id = $1
         LEFT JOIN grades gr ON gr.work_id = w.id
         WHERE w.is_active = true
         GROUP BY j.discipline_id
       ),
       discipline_attendance AS (
         SELECT
           j.discipline_id,
           COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0) as attendance_pct
         FROM attendances a
         JOIN lessons l ON l.id = a.lesson_id
         JOIN journals j ON j.id = l.journal_id AND j.group_id = $1
         GROUP BY j.discipline_id
       ),
       group_journals AS (
         SELECT
           j.discipline_id,
           MAX(CASE WHEN j.type = 'grades' THEN j.id END) as grade_journal_id,
           MAX(CASE WHEN j.type = 'attendance' THEN j.id END) as attendance_journal_id
         FROM journals j
         WHERE j.group_id = $1
           AND j.semester = (SELECT semester FROM current_semester)
         GROUP BY j.discipline_id
       )
       SELECT
         gd.id,
         gd.name,
         COALESCE(ea.exam_avg_score, 0) as exam_avg_score,
         COALESCE(da.attendance_pct, 0) as attendance_pct,
         gj.grade_journal_id,
         gj.attendance_journal_id
       FROM group_disciplines gd
       LEFT JOIN exam_avg ea ON ea.discipline_id = gd.id
       LEFT JOIN discipline_attendance da ON da.discipline_id = gd.id
       LEFT JOIN group_journals gj ON gj.discipline_id = gd.id
       ORDER BY gd.name`,
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getDisciplineSummaries(req, res, next) {
  try {
    const result = await query(
      `WITH exam_avg AS (
         SELECT
           j.discipline_id,
           COALESCE(AVG(gr.score), 0) as exam_avg_score
         FROM works w
         JOIN work_types wt ON wt.id = w.work_type_id AND wt.slug IN ('credit', 'final_exam')
         JOIN journals j ON j.id = w.journal_id
         LEFT JOIN grades gr ON gr.work_id = w.id
         WHERE w.is_active = true
         GROUP BY j.discipline_id
       ),
       discipline_attendance AS (
         SELECT
           j.discipline_id,
           COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0) as attendance_pct
         FROM attendances a
         JOIN lessons l ON l.id = a.lesson_id
         JOIN journals j ON j.id = l.journal_id
         GROUP BY j.discipline_id
       ),
       discipline_groups AS (
         SELECT
           ta.discipline_id,
           COUNT(DISTINCT ta.group_id) as group_count,
           COUNT(DISTINCT s.id) as student_count
         FROM teacher_assignments ta
         LEFT JOIN students s ON s.group_id = ta.group_id
         GROUP BY ta.discipline_id
       )
       SELECT
         d.id as discipline_id,
         d.name as discipline_name,
         COALESCE(dg.group_count, 0) as group_count,
         COALESCE(dg.student_count, 0) as student_count,
         COALESCE(ea.exam_avg_score, 0) as exam_avg_score,
         COALESCE(da.attendance_pct, 0) as attendance_pct
       FROM disciplines d
       LEFT JOIN discipline_groups dg ON dg.discipline_id = d.id
       LEFT JOIN exam_avg ea ON ea.discipline_id = d.id
       LEFT JOIN discipline_attendance da ON da.discipline_id = d.id
       ORDER BY d.name`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getStudentSummariesByGroup(req, res, next) {
  try {
    const { groupId } = req.params;
    const result = await query(
      `WITH student_progress AS (
         SELECT
           s.id as student_id,
           COALESCE(SUM(gr.score) / NULLIF(SUM(w.max_score), 0) * 100, 0) as progress
         FROM students s
         JOIN journals j ON j.group_id = s.group_id
         JOIN works w ON w.journal_id = j.id AND w.is_active = true
         LEFT JOIN grades gr ON gr.work_id = w.id AND gr.student_id = s.id
         WHERE s.group_id = $1
         GROUP BY s.id
       ),
       student_attendance AS (
         SELECT
           s.id as student_id,
           COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0) as attendance_pct
         FROM students s
         LEFT JOIN attendances a ON a.student_id = s.id
         WHERE s.group_id = $1
         GROUP BY s.id
       )
       SELECT
         u.id as user_id,
         s.id as student_id,
         u.full_name,
         COALESCE(sp.progress, 0) as avg_score,
         COALESCE(sa.attendance_pct, 0) as attendance_pct,
         COUNT(CASE WHEN gr.score IS NOT NULL THEN 1 END) as completed_works,
         COUNT(CASE WHEN w.is_mandatory = true AND (gr.score IS NULL OR (
           CASE
             WHEN gs.name = 'Зачёт/Незачёт' THEN gr.score = 0
             WHEN gs.name = '5-балльная' THEN gr.score < 3
             WHEN gs.name = 'Произвольная' THEN gr.score < w.min_score
             ELSE false
           END
         )) THEN 1 END) as debt_count
       FROM students s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN grades gr ON gr.student_id = s.id
       LEFT JOIN works w ON w.id = gr.work_id
       LEFT JOIN grade_systems gs ON gs.id = w.grade_system_id
       LEFT JOIN student_progress sp ON sp.student_id = s.id
       LEFT JOIN student_attendance sa ON sa.student_id = s.id
       WHERE s.group_id = $1
       GROUP BY u.id, s.id, u.full_name, sp.progress, sa.attendance_pct
       ORDER BY u.full_name`,
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}
