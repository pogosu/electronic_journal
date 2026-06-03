import GradeService from '../services/GradeService.js';

export async function getGrades(req, res, next) {
  try {
    const { studentId, workId, journalId } = req.query;
    const filters = { studentId, workId, journalId, role: req.user.role, userId: req.user.userId };
    const grades = await GradeService.getGrades(filters);
    res.json(grades);
  } catch (err) {
    next(err);
  }
}

export async function setGrade(req, res, next) {
  try {
    const result = await GradeService.setGrade(req.body, req.user);
    res.json(result);
  } catch (err) {
    if (err.message === 'Работа не найдена') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.startsWith('Оценка должна быть в диапазоне')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === 'Только преподаватель может выставлять оценки') {
      return res.status(403).json({ error: err.message });
    }
    next(err);
  }
}

export async function getStudentStats(req, res, next) {
  try {
    const { studentId } = req.params;
    const stats = await GradeService.getStudentStats(studentId);
    res.json(stats);
  } catch (err) {
    if (err.message === 'Студент не найден') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}
