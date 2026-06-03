export default class Grade {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.studentId = data.studentId ?? data.student_id ?? null;
    this.workId = data.workId ?? data.work_id ?? null;
    this.score = data.score !== null && data.score !== undefined ? parseFloat(data.score) : null;
    this.gradeDate = data.gradeDate ?? data.grade_date ?? null;
    this.teacherId = data.teacherId ?? data.teacher_id ?? null;
    this.studentName = data.studentName ?? data.student_name ?? null;
    this.workTitle = data.workTitle ?? data.work_title ?? null;
    this.maxScore = data.maxScore ?? data.max_score ?? null;
    this.isMandatory = data.isMandatory ?? data.is_mandatory ?? null;
    this.disciplineName = data.disciplineName ?? data.discipline_name ?? null;
    this.gradeSystemName = data.gradeSystemName ?? data.grade_system_name ?? null;
    this.minScore = data.minScore ?? data.min_score ?? null;
  }

  isDebt(work) {
    if (!work || !work.isMandatory) return false;
    if (this.score === null) return false;
    const gs = work.gradeSystemName || this.gradeSystemName;
    if (gs === 'Зачёт/Незачёт') return this.score === 0;
    if (gs === '5-балльная') return this.score < 3;
    if (gs === 'Произвольная') return this.score < (work.minScore || this.minScore || 0);
    return false;
  }

  toJSON() {
    return {
      id: this.id,
      student_id: this.studentId,
      work_id: this.workId,
      score: this.score,
      grade_date: this.gradeDate,
      teacher_id: this.teacherId,
      student_name: this.studentName,
      work_title: this.workTitle,
      max_score: this.maxScore,
      is_mandatory: this.isMandatory,
      discipline_name: this.disciplineName,
      grade_system_name: this.gradeSystemName,
      min_score: this.minScore,
    };
  }
}
