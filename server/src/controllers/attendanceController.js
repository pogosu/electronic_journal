import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Lesson from '../models/Lesson.js';
import AuditLog from '../models/AuditLog.js';

export async function getAttendances(req, res, next) {
  try {
    const { lessonId, studentId, journalId } = req.query;
    const attendances = await Attendance.findWithFilters({
      lessonId,
      studentId,
      journalId,
      role: req.user.role,
      userId: req.user.userId,
    });
    res.json(attendances);
  } catch (err) {
    next(err);
  }
}

export async function setAttendance(req, res, next) {
  try {
    const { studentId, lessonId, status } = req.body;

    const validStatuses = ['present', 'absent', 'excused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус посещаемости' });
    }

    const existingAttendanceRows = await Attendance.findByLesson(lessonId);
    const existingAttendance = existingAttendanceRows.find((a) => a.studentId === parseInt(studentId, 10));
    const oldValue = existingAttendance ? existingAttendance.toJSON() : null;

    const attendance = new Attendance({ student_id: studentId, lesson_id: lessonId, status });
    await attendance.save();

    const student = await Student.findById(studentId);
    const lesson = await Lesson.findById(lessonId);
    const enrichedNewValue = {
      ...attendance.toJSON(),
      student_name: student?.fullName || null,
      lesson_date: lesson?.lessonDate || null,
    };
    const enrichedOldValue = oldValue
      ? { ...oldValue, student_name: student?.fullName || null, lesson_date: lesson?.lessonDate || null }
      : null;

    await AuditLog.create({
      userId: req.user.userId,
      action: 'SET_ATTENDANCE',
      tableName: 'attendances',
      oldValue: enrichedOldValue,
      newValue: enrichedNewValue,
    });

    res.json(enrichedNewValue);
  } catch (err) {
    next(err);
  }
}

export async function getAttendanceStats(req, res, next) {
  try {
    const { journalId } = req.params;
    const stats = await Attendance.getStatsByJournal(journalId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
