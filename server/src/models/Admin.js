import User from './User.js';

export default class Admin extends User {
  constructor(data = {}) {
    super(data);
    if (!this.role) this.role = 'admin';
  }

  toJSON() {
    return {
      ...super.toJSON(),
    };
  }
}
