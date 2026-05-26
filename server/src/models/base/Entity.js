import { query } from '../../config/db.js';

/**
 * Базовый класс для всех доменных сущностей (Entity).
 * Предоставляет generic CRUD-операции.
 * Каждый подкласс должен переопределить tableName и columns.
 */
export default class Entity {
  #id;

  constructor(data = {}) {
    this.#id = data.id ?? null;
  }

  get id() {
    return this.#id;
  }

  _setId(id) {
    this.#id = id;
  }

  /**
   * Имя таблицы в БД. Должен быть переопределён в подклассе.
   * @returns {string}
   */
  static get tableName() {
    throw new Error(`Subclass ${this.name} must implement static getter tableName`);
  }

  /**
   * Список колонок для INSERT/UPDATE (без id).
   * Должен быть переопределён в подклассе.
   * @returns {string[]}
   */
  static get columns() {
    throw new Error(`Subclass ${this.name} must implement static getter columns`);
  }

  /**
   * Маппинг полей класса → колонок БД.
   * По умолчанию: поле 'fullName' → колонка 'full_name'.
   * Можно переопределить в подклассе.
   */
  static fieldToColumn(field) {
    return field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Получить значения колонок из текущего экземпляра.
   * Подкласс может переопределить для сложных случаев.
   */
  getColumnValues() {
    const values = [];
    for (const col of this.constructor.columns) {
      // Преобразуем snake_case в camelCase для доступа к приватным полям
      const field = col.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      // Пробуем получить через getter
      let val = this[field];
      if (val === undefined) {
        // Пробуем как есть (если поле уже в snake_case)
        val = this[col];
      }
      values.push(val ?? null);
    }
    return values;
  }

  // ==================== Static finders ====================

  static async findById(id) {
    const result = await query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return new this(result.rows[0]);
  }

  static async findAll(options = {}) {
    const { orderBy = 'id', where = null, limit = null } = options;
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (where) {
      const keys = Object.keys(where);
      const conditions = keys.map((k, i) => {
        params.push(where[k]);
        return `${k} = $${i + 1}`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY ${orderBy}`;

    if (limit) {
      params.push(limit);
      sql += ` LIMIT $${params.length}`;
    }

    const result = await query(sql, params);
    return result.rows.map((row) => new this(row));
  }

  static async findOne(where) {
    const keys = Object.keys(where);
    const values = Object.values(where);
    const conditions = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE ${conditions} LIMIT 1`,
      values
    );
    if (result.rows.length === 0) return null;
    return new this(result.rows[0]);
  }

  static async deleteById(id) {
    await query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
  }

  // ==================== Instance methods ====================

  async save() {
    const cols = this.constructor.columns;
    const values = this.getColumnValues();

    if (this.#id) {
      // UPDATE
      const setClause = cols.map((col, i) => `${col} = $${i + 1}`).join(', ');
      await query(
        `UPDATE ${this.constructor.tableName} SET ${setClause} WHERE id = $${cols.length + 1}`,
        [...values, this.#id]
      );
    } else {
      // INSERT
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const result = await query(
        `INSERT INTO ${this.constructor.tableName} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING id`,
        values
      );
      this.#id = result.rows[0].id;
    }
    return this;
  }

  async delete() {
    if (!this.#id) throw new Error('Cannot delete unsaved entity');
    await query(`DELETE FROM ${this.constructor.tableName} WHERE id = $1`, [this.#id]);
  }

  equals(other) {
    return other instanceof Entity && this.#id !== null && this.#id === other.id;
  }

  toJSON() {
    return { id: this.#id };
  }
}
