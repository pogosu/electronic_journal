/**
 * Базовый класс для объектов-значений (Value Object).
 * VO определяется только своим содержимым, не имеет идентичности (id).
 * Immutable — после создания не изменяется.
 */
export default class ValueObject {
  constructor() {
    // Подкласс должен установить свои поля до freeze
  }

  /**
   * Сделать объект неизменяемым.
   * Вызывать в конце конструктора подкласса.
   */
  _freeze() {
    Object.freeze(this);
  }

  /**
   * Два VO равны, если их toJSON() совпадают.
   */
  equals(other) {
    if (!(other instanceof ValueObject)) return false;
    return JSON.stringify(this.toJSON()) === JSON.stringify(other.toJSON());
  }

  /**
   * Должен быть переопределён в подклассе.
   * @returns {object}
   */
  toJSON() {
    throw new Error(`Subclass ${this.constructor.name} must implement toJSON()`);
  }
}
