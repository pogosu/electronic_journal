import { query } from '../config/db.js';

/**
 * Сервис для работы со справочниками (Value Objects).
 * Загружает данные из БД, кэширует в памяти.
 */
class DictionaryService {
  #cache = new Map();
  #ttlMs = 60000; // 1 минута кэша

  _getCached(key) {
    const entry = this.#cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.#ttlMs) {
      this.#cache.delete(key);
      return null;
    }
    return entry.data;
  }

  _setCached(key, data) {
    this.#cache.set(key, { data, ts: Date.now() });
  }

  async _fetchTable(tableName, orderBy = 'name') {
    const cached = this._getCached(tableName);
    if (cached) return cached;
    const result = await query(`SELECT * FROM ${tableName} ORDER BY ${orderBy}`);
    this._setCached(tableName, result.rows);
    return result.rows;
  }

  // ==================== Disciplines ====================
  async getDisciplines() {
    return this._fetchTable('disciplines');
  }

  async findDisciplineById(id) {
    const rows = await this.getDisciplines();
    return rows.find((d) => d.id === id) ?? null;
  }

  async findDisciplinesBySearch(search) {
    if (!search) return this.getDisciplines();
    const result = await query(
      'SELECT * FROM disciplines WHERE name ILIKE $1 ORDER BY name',
      [`%${search}%`]
    );
    return result.rows;
  }

  // ==================== Lesson Types ====================
  async getLessonTypes() {
    return this._fetchTable('lesson_types');
  }

  async findLessonTypeById(id) {
    const rows = await this.getLessonTypes();
    return rows.find((lt) => lt.id === id) ?? null;
  }

  // ==================== Work Types ====================
  async getWorkTypes() {
    return this._fetchTable('work_types');
  }

  async findWorkTypeById(id) {
    const rows = await this.getWorkTypes();
    return rows.find((wt) => wt.id === id) ?? null;
  }

  // ==================== Grade Systems ====================
  async getGradeSystems() {
    return this._fetchTable('grade_systems');
  }

  async findGradeSystemById(id) {
    const rows = await this.getGradeSystems();
    return rows.find((gs) => gs.id === id) ?? null;
  }

  // ==================== Roles ====================
  async getRoles() {
    return this._fetchTable('roles', 'id');
  }

  async findRoleByName(name) {
    const rows = await this.getRoles();
    return rows.find((r) => r.name === name) ?? null;
  }

  // ==================== All Dictionaries ====================
  async getAllDictionaries() {
    const [workTypes, gradeSystems, lessonTypes] = await Promise.all([
      this.getWorkTypes(),
      this.getGradeSystems(),
      this.getLessonTypes(),
    ]);
    return { workTypes, gradeSystems, lessonTypes };
  }

  clearCache() {
    this.#cache.clear();
  }
}

export default new DictionaryService();
