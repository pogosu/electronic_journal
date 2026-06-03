import AttendanceRepository from '../repositories/AttendanceRepository.js';
import AuditService from './AuditService.js';
import Attendance from '../models/Attendance.js';

class AttendanceService {
  async setAttendance({ studentId, lessonId, status }, user) {
    const validStatuses = ['present', 'absent', 'excused'];
    if (!validStatuses.includes(status)) {
      throw new Error('Недопустимый статус посещаемости');
    }

    const existingAttendanceRows = await AttendanceRepository.findByLesson(lessonId);
    const existingAttendance = existingAttendanceRows.find((a) => a.studentId === parseInt(studentId, 10));
    const oldValue = existingAttendance ? existingAttendance.toJSON() : null;

    const attendance = new Attendance({ student_id: studentId, lesson_id: lessonId, status });
    await AttendanceRepository.save(attendance);

    const savedAttendance = await AttendanceRepository.findFullById(attendance.id);
    const newValue = savedAttendance ? savedAttendance.toJSON() : attendance.toJSON();
    await AuditService.logChange({ userId: user.userId, action: 'SET_ATTENDANCE', tableName: 'attendances', oldValue, newValue });
    return newValue;
  }

  async getAttendances(filters) {
    return AttendanceRepository.findWithFilters(filters);
  }

  async getStatsByJournal(journalId) {
    return AttendanceRepository.getStatsByJournal(journalId);
  }
}

export default new AttendanceService();
