import JournalService from '../services/JournalService.js';
import WorkService from '../services/WorkService.js';
import LessonService from '../services/LessonService.js';

export async function getJournals(req, res, next) {
  try {
    const { groupId, teacherId, discipline } = req.query;
    const options = {};
    if (groupId) options.groupId = groupId;
    if (teacherId) options.teacherId = teacherId;
    if (discipline) options.discipline = discipline;
    const journals = await JournalService.getJournals(options, req.user);
    res.json(journals);
  } catch (err) {
    next(err);
  }
}

export async function getJournalById(req, res, next) {
  try {
    const { id } = req.params;
    const data = await JournalService.getJournalById(id);
    res.json(data);
  } catch (err) {
    if (err.message === 'Журнал не найден') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

export async function createJournal(req, res, next) {
  try {
    const { groupId, teacherId, disciplineId, semester } = req.body;
    const journal = await JournalService.createJournal({ groupId, teacherId, disciplineId, semester }, req.user);
    res.status(201).json(journal);
  } catch (err) {
    next(err);
  }
}

export async function createWork(req, res, next) {
  try {
    const { journalId } = req.params;
    const work = await WorkService.createWork(journalId, req.body, req.user);
    res.status(201).json(work);
  } catch (err) {
    if (err.message === 'work_type_id и grade_system_id обязательны') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

export async function createLesson(req, res, next) {
  try {
    const { journalId } = req.params;
    const lesson = await LessonService.createLesson(journalId, req.body, req.user);
    res.status(201).json(lesson);
  } catch (err) {
    next(err);
  }
}

export async function getJournalAttendanceTable(req, res, next) {
  try {
    const { id } = req.params;
    const data = await JournalService.getAttendanceTable(id);
    res.json(data);
  } catch (err) {
    if (err.message === 'Журнал не найден') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

export async function getJournalTable(req, res, next) {
  try {
    const { id } = req.params;
    const data = await JournalService.getGradeTable(id);
    res.json(data);
  } catch (err) {
    if (err.message === 'Журнал не найден') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}
