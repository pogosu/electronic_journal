import LessonType from '../models/LessonType.js';
import { getCache, setCache } from '../utils/cache.js';

export async function getLessonTypes(req, res, next) {
  try {
    const cacheKey = 'lesson-types';
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const lessonTypes = await LessonType.findAll({ orderBy: 'name' });
    const json = lessonTypes.map((lt) => lt.toJSON());
    setCache(cacheKey, json, 600000);
    res.json(json);
  } catch (err) {
    next(err);
  }
}

export async function createLessonType(req, res, next) {
  try {
    const { name, slug } = req.body;
    const lessonType = new LessonType({ name, slug });
    await lessonType.save();
    res.status(201).json(lessonType.toJSON());
  } catch (err) {
    next(err);
  }
}
