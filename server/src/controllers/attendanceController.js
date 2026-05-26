import AttendanceService from '../services/AttendanceService.js';

export async function getAttendances(req, res, next) {
  try {
    const { lessonId, studentId, journalId } = req.query;
    const filters = { lessonId, studentId, journalId, role: req.user.role, userId: req.user.userId };
    const attendances = await AttendanceService.getAttendances(filters);
    res.json(attendances);
  } catch (err) {
    next(err);
  }
}

export async function setAttendance(req, res, next) {
  try {
    const { studentId, lessonId, status } = req.body;
    const result = await AttendanceService.setAttendance({ studentId, lessonId, status }, req.user);
    res.json(result);
  } catch (err) {
    if (err.message === 'Недопустимый статус посещаемости') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

export async function getAttendanceStats(req, res, next) {
  try {
    const { journalId } = req.query;
    const stats = await AttendanceService.getStatsByJournal(journalId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
