export default class Attendance {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.studentId = data.studentId ?? data.student_id ?? null;
    this.lessonId = data.lessonId ?? data.lesson_id ?? null;
    this.status = data.status;
    this.attendanceDate = data.attendanceDate ?? data.attendance_date ?? null;
    this.studentName = data.studentName ?? data.student_name ?? null;
    this.lessonDate = data.lessonDate ?? data.lesson_date ?? null;
    this.lessonTypeName = data.lessonTypeName ?? data.lesson_type_name ?? null;
    this.disciplineName = data.disciplineName ?? data.discipline_name ?? null;
    this.semester = data.semester;
  }

  isAbsent() {
    return this.status === 'absent';
  }

  toJSON() {
    return {
      id: this.id,
      student_id: this.studentId,
      lesson_id: this.lessonId,
      status: this.status,
      attendance_date: this.attendanceDate,
      student_name: this.studentName,
      lesson_date: this.lessonDate,
      lesson_type_name: this.lessonTypeName,
      discipline_name: this.disciplineName,
      semester: this.semester,
    };
  }
}
