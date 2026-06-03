export default class Assignment {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.teacherId = data.teacherId ?? data.teacher_id ?? null;
    this.groupId = data.groupId ?? data.group_id ?? null;
    this.disciplineId = data.disciplineId ?? data.discipline_id ?? null;
    this.semester = data.semester;
    this.teacherName = data.teacherName ?? data.teacher_name ?? null;
    this.groupName = data.groupName ?? data.group_name ?? null;
    this.disciplineName = data.disciplineName ?? data.discipline_name ?? null;
    this.admissionYear = data.admissionYear ?? data.admission_year ?? null;
  }

  static async create(data, assignmentRepo) {
    return assignmentRepo.create(data);
  }

  async delete(assignmentRepo) {
    return assignmentRepo.deleteById(this.id);
  }

  toJSON() {
    return {
      id: this.id,
      teacher_id: this.teacherId,
      group_id: this.groupId,
      discipline_id: this.disciplineId,
      semester: this.semester,
      teacher_name: this.teacherName,
      group_name: this.groupName,
      discipline_name: this.disciplineName,
      admission_year: this.admissionYear,
    };
  }
}
