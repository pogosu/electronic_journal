import User from './User.js';

export default class Teacher extends User {
  constructor(data = {}) {
    super(data);
    this.teacherId = data.teacherId ?? data.teacher_id ?? null;
    this.department = data.department ?? '';
  }

  async getJournals(journalRepo) {
    return journalRepo.findAll({ teacherId: this.teacherId });
  }

  async getStudents(teacherRepo) {
    return teacherRepo.getStudents(this.teacherId);
  }

  async getDisciplines(teacherRepo) {
    return teacherRepo.getDisciplines(this.teacherId);
  }

  async getGroupsForDiscipline(disciplineId, teacherRepo) {
    return teacherRepo.getGroupsForDiscipline(this.teacherId, disciplineId);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      teacherId: this.teacherId,
      department: this.department,
    };
  }
}
