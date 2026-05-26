import Grade from '../models/Grade.js';
import Work from '../models/Work.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import AuditService from './AuditService.js';

class GradeService {
  async setGrade({ studentId, workId, score }, user) {
    let teacherId = null;
    if (user.role === 'teacher') {
      teacherId = await Teacher.getIdByUserId(user.userId);
      if (!teacherId) throw new Error('Только преподаватель может выставлять оценки');
    }

    const work = await Work.findById(workId);
    if (!work) throw new Error('Работа не найдена');

    const isDelete = score === null || score === undefined || score === '';
    if (isDelete) {
      await Grade.deleteByStudentAndWork(studentId, workId);
      const result = { deleted: true, student_id: studentId, work_id: workId };
      await AuditService.logChange({ userId: user.userId, action: 'SET_GRADE', tableName: 'grades', newValue: result });
      return result;
    }

    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < work.minScore || numScore > work.maxScore) {
      throw new Error(`Оценка должна быть в диапазоне [${work.minScore}, ${work.maxScore}]`);
    }

    const existingId = await Grade.findByStudentAndWork(studentId, workId);
    let oldValue = null;
    if (existingId) {
      const oldGrade = await Grade.findById(existingId);
      if (oldGrade) oldValue = oldGrade.toJSON();
    }

    const grade = new Grade({ id: existingId, student_id: studentId, work_id: workId, score: numScore, teacher_id: teacherId });
    await grade.save();
    await AuditService.logChange({ userId: user.userId, action: 'SET_GRADE', tableName: 'grades', oldValue, newValue: grade.toJSON() });
    return grade.toJSON();
  }

  async getGrades(filters) {
    return Grade.findWithFilters(filters);
  }

  async getStudentStats(studentId) {
    const student = await Student.findById(parseInt(studentId, 10));
    if (!student) throw new Error('Студент не найден');
    return student.getFullStats();
  }
}

export default new GradeService();
