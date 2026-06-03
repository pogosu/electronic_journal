export default class Group {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.name = data.name ?? '';
    this.admissionYear = data.admissionYear ?? data.admission_year ?? 0;
  }

  get course() {
    const now = new Date();
    return now.getFullYear() - this.admissionYear + (now.getMonth() >= 8 ? 1 : 0);
  }

  async getStudents(studentRepo) {
    return studentRepo.findByGroupId(this.id);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      admission_year: this.admissionYear,
      course: this.course,
    };
  }
}
