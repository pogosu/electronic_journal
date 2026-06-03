import LessonRepository from '../repositories/LessonRepository.js';
import WorkRepository from '../repositories/WorkRepository.js';
import LessonService from '../services/LessonService.js';
import WorkService from '../services/WorkService.js';
import AuditLogRepository from '../repositories/AuditLogRepository.js';

export async function updateLesson(req, res, next) {
  try {
    const { id } = req.params;
    const lesson = await LessonRepository.findById(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    const oldValue = lesson.toJSON();
    const { lessonDate, lessonTypeId, displayOrder } = req.body;
    const updated = await LessonRepository.update(id, {
      lessonDate: lessonDate ?? lesson.lessonDate,
      lessonTypeId: lessonTypeId ?? lesson.lessonTypeId,
      displayOrder: displayOrder ?? lesson.displayOrder,
    });
    await AuditLogRepository.create({
      userId: req.user.userId,
      action: 'UPDATE_LESSON',
      tableName: 'lessons',
      oldValue,
      newValue: updated.toJSON(),
    });
    res.json(updated.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteLesson(req, res, next) {
  try {
    const { id } = req.params;
    const lesson = await LessonRepository.findById(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    const canDelete = await LessonService.canDeleteLesson(id);
    if (!canDelete) {
      return res.status(400).json({ error: 'Нельзя удалить занятие с установленной посещаемостью' });
    }
    const oldValue = lesson.toJSON();
    await LessonRepository.deleteById(id);
    await AuditLogRepository.create({
      userId: req.user.userId,
      action: 'DELETE_LESSON',
      tableName: 'lessons',
      oldValue,
      newValue: { deleted: true, id: parseInt(id, 10) },
    });
    res.json({ message: 'Занятие удалено' });
  } catch (err) {
    next(err);
  }
}

export async function reorderLessons(req, res, next) {
  try {
    const { journalId } = req.params;
    const { lessonIds } = req.body;
    if (!Array.isArray(lessonIds)) {
      return res.status(400).json({ error: 'lessonIds должен быть массивом' });
    }
    await LessonService.reorderLessons(journalId, lessonIds);
    await AuditLogRepository.create({
      userId: req.user.userId,
      action: 'REORDER_LESSONS',
      tableName: 'lessons',
      newValue: { journal_id: parseInt(journalId, 10), lesson_ids: lessonIds },
    });
    res.json({ message: 'Порядок занятий обновлён' });
  } catch (err) {
    next(err);
  }
}

export async function reorderWorks(req, res, next) {
  try {
    const { journalId } = req.params;
    const { workIds } = req.body;
    if (!Array.isArray(workIds)) {
      return res.status(400).json({ error: 'workIds должен быть массивом' });
    }
    await WorkService.reorderWorks(journalId, workIds);
    await AuditLogRepository.create({
      userId: req.user.userId,
      action: 'REORDER_WORKS',
      tableName: 'works',
      newValue: { journal_id: parseInt(journalId, 10), work_ids: workIds },
    });
    res.json({ message: 'Порядок работ обновлён' });
  } catch (err) {
    next(err);
  }
}
