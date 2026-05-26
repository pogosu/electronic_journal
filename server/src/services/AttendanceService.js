import Attendance from '../models/Attendance.js';
import AuditService from './AuditService.js';

class AttendanceService {
  async setAttendance({ studentId, lessonId, status }, user) {
    const validStatuses = ['present', 'absent', 'excused'];
    if (!validStatuses.includes(status)) {
      throw new Error('Недопустимый статус посещаемости');
    }

    const existingAttendanceRows = await Attendance.findByLesson(lessonId);
    const existingAttendance = existingAttendanceRows.find((a) => a.studentId === parseInt(studentId, 10));
    const oldValue = existingAttendance ? existingAttendance.toJSON() : null;

    const attendance = new Attendance({ student_id: studentId, lesson_id: lessonId, status });
    await attendance.save();

    await AuditService.logChange({ userId: user.userId, action: 'SET_ATTENDANCE', tableName: 'attendances', oldValue, newValue: attendance.toJSON() });
    return attendance.toJSON();
  }

  async getAttendances(filters) {
    return Attendance.findWithFilters(filters);
  }

  async getStatsByJournal(journalId) {
    return Attendance.getStatsByJournal(journalId);
  }
}

export default new AttendanceService();
