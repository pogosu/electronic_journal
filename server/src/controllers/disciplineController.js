import Discipline from '../models/Discipline.js';
import AuditLog from '../models/AuditLog.js';

export async function getDisciplines(req, res, next) {
  try {
    const { search } = req.query;
    const disciplines = await Discipline.findWithSearch(search);
    res.json(disciplines.map((d) => d.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function createDiscipline(req, res, next) {
  try {
    const { name } = req.body;
    const discipline = new Discipline({ name });
    await discipline.save();
    await AuditLog.create({
      userId: req.user.userId,
      action: 'CREATE_DISCIPLINE',
      tableName: 'disciplines',
      newValue: discipline.toJSON(),
    });
    res.status(201).json(discipline.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteDiscipline(req, res, next) {
  try {
    const { id } = req.params;
    const discipline = await Discipline.findById(id);
    if (!discipline) {
      return res.status(404).json({ error: 'Дисциплина не найдена' });
    }
    const oldValue = discipline.toJSON();
    await discipline.delete();
    await AuditLog.create({
      userId: req.user.userId,
      action: 'DELETE_DISCIPLINE',
      tableName: 'disciplines',
      oldValue,
      newValue: { deleted: true, id: parseInt(id, 10) },
    });
    res.json({ message: 'Дисциплина удалена' });
  } catch (err) {
    next(err);
  }
}
