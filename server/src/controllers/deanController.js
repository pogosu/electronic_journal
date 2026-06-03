import Deanery from '../models/Deanery.js';
import DeanReportService from '../services/DeanReportService.js';

export async function getGroupSummaries(req, res, next) {
  try {
    const dean = new Deanery(req.user);
    const rows = await dean.getGroupSummaries(DeanReportService);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getGroupDisciplines(req, res, next) {
  try {
    const { groupId } = req.params;
    const dean = new Deanery(req.user);
    const rows = await dean.getGroupDisciplines(groupId, DeanReportService);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getDisciplineSummaries(req, res, next) {
  try {
    const dean = new Deanery(req.user);
    const rows = await dean.getDisciplineSummaries(DeanReportService);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getStudentSummariesByGroup(req, res, next) {
  try {
    const { groupId } = req.params;
    const dean = new Deanery(req.user);
    const rows = await dean.getStudentSummariesByGroup(groupId, DeanReportService);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
