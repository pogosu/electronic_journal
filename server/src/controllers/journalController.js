import Journal from '../models/Journal.js';
import Work from '../models/Work.js';
import Lesson from '../models/Lesson.js';
import Teacher from '../models/Teacher.js';

export async function getJournals(req, res, next) {
  try {
    const { groupId, teacherId, discipline } = req.query;
    const options = {};
    if (groupId) options.groupId = groupId;
    if (teacherId) options.teacherId = teacherId;
    if (discipline) options.discipline = discipline;
    if (req.user.role === 'teacher') {
      const teacherId = await Teacher.getIdByUserId(req.user.userId);
      if (teacherId) options.teacherId = teacherId;
    }
    const journals = await Journal.findAll(options);
    res.json(journals.map((j) => j.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function getJournalById(req, res, next) {
  try {
    const { id } = req.params;
    const journal = await Journal.findById(id);
    if (!journal) {
      return res.status(404).json({ error: 'Журнал не найден' });
    }
    const [works, lessons, students] = await Promise.all([
      journal.getWorks(),
      journal.getLessons(),
      journal.getStudents(),
    ]);
    res.json({
      ...journal.toJSON(),
      works,
      lessons,
      students,
    });
  } catch (err) {
    next(err);
  }
}

export async function createJournal(req, res, next) {
  try {
    const { groupId, teacherId, disciplineId, semester } = req.body;
    const journal = new Journal({
      group_id: groupId,
      teacher_id: teacherId,
      discipline_id: disciplineId,
      semester,
      type: 'grades',
    });
    await journal.save();
    res.status(201).json(journal.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function createWork(req, res, next) {
  try {
    const { journalId } = req.params;
    const work = new Work({
      journal_id: journalId,
      title: req.body.title,
      work_type_id: req.body.work_type_id,
      grade_system_id: req.body.grade_system_id,
      min_score: req.body.min_score || 0,
      max_score: req.body.max_score,
      is_mandatory: req.body.is_mandatory !== false,
      deadline: req.body.deadline || null,
      display_order: req.body.display_order || 0,
    });
    if (!work.workTypeId || !work.gradeSystemId) {
      return res.status(400).json({ error: 'work_type_id и grade_system_id обязательны' });
    }
    await work.save();
    res.status(201).json(work.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function createLesson(req, res, next) {
  try {
    const { journalId } = req.params;
    const lesson = new Lesson({
      journal_id: journalId,
      lesson_date: req.body.lessonDate,
      lesson_type_id: req.body.lessonTypeId,
      display_order: req.body.displayOrder || 0,
    });
    await lesson.save();
    res.status(201).json(lesson.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function getJournalAttendanceTable(req, res, next) {
  try {
    const { id } = req.params;
    const journal = await Journal.findById(id);
    if (!journal) {
      return res.status(404).json({ error: 'Журнал не найден' });
    }
    const data = await journal.getAttendanceTable();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getJournalTable(req, res, next) {
  try {
    const { id } = req.params;
    const journal = await Journal.findById(id);
    if (!journal) {
      return res.status(404).json({ error: 'Журнал не найден' });
    }
    const data = await journal.getGradeTable();
    res.json(data);
  } catch (err) {
    next(err);
  }
}
