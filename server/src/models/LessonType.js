import { Entity } from './base/index.js';

export default class LessonType extends Entity {
  static tableName = 'lesson_types';
  static columns = ['name', 'slug'];

  #name;
  #slug;

  constructor(data = {}) {
    super(data);
    this.#name = data.name ?? '';
    this.#slug = data.slug ?? '';
  }

  get name() {
    return this.#name;
  }

  get slug() {
    return this.#slug;
  }

  set name(value) {
    this.#name = value;
  }

  set slug(value) {
    this.#slug = value;
  }

  getColumnValues() {
    return [this.#name, this.#slug];
  }

  toJSON() {
    return {
      id: this.id,
      name: this.#name,
      slug: this.#slug,
    };
  }
}
