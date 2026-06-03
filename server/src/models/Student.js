import User from './User.js';

export default class Student extends User {
  constructor(data = {}) {
    super(data);
    this.studentId = data.studentId ?? data.student_id ?? null;
    this.groupId = data.groupId ?? data.group_id ?? null;
    this.groupName = data.groupName ?? data.group_name ?? null;
  }

  async getProfile(studentRepo) {
    return studentRepo.getProfile(this.studentId);
  }

  async getGrades(gradeRepo) {
    return gradeRepo.findByStudent(this.studentId);
  }

  async getAttendance(attendanceRepo) {
    return attendanceRepo.findByStudent(this.studentId);
  }

  async getMyGradesFullData(studentRepo) {
    return studentRepo.getMyGradesFullData(this.studentId);
  }

  async getFullStats(studentRepo) {
    return studentRepo.getFullStats(this.studentId);
  }

  async getMyJournals(journalRepo) {
    return journalRepo.findAll({ groupId: this.groupId });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      studentId: this.studentId,
      groupId: this.groupId,
      groupName: this.groupName,
    };
  }
}
