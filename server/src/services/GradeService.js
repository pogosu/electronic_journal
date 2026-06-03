import GradeRepository from '../repositories/GradeRepository.js';
import WorkRepository from '../repositories/WorkRepository.js';
import TeacherRepository from '../repositories/TeacherRepository.js';
import StudentRepository from '../repositories/StudentRepository.js';
import AuditService from './AuditService.js';
import Grade from '../models/Grade.js';

class GradeService {
  async setGrade({ studentId, workId, score }, user) {
    let teacherId = null;
    if (user.role === 'teacher') {
      teacherId = await TeacherRepository.getIdByUserId(user.userId);
      if (!teacherId) throw new Error('Только преподаватель может выставлять оценки');
    }

    const work = await WorkRepository.findById(workId);
    if (!work) throw new Error('Работа не найдена');

    const isDelete = score === null || score === undefined || score === '';
    if (isDelete) {
      await GradeRepository.deleteByStudentAndWork(studentId, workId);
      const result = { deleted: true, student_id: studentId, work_id: workId };
      await AuditService.logChange({ userId: user.userId, action: 'SET_GRADE', tableName: 'grades', newValue: result });
      return result;
    }

    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < work.minScore || numScore > work.maxScore) {
      throw new Error(`Оценка должна быть в диапазоне [${work.minScore}, ${work.maxScore}]`);
    }

    const existingId = await GradeRepository.findByStudentAndWork(studentId, workId);
    let oldValue = null;
    if (existingId) {
      const oldGrade = await GradeRepository.findFullById(existingId);
      if (oldGrade) oldValue = oldGrade.toJSON();
    }

    const grade = new Grade({ id: existingId, student_id: studentId, work_id: workId, score: numScore, teacher_id: teacherId });
    await GradeRepository.save(grade);

    const savedGrade = await GradeRepository.findFullById(grade.id);
    const newValue = savedGrade ? savedGrade.toJSON() : grade.toJSON();
    await AuditService.logChange({ userId: user.userId, action: 'SET_GRADE', tableName: 'grades', oldValue, newValue });
    return newValue;
  }

  async getGrades(filters) {
    return GradeRepository.findWithFilters(filters);
  }

  async getStudentStats(studentId) {
    const student = await StudentRepository.findById(parseInt(studentId, 10));
    if (!student) throw new Error('Студент не найден');
    return StudentRepository.getFullStats(student.studentId);
  }
}

export default new GradeService();
