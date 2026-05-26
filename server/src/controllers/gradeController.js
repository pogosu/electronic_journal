import Grade from '../models/Grade.js';
import Work from '../models/Work.js';
import AuditLog from '../models/AuditLog.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';

export async function getGrades(req, res, next) {
  try {
    const { studentId, workId, journalId } = req.query;
    const grades = await Grade.findWithFilters({
      studentId,
      workId,
      journalId,
      role: req.user.role,
      userId: req.user.userId,
    });
    res.json(grades);
  } catch (err) {
    next(err);
  }
}

export async function setGrade(req, res, next) {
  try {
    const { studentId, workId, score } = req.body;
    let teacherId = null;
    if (req.user.role === 'teacher') {
      teacherId = await Teacher.getIdByUserId(req.user.userId);
      if (!teacherId) {
        return res.status(403).json({ error: 'Только преподаватель может выставлять оценки' });
      }
    }

    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }

    const isDelete = score === null || score === undefined || score === '';

    if (isDelete) {
      await Grade.deleteByStudentAndWork(studentId, workId);
      const result = { deleted: true, student_id: studentId, work_id: workId };
      await AuditLog.create({
        userId: req.user.userId,
        action: 'SET_GRADE',
        tableName: 'grades',
        newValue: result,
      });
      return res.json(result);
    }

    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < work.minScore || numScore > work.maxScore) {
      return res.status(400).json({ error: `Оценка должна быть в диапазоне [${work.minScore}, ${work.maxScore}]` });
    }

    const existingId = await Grade.findByStudentAndWork(studentId, workId);
    let oldValue = null;
    if (existingId) {
      const oldGrade = await Grade.findById(existingId);
      if (oldGrade) oldValue = oldGrade.toJSON();
    }

    const grade = new Grade({
      id: existingId,
      student_id: studentId,
      work_id: workId,
      score: numScore,
      teacher_id: teacherId,
    });
    await grade.save();

    const student = await Student.findById(studentId);
    const enrichedNewValue = {
      ...grade.toJSON(),
      student_name: student?.fullName || null,
      work_title: work?.title || null,
      grade_system_name: work?.gradeSystemName || null,
    };
    const enrichedOldValue = oldValue
      ? { ...oldValue, student_name: student?.fullName || null, work_title: work?.title || null, grade_system_name: work?.gradeSystemName || null }
      : null;

    await AuditLog.create({
      userId: req.user.userId,
      action: 'SET_GRADE',
      tableName: 'grades',
      oldValue: enrichedOldValue,
      newValue: enrichedNewValue,
    });

    res.json(enrichedNewValue);
  } catch (err) {
    next(err);
  }
}

export async function getStudentStats(req, res, next) {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(parseInt(studentId, 10));
    if (!student) {
      return res.status(404).json({ error: 'Студент не найден' });
    }
    const stats = await student.getFullStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
