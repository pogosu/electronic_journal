import Journal from '../models/Journal.js';
import Teacher from '../models/Teacher.js';
import AuditService from './AuditService.js';

class JournalService {
  async getJournals(options, user) {
    if (user.role === 'teacher') {
      const teacherId = await Teacher.getIdByUserId(user.userId);
      if (teacherId) options.teacherId = teacherId;
    }
    const journals = await Journal.findAll(options);
    return journals.map((j) => j.toJSON());
  }

  async getJournalById(id) {
    const journal = await Journal.findById(id);
    if (!journal) throw new Error('Журнал не найден');
    const [works, lessons, students] = await Promise.all([
      journal.getWorks(),
      journal.getLessons(),
      journal.getStudents(),
    ]);
    return { ...journal.toJSON(), works, lessons, students };
  }

  async createJournal(data, user) {
    const { groupId, teacherId, disciplineId, semester } = data;
    const journal = new Journal({ group_id: groupId, teacher_id: teacherId, discipline_id: disciplineId, semester, type: 'grades' });
    await journal.save();
    await AuditService.logChange({ userId: user.userId, action: 'CREATE_JOURNAL', tableName: 'journals', newValue: journal.toJSON() });
    return journal.toJSON();
  }

  async getGradeTable(id) {
    const journal = await Journal.findById(id);
    if (!journal) throw new Error('Журнал не найден');
    return journal.getGradeTable();
  }

  async getAttendanceTable(id) {
    const journal = await Journal.findById(id);
    if (!journal) throw new Error('Журнал не найден');
    return journal.getAttendanceTable();
  }
}

export default new JournalService();
