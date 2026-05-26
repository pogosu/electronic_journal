import { query } from '../config/db.js';

export default class Setting {
  static async ensureTable() {
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Seed default maintenance mode
    await query(`
      INSERT INTO settings (key, value) VALUES ('maintenance_mode', 'false')
      ON CONFLICT (key) DO NOTHING
    `);
  }

  static async get(key) {
    const result = await query('SELECT value FROM settings WHERE key = $1', [key]);
    return result.rows[0]?.value ?? null;
  }

  static async set(key, value) {
    await query(
      `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [key, value]
    );
  }
}
