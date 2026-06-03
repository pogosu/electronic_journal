import JournalRepository from '../repositories/JournalRepository.js';
import TeacherRepository from '../repositories/TeacherRepository.js';
import AuditService from './AuditService.js';

class JournalService {
  async getJournals(options, user) {
    if (user.role === 'teacher') {
      const teacherId = await TeacherRepository.getIdByUserId(user.userId);
      if (teacherId) options.teacherId = teacherId;
    }
    const journals = await JournalRepository.findAll(options);
    return journals.map((j) => j.toJSON());
  }

  async getJournalById(id) {
    const journal = await JournalRepository.findById(id);
    if (!journal) throw new Error('Журнал не найден');
    const [works, lessons, students] = await Promise.all([
      JournalRepository.getWorks(id),
      JournalRepository.getLessons(id),
      JournalRepository.getStudents(id),
    ]);
    return { ...journal.toJSON(), works, lessons, students };
  }

  async createJournal(data, user) {
    const { groupId, teacherId, disciplineId, semester } = data;
    const journal = await JournalRepository.create({ groupId, teacherId, disciplineId, semester, type: 'grades' });
    await AuditService.logChange({ userId: user.userId, action: 'CREATE_JOURNAL', tableName: 'journals', newValue: journal.toJSON() });
    return journal.toJSON();
  }

  async getGradeTable(id) {
    return JournalRepository.getGradeTable(id);
  }

  async getAttendanceTable(id) {
    return JournalRepository.getAttendanceTable(id);
  }
}

export default new JournalService();
