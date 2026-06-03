import WorkRepository from '../repositories/WorkRepository.js';
import WorkService from '../services/WorkService.js';
import AuditLogRepository from '../repositories/AuditLogRepository.js';

export async function getWorksByJournal(req, res, next) {
  try {
    const { journalId } = req.params;
    const works = await WorkService.getWorksByJournal(journalId);
    res.json(works.map((w) => w.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function createWork(req, res, next) {
  try {
    const { journalId } = req.params;
    const work = await WorkService.createWork(journalId, req.body, req.user);
    res.status(201).json(work);
  } catch (err) {
    if (err.message === 'work_type_id и grade_system_id обязательны') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

export async function updateWork(req, res, next) {
  try {
    const { id } = req.params;
    const work = await WorkRepository.findById(id);
    if (!work) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }
    const oldValue = work.toJSON();
    const updated = await WorkService.updateWork(id, req.body, req.user);
    await AuditLogRepository.create({
      userId: req.user.userId,
      action: 'UPDATE_WORK',
      tableName: 'works',
      oldValue,
      newValue: updated,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteWork(req, res, next) {
  try {
    const { id } = req.params;
    const work = await WorkRepository.findById(id);
    if (!work) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }
    const oldValue = work.toJSON();
    await WorkService.deleteWork(id, req.user);
    await AuditLogRepository.create({
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
    const dicts = await WorkService.getDictionaries();
    res.json(dicts);
  } catch (err) {
    next(err);
  }
}
