import Setting from '../models/Setting.js';
import AuditLog from '../models/AuditLog.js';

export async function getMaintenanceMode(req, res, next) {
  try {
    const value = await Setting.get('maintenance_mode');
    res.json({ maintenance: value === 'true' });
  } catch (err) {
    next(err);
  }
}

export async function setMaintenanceMode(req, res, next) {
  try {
    const { maintenance } = req.body;
    await Setting.set('maintenance_mode', String(maintenance));
    await AuditLog.create({
      userId: req.user.userId,
      action: 'SET_MAINTENANCE',
      tableName: 'settings',
      newValue: { maintenance_mode: maintenance },
    });
    res.json({ maintenance });
  } catch (err) {
    next(err);
  }
}
