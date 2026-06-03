export default class Discipline {
  constructor({ id, name } = {}) {
    this.id = id ?? null;
    this.name = name ?? '';
  }

  toJSON() {
    return { id: this.id, name: this.name };
  }
}
