import WorkRepository from '../repositories/WorkRepository.js';
import AuditService from './AuditService.js';

class WorkService {
  async createWork(journalId, data, user) {
    const work = await WorkRepository.create({
      journalId,
      title: data.title,
      workTypeId: data.work_type_id,
      gradeSystemId: data.grade_system_id,
      minScore: data.min_score || 0,
      maxScore: data.max_score,
      isMandatory: data.is_mandatory !== false,
      deadline: data.deadline || null,
      displayOrder: data.display_order || 0,
    });
    if (!work.workTypeId || !work.gradeSystemId) {
      throw new Error('work_type_id и grade_system_id обязательны');
    }
    await AuditService.logChange({ userId: user.userId, action: 'CREATE_WORK', tableName: 'works', newValue: work.toJSON() });
    return work.toJSON();
  }

  async getWorksByJournal(journalId) {
    return WorkRepository.findByJournal(journalId);
  }

  async getDictionaries() {
    return WorkRepository.findDictionaries();
  }

  async reorderWorks(journalId, workIds) {
    await WorkRepository.reorder(journalId, workIds);
  }

  async updateWork(id, data, user) {
    const work = await WorkRepository.update(id, {
      title: data.title,
      workTypeId: data.work_type_id,
      gradeSystemId: data.grade_system_id,
      minScore: data.min_score,
      maxScore: data.max_score,
      isMandatory: data.is_mandatory,
      deadline: data.deadline,
    });
    await AuditService.logChange({ userId: user.userId, action: 'UPDATE_WORK', tableName: 'works', newValue: work.toJSON() });
    return work.toJSON();
  }

  async deleteWork(id, user) {
    await WorkRepository.deleteById(id);
    await AuditService.logChange({ userId: user.userId, action: 'DELETE_WORK', tableName: 'works', newValue: { deleted: true, id } });
    return { deleted: true };
  }
}

export default new WorkService();
