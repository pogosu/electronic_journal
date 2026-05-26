import Student from '../models/Student.js';
import Grade from '../models/Grade.js';
import Attendance from '../models/Attendance.js';
import Journal from '../models/Journal.js';

export async function getMyProfile(req, res, next) {
  try {
    const student = await Student.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ error: 'Профиль не найден' });
    }
    const profile = await student.getProfile();
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function getMyGrades(req, res, next) {
  try {
    const student = await Student.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ error: 'Студент не найден' });
    }
    const grades = await Grade.findByStudent(student.studentId, { orderBy: 'g.grade_date DESC' });
    res.json(grades);
  } catch (err) {
    next(err);
  }
}

export async function getMyAttendance(req, res, next) {
  try {
    const student = await Student.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ error: 'Студент не найден' });
    }
    const attendances = await Attendance.findByStudent(student.studentId);
    res.json(attendances);
  } catch (err) {
    next(err);
  }
}

export async function getMyJournals(req, res, next) {
  try {
    const student = await Student.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ error: 'Студент не найден' });
    }
    const journals = await Journal.findAll({ groupId: student.groupId });
    res.json(journals.map((j) => j.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function getMyGradesFull(req, res, next) {
  try {
    const student = await Student.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ error: 'Студент не найден' });
    }
    const data = await student.getMyGradesFullData();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getMyStats(req, res, next) {
  try {
    const student = await Student.findByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ error: 'Студент не найден' });
    }
    const stats = await student.getFullStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
