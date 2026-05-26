import Assignment from '../models/Assignment.js';
import Teacher from '../models/Teacher.js';
import Group from '../models/Group.js';
import Discipline from '../models/Discipline.js';
import AuditLog from '../models/AuditLog.js';

export async function getAssignments(req, res, next) {
  try {
    const options = {};
    if (req.user.role === 'teacher') {
      options.teacherUserId = req.user.userId;
    }
    const assignments = await Assignment.findAll(options);
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
    const assignment = await Assignment.create({ teacherId: resolvedTeacherId, groupId, disciplineId, semester });
    const [teacher, group, discipline] = await Promise.all([
      Teacher.findById(resolvedTeacherId),
      Group.findById(groupId),
      Discipline.findById(disciplineId),
    ]);
    await AuditLog.create({
      userId: req.user.userId,
      action: 'CREATE_ASSIGNMENT',
      tableName: 'teacher_assignments',
      newValue: {
        ...assignment.toJSON(),
        teacher_name: teacher?.fullName || null,
        group_name: group?.name || null,
        discipline_name: discipline?.name || null,
      },
    });
    res.status(201).json(assignment.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Назначение не найдено' });
    }

    const oldValue = assignment.toJSON();
    await Assignment.deleteJournals(assignment);
    await assignment.delete();
    await AuditLog.create({
      userId: req.user.userId,
      action: 'DELETE_ASSIGNMENT',
      tableName: 'teacher_assignments',
      oldValue,
      newValue: { deleted: true, id: parseInt(id, 10) },
    });
    res.json({ message: 'Назначение удалено' });
  } catch (err) {
    next(err);
  }
}
