export default class Work {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.journalId = data.journalId ?? data.journal_id ?? null;
    this.title = data.title ?? '';
    this.workTypeId = data.workTypeId ?? data.work_type_id ?? null;
    this.workTypeName = data.workTypeName ?? data.work_type_name ?? null;
    this.gradeSystemId = data.gradeSystemId ?? data.grade_system_id ?? null;
    this.gradeSystemName = data.gradeSystemName ?? data.grade_system_name ?? null;
    this.minScore = parseFloat(data.minScore ?? data.min_score ?? 0);
    this.maxScore = parseFloat(data.maxScore ?? data.max_score ?? 0);
    this.isMandatory = (data.isMandatory ?? data.is_mandatory) !== false;
    this.deadline = data.deadline ?? null;
    this.displayOrder = data.displayOrder ?? data.display_order ?? 0;
  }

  validateScore(score) {
    const num = parseFloat(score);
    return num >= this.minScore && num <= this.maxScore;
  }

  toJSON() {
    return {
      id: this.id,
      journal_id: this.journalId,
      title: this.title,
      work_type_id: this.workTypeId,
      work_type_name: this.workTypeName,
      grade_system_id: this.gradeSystemId,
      grade_system_name: this.gradeSystemName,
      min_score: this.minScore,
      max_score: this.maxScore,
      is_mandatory: this.isMandatory,
      deadline: this.deadline,
      display_order: this.displayOrder,
    };
  }
}
