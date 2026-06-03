export default class Lesson {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.journalId = data.journalId ?? data.journal_id ?? null;
    this.lessonDate = data.lessonDate ?? data.lesson_date ?? null;
    this.lessonTypeId = data.lessonTypeId ?? data.lesson_type_id ?? null;
    this.lessonTypeName = data.lessonTypeName ?? data.lesson_type_name ?? null;
    this.lessonTypeSlug = data.lessonTypeSlug ?? data.lesson_type_slug ?? null;
    this.displayOrder = data.displayOrder ?? data.display_order ?? 0;
  }

  toJSON() {
    return {
      id: this.id,
      journal_id: this.journalId,
      lesson_date: this.lessonDate,
      lesson_type_id: this.lessonTypeId,
      lesson_type_name: this.lessonTypeName,
      lesson_type_slug: this.lessonTypeSlug,
      display_order: this.displayOrder,
    };
  }
}
