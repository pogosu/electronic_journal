import Assignment from '../models/Assignment.js';
import AuditService from './AuditService.js';

class AssignmentService {
  async createAssignment(data, user) {
    const { teacherId, groupId, disciplineId, semester } = data;
    const assignment = await Assignment.create({ teacherId, groupId, disciplineId, semester });
    await AuditService.logChange({ userId: user.userId, action: 'CREATE_ASSIGNMENT', tableName: 'teacher_assignments', newValue: assignment.toJSON() });
    return assignment.toJSON();
  }

  async deleteAssignment(id, user) {
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new Error('Назначение не найдено');
    const oldValue = assignment.toJSON();
    await Assignment.deleteJournals(assignment);
    await assignment.delete();
    await AuditService.logChange({ userId: user.userId, action: 'DELETE_ASSIGNMENT', tableName: 'teacher_assignments', oldValue });
    return { deleted: true };
  }

  async getAssignments(options) {
    return Assignment.findAll(options);
  }
}

export default new AssignmentService();
