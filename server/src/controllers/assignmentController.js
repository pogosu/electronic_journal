import AssignmentService from '../services/AssignmentService.js';
import Teacher from '../models/Teacher.js';

export async function getAssignments(req, res, next) {
  try {
    const options = {};
    if (req.user.role === 'teacher') {
      options.teacherUserId = req.user.userId;
    }
    const assignments = await AssignmentService.getAssignments(options);
    res.json(assignments);
  } catch (err) {
    next(err);
  }
}

export async function createAssignment(req, res, next) {
  try {
    const { teacherUserId, teacherId, groupId, disciplineId, semester } = req.body;
    const resolvedTeacherId = teacherId || await Teacher.getIdByUserId(teacherUserId);
    if (!resolvedTeacherId) {
      return res.status(400).json({ error: 'Преподаватель не найден' });
    }
    const assignment = await AssignmentService.createAssignment(
      { teacherId: resolvedTeacherId, groupId, disciplineId, semester },
      req.user
    );
    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
}

export async function deleteAssignment(req, res, next) {
  try {
    const { id } = req.params;
    await AssignmentService.deleteAssignment(id, req.user);
    res.json({ message: 'Назначение удалено' });
  } catch (err) {
    if (err.message === 'Назначение не найдено') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}
