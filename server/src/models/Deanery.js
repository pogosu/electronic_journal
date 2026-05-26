import User from './User.js';

export default class Deanery extends User {
  constructor(data = {}) {
    super(data);
    if (!this.role) this.role = 'deanery';
  }

  toJSON() {
    return {
      ...super.toJSON(),
    };
  }
}
