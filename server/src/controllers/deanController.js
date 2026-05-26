import DeanReportService from '../services/DeanReportService.js';

export async function getGroupSummaries(req, res, next) {
  try {
    const rows = await DeanReportService.getGroupSummaries();
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getGroupDisciplines(req, res, next) {
  try {
    const { groupId } = req.params;
    const rows = await DeanReportService.getGroupDisciplines(groupId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getDisciplineSummaries(req, res, next) {
  try {
    const rows = await DeanReportService.getDisciplineSummaries();
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getStudentSummariesByGroup(req, res, next) {
  try {
    const { groupId } = req.params;
    const rows = await DeanReportService.getStudentSummariesByGroup(groupId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
