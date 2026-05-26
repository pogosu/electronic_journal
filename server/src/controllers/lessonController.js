import Lesson from '../models/Lesson.js';
import Work from '../models/Work.js';
import AuditLog from '../models/AuditLog.js';

export async function updateLesson(req, res, next) {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    const oldValue = lesson.toJSON();
    if (req.body.lessonDate !== undefined) lesson.lessonDate = req.body.lessonDate;
    if (req.body.lessonTypeId !== undefined) lesson.lessonTypeId = req.body.lessonTypeId;
    if (req.body.displayOrder !== undefined) lesson.displayOrder = req.body.displayOrder;
    await lesson.save();
    await AuditLog.create({
      userId: req.user.userId,
      action: 'UPDATE_LESSON',
      tableName: 'lessons',
      oldValue,
      newValue: lesson.toJSON(),
    });
    res.json(lesson.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteLesson(req, res, next) {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    const canDelete = await Lesson.canDelete(id);
    if (!canDelete) {
      return res.status(400).json({ error: 'Нельзя удалить занятие с установленной посещаемостью' });
    }
    const oldValue = lesson.toJSON();
    await lesson.delete();
    await AuditLog.create({
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
    await Lesson.reorder(journalId, lessonIds);
    await AuditLog.create({
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
    await Work.reorder(journalId, workIds);
    await AuditLog.create({
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
