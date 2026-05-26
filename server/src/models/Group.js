import { query } from '../config/db.js';
import { Entity } from './base/index.js';

export default class Group extends Entity {
  static tableName = 'groups';
  static columns = ['name', 'admission_year'];

  #name;
  #admissionYear;

  constructor(data = {}) {
    super(data);
    this.#name = data.name ?? '';
    this.#admissionYear = data.admission_year ?? data.admissionYear ?? 0;
  }

  get name() {
    return this.#name;
  }

  get admissionYear() {
    return this.#admissionYear;
  }

  get course() {
    const now = new Date();
    return now.getFullYear() - this.#admissionYear + (now.getMonth() >= 8 ? 1 : 0);
  }

  set name(value) {
    this.#name = value;
  }

  set admissionYear(value) {
    this.#admissionYear = value;
  }

  getColumnValues() {
    return [this.#name, this.#admissionYear];
  }

  static async hasStudents(id) {
    const result = await query('SELECT COUNT(*) as cnt FROM students WHERE group_id = $1', [id]);
    return parseInt(result.rows[0].cnt, 10) > 0;
  }

  static async getStudentCount(id) {
    const result = await query('SELECT COUNT(*) as cnt FROM students WHERE group_id = $1', [id]);
    return parseInt(result.rows[0].cnt, 10);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.#name,
      admission_year: this.#admissionYear,
      course: this.course,
    };
  }
}
