import Student from '../models/Student.js';
import StudentRepository from '../repositories/StudentRepository.js';
import GradeRepository from '../repositories/GradeRepository.js';
import AttendanceRepository from '../repositories/AttendanceRepository.js';
import JournalRepository from '../repositories/JournalRepository.js';

export async function getMyProfile(req, res, next) {
  try {
    const studentData = await StudentRepository.findByUserId(req.user.userId);
    if (!studentData) {
      return res.status(404).json({ error: 'Профиль не найден' });
    }
    const student = new Student(studentData);
    const profile = await student.getProfile(StudentRepository);
    res.json({ fullName: student.fullName, ...profile });
  } catch (err) {
    next(err);
  }
}

export async function getMyGrades(req, res, next) {
  try {
    const studentData = await StudentRepository.findByUserId(req.user.userId);
    if (!studentData) {
      return res.status(404).json({ error: 'Студент не найден' });
    }
    const student = new Student(studentData);
    const grades = await student.getGrades(GradeRepository);
    res.json(grades);
  } catch (err) {
    next(err);
  }
}

export async function getMyAttendance(req, res, next) {
  try {
    const studentData = await StudentRepository.findByUserId(req.user.userId);
    if (!studentData) {
      return res.status(404).json({ error: 'Студент не найден' });
    }
    const student = new Student(studentData);
    const attendances = await student.getAttendance(AttendanceRepository);
    res.json(attendances);
  } catch (err) {
    next(err);
  }
}

export async function getMyJournals(req, res, next) {
  try {
    const studentData = await StudentRepository.findByUserId(req.user.userId);
    if (!studentData) {
      return res.status(404).json({ error: 'Студент не найден' });
    }
    const student = new Student(studentData);
    const journals = await student.getMyJournals(JournalRepository);
    res.json(journals.map((j) => j.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function getMyGradesFull(req, res, next) {
  try {
    const studentData = await StudentRepository.findByUserId(req.user.userId);
    if (!studentData) {
      return res.status(404).json({ error: 'Студент не найден' });
    }
    const student = new Student(studentData);
    const data = await student.getMyGradesFullData(StudentRepository);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getMyStats(req, res, next) {
  try {
    const studentData = await StudentRepository.findByUserId(req.user.userId);
    if (!studentData) {
      return res.status(404).json({ error: 'Студент не найден' });
    }
    const student = new Student(studentData);
    const stats = await student.getFullStats(StudentRepository);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
