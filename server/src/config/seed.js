import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  const sql = fs.readFileSync(path.join(__dirname, 'seeds.sql'), 'utf-8');
  try {
    await pool.query(sql);
    console.log('Seeds applied successfully');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
