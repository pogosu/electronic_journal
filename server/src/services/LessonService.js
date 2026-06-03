import LessonRepository from '../repositories/LessonRepository.js';
import AuditService from './AuditService.js';

class LessonService {
  async createLesson(journalId, data, user) {
    const lesson = await LessonRepository.create({
      journalId,
      lessonDate: data.lessonDate,
      lessonTypeId: data.lessonTypeId,
      displayOrder: data.displayOrder || 0,
    });
    await AuditService.logChange({ userId: user.userId, action: 'CREATE_LESSON', tableName: 'lessons', newValue: lesson.toJSON() });
    return lesson.toJSON();
  }

  async getLessonsByJournal(journalId) {
    return LessonRepository.findByJournal(journalId);
  }

  async canDeleteLesson(id) {
    return LessonRepository.canDelete(id);
  }

  async reorderLessons(journalId, lessonIds) {
    await LessonRepository.reorder(journalId, lessonIds);
  }

  async deleteLesson(id, user) {
    await LessonRepository.deleteById(id);
    await AuditService.logChange({ userId: user.userId, action: 'DELETE_LESSON', tableName: 'lessons', newValue: { deleted: true, id } });
    return { deleted: true };
  }
}

export default new LessonService();
