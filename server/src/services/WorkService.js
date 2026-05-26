import Work from '../models/Work.js';
import AuditService from './AuditService.js';

class WorkService {
  async createWork(journalId, data, user) {
    const work = new Work({
      journal_id: journalId,
      title: data.title,
      work_type_id: data.work_type_id,
      grade_system_id: data.grade_system_id,
      min_score: data.min_score || 0,
      max_score: data.max_score,
      is_mandatory: data.is_mandatory !== false,
      deadline: data.deadline || null,
      display_order: data.display_order || 0,
    });
    if (!work.workTypeId || !work.gradeSystemId) {
      throw new Error('work_type_id и grade_system_id обязательны');
    }
    await work.save();
    await AuditService.logChange({ userId: user.userId, action: 'CREATE_WORK', tableName: 'works', newValue: work.toJSON() });
    return work.toJSON();
  }

  async getWorksByJournal(journalId) {
    return Work.findByJournal(journalId);
  }

  async getDictionaries() {
    return Work.findDictionaries();
  }

  async reorderWorks(journalId, workIds) {
    await Work.reorder(journalId, workIds);
  }
}

export default new WorkService();
