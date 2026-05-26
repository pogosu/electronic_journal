import User from './User.js';
import Student from './Student.js';
import Journal from './Journal.js';
import Discipline from './Discipline.js';
import { query } from '../config/db.js';

/**
 * Деканат.
 * Имеет доступ ко всем данным для просмотра и формирования отчётов,
 * но не может редактировать оценки и посещаемость.
 */
export default class Deanery extends User {
  constructor(data = {}) {
    super(data);
    if (!this.role) this.role = 'deanery';
  }

  // ==================== Students ====================

  async getAllStudents() {
    const result = await query(
      `SELECT DISTINCT s.id, u.full_name, g.name as group_name, g.admission_year
       FROM students s
       JOIN users u ON u.id = s.user_id
       JOIN groups g ON g.id = s.group_id
       ORDER BY u.full_name`
    );
    return result.rows;
  }

  async getStudentById(studentId) {
    return Student.findById(studentId);
  }

  async getStudentProfile(studentId) {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Студент не найден');
    return student.getProfile();
  }

  async getStudentStats(studentId) {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Студент не найден');
    return student.getFullStats();
  }

  async getStudentGrades(studentId) {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Студент не найден');
    return student.getMyGradesFullData();
  }

  // ==================== Journals ====================

  async getAllJournals() {
    const result = await query(
      `SELECT j.*, g.name as group_name, d.name as discipline_name
       FROM journals j
       JOIN groups g ON g.id = j.group_id
       JOIN disciplines d ON d.id = j.discipline_id
       ORDER BY d.name, g.name`
    );
    return result.rows;
  }

  async getJournalById(journalId) {
    const journal = await Journal.findById(journalId);
    if (!journal) throw new Error('Журнал не найден');
    const [works, lessons, students] = await Promise.all([
      journal.getWorks(),
      journal.getLessons(),
      journal.getStudents(),
    ]);
    return { ...journal.toJSON(), works, lessons, students };
  }

  // ==================== Disciplines ====================

  async getAllDisciplines() {
    return Discipline.findAll({ orderBy: 'name' });
  }

  async getDisciplineById(disciplineId) {
    return Discipline.findById(disciplineId);
  }

  // ==================== Reports ====================

  async getGroupSummaries() {
    const { default: DeanReportService } = await import('../services/DeanReportService.js');
    return DeanReportService.getGroupSummaries();
  }

  async getGroupDisciplines(groupId) {
    const { default: DeanReportService } = await import('../services/DeanReportService.js');
    return DeanReportService.getGroupDisciplines(groupId);
  }

  async getDisciplineSummaries() {
    const { default: DeanReportService } = await import('../services/DeanReportService.js');
    return DeanReportService.getDisciplineSummaries();
  }

  async getStudentSummariesByGroup(groupId) {
    const { default: DeanReportService } = await import('../services/DeanReportService.js');
    return DeanReportService.getStudentSummariesByGroup(groupId);
  }

  // ==================== Permissions ====================

  canViewAllStudents() { return true; }
  canViewAllJournals() { return true; }
  canViewAllDisciplines() { return true; }
  canViewReports() { return true; }
  canManageUsers() { return false; }
  canManageGroups() { return false; }
  canManageDisciplines() { return false; }
  canEditGrades() { return false; }
  canEditAttendance() { return false; }

  toJSON() {
    return { ...super.toJSON() };
  }
}
