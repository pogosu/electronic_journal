import User from './User.js';

export default class Deanery extends User {
  constructor(data = {}) {
    super(data);
    if (!this.role) this.role = 'deanery';
  }

  async getAllStudents(studentRepo) {
    return studentRepo.findAll();
  }

  async getStudentById(id, studentRepo) {
    return studentRepo.findById(id);
  }

  async getStudentProfile(id, studentRepo) {
    return studentRepo.getProfile(id);
  }

  async getStudentStats(id, studentRepo) {
    return studentRepo.getFullStats(id);
  }

  async getStudentGrades(id, gradeRepo) {
    return gradeRepo.findByStudent(id);
  }

  async getAllJournals(journalRepo) {
    return journalRepo.findAll();
  }

  async getJournalById(id, journalRepo) {
    return journalRepo.findById(id);
  }

  async getAllDisciplines(disciplineRepo) {
    return disciplineRepo.findAll();
  }

  async getDisciplineById(id, disciplineRepo) {
    return disciplineRepo.findById(id);
  }

  async getGroupSummaries(deanReportRepo) {
    return deanReportRepo.getGroupSummaries();
  }

  async getGroupDisciplines(groupId, deanReportRepo) {
    return deanReportRepo.getGroupDisciplines(groupId);
  }

  async getDisciplineSummaries(deanReportRepo) {
    return deanReportRepo.getDisciplineSummaries();
  }

  async getStudentSummariesByGroup(groupId, deanReportRepo) {
    return deanReportRepo.getStudentSummariesByGroup(groupId);
  }
}
