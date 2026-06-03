import { query } from '../config/db.js';
import { getCache, setCache } from '../utils/cache.js';

export async function getLessonTypes(req, res, next) {
  try {
    const cacheKey = 'lesson-types';
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const result = await query('SELECT * FROM lesson_types ORDER BY name');
    const json = result.rows;
    setCache(cacheKey, json, 600000);
    res.json(json);
  } catch (err) {
    next(err);
  }
}

export async function createLessonType(req, res, next) {
  try {
    const { name, slug } = req.body;
    const result = await query(
      'INSERT INTO lesson_types (name, slug) VALUES ($1, $2) RETURNING *',
      [name, slug]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}
