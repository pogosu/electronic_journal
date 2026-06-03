export default class Journal {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.groupId = data.groupId ?? data.group_id ?? null;
    this.groupName = data.groupName ?? data.group_name ?? null;
    this.teacherId = data.teacherId ?? data.teacher_id ?? null;
    this.teacherName = data.teacherName ?? data.teacher_name ?? null;
    this.disciplineId = data.disciplineId ?? data.discipline_id ?? null;
    this.disciplineName = data.disciplineName ?? data.discipline_name ?? null;
    this.semester = data.semester;
    this.type = data.type;
    this.admissionYear = data.admissionYear ?? data.admission_year ?? null;
  }

  async getWorks(workRepo) {
    return workRepo.findByJournal(this.id);
  }

  async getLessons(lessonRepo) {
    return lessonRepo.findByJournal(this.id);
  }

  async getStudents(journalRepo) {
    return journalRepo.getStudents(this.id);
  }

  async getGradeTable(journalRepo) {
    return journalRepo.getGradeTable(this.id);
  }

  async getAttendanceTable(journalRepo) {
    return journalRepo.getAttendanceTable(this.id);
  }

  toJSON() {
    return {
      id: this.id,
      group_id: this.groupId,
      group_name: this.groupName,
      teacher_id: this.teacherId,
      teacher_name: this.teacherName,
      discipline_id: this.disciplineId,
      discipline_name: this.disciplineName,
      semester: this.semester,
      type: this.type,
      admission_year: this.admissionYear,
    };
  }
}
