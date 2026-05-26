import Work from '../models/Work.js';
import AuditLog from '../models/AuditLog.js';

export async function getWorksByJournal(req, res, next) {
  try {
    const { journalId } = req.params;
    const works = await Work.findByJournal(journalId);
    res.json(works.map((w) => w.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function createWork(req, res, next) {
  try {
    const { journalId } = req.params;
    const work = new Work({
      journal_id: journalId,
      title: req.body.title,
      work_type_id: req.body.work_type_id,
      grade_system_id: req.body.grade_system_id,
      min_score: req.body.min_score || 0,
      max_score: req.body.max_score,
      is_mandatory: req.body.is_mandatory !== false,
      deadline: req.body.deadline || null,
      display_order: req.body.display_order || 0,
    });
    await work.save();
    await AuditLog.create({
      userId: req.user.userId,
      action: 'CREATE_WORK',
      tableName: 'works',
      newValue: work.toJSON(),
    });
    res.status(201).json(work.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function updateWork(req, res, next) {
  try {
    const { id } = req.params;
    const work = await Work.findById(id);
    if (!work) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }
    const oldValue = work.toJSON();
    if (req.body.title !== undefined) work.title = req.body.title;
    if (req.body.work_type_id !== undefined) work.workTypeId = req.body.work_type_id;
    if (req.body.grade_system_id !== undefined) work.gradeSystemId = req.body.grade_system_id;
    if (req.body.min_score !== undefined) work.minScore = req.body.min_score;
    if (req.body.max_score !== undefined) work.maxScore = req.body.max_score;
    if (req.body.is_mandatory !== undefined) work.isMandatory = req.body.is_mandatory;
    if (req.body.deadline !== undefined) work.deadline = req.body.deadline;
    if (req.body.display_order !== undefined) work.displayOrder = req.body.display_order;
    if (req.body.is_active !== undefined) work.isActive = req.body.is_active;
    await work.save();
    await AuditLog.create({
      userId: req.user.userId,
      action: 'UPDATE_WORK',
      tableName: 'works',
      oldValue,
      newValue: work.toJSON(),
    });
    res.json(work.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteWork(req, res, next) {
  try {
    const { id } = req.params;
    const work = await Work.findById(id);
    if (!work) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }
    const oldValue = work.toJSON();
    await work.delete();
    await AuditLog.create({
      userId: req.user.userId,
      action: 'DELETE_WORK',
      tableName: 'works',
      oldValue,
      newValue: { deleted: true, id: parseInt(id, 10) },
    });
    res.json({ message: 'Работа удалена' });
  } catch (err) {
    next(err);
  }
}

export async function getWorkDictionaries(req, res, next) {
  try {
    const dicts = await Work.findDictionaries();
    res.json(dicts);
  } catch (err) {
    next(err);
  }
}
