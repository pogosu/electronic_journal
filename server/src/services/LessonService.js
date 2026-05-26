import Lesson from '../models/Lesson.js';
import AuditService from './AuditService.js';

class LessonService {
  async createLesson(journalId, data, user) {
    const lesson = new Lesson({
      journal_id: journalId,
      lesson_date: data.lessonDate,
      lesson_type_id: data.lessonTypeId,
      display_order: data.displayOrder || 0,
    });
    await lesson.save();
    await AuditService.logChange({ userId: user.userId, action: 'CREATE_LESSON', tableName: 'lessons', newValue: lesson.toJSON() });
    return lesson.toJSON();
  }

  async getLessonsByJournal(journalId) {
    return Lesson.findByJournal(journalId);
  }

  async canDeleteLesson(id) {
    return Lesson.canDelete(id);
  }

  async reorderLessons(journalId, lessonIds) {
    await Lesson.reorder(journalId, lessonIds);
  }
}

export default new LessonService();
