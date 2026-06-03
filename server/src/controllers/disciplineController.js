import DisciplineRepository from '../repositories/DisciplineRepository.js';
import AuditLogRepository from '../repositories/AuditLogRepository.js';

export async function getDisciplines(req, res, next) {
  try {
    const { search } = req.query;
    const disciplines = await DisciplineRepository.findWithSearch(search);
    res.json(disciplines.map((d) => d.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function createDiscipline(req, res, next) {
  try {
    const { name } = req.body;
    const discipline = await DisciplineRepository.create({ name });
    await AuditLogRepository.create({
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
    const discipline = await DisciplineRepository.findById(id);
    if (!discipline) {
      return res.status(404).json({ error: 'Дисциплина не найдена' });
    }
    const oldValue = discipline.toJSON();
    await DisciplineRepository.deleteById(id);
    await AuditLogRepository.create({
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
