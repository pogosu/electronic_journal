import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Users, Shield, Activity, Plus, X, UserPlus,
  Trash2, Pencil, GraduationCap, BookOpen, UserCog,
  Calendar, Wrench, Eye, RefreshCw
} from 'lucide-react';
import { getSemesterOptions, getCurrentSemester } from '../utils/semester';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { SkeletonTable } from '../components/SkeletonLoader';
import type { AuditLog, Group } from '../types';

function formatLogDate(dateStr: string) {
  // PostgreSQL TIMESTAMP возвращается как 'YYYY-MM-DD HH:MM:SS' без Z.
  // Чтобы браузер интерпретировал время как UTC и корректно конвертировал в локальный пояс,
  // заменяем пробел на T и добавляем Z.
  const iso = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
  return new Date(iso).toLocaleString('ru-RU');
}

interface UserItem {
  id: number;
  login: string;
  full_name: string;
  role: string;
  is_blocked: boolean;
  created_at: string;
  department?: string;
  group_name?: string;
}

interface DisciplineItem {
  id: number;
  name: string;
}

interface AssignmentItem {
  id: number;
  teacher_name: string;
  group_name: string;
  discipline_name: string;
  semester: string;
}

type TabKey = 'users' | 'groups' | 'disciplines' | 'assignments' | 'logs';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'users', label: 'Пользователи', icon: Users },
  { key: 'groups', label: 'Группы', icon: GraduationCap },
  { key: 'disciplines', label: 'Дисциплины', icon: BookOpen },
  { key: 'assignments', label: 'Назначения', icon: UserCog },
  { key: 'logs', label: 'Журнал событий', icon: Activity },
];

const roleLabel = (role: string) => {
  const map: Record<string, string> = {
    admin: 'Администратор',
    teacher: 'Преподаватель',
    student: 'Студент',
    deanery: 'Сотрудник деканата',
  };
  return map[role] || role;
};

const roleBadgeColor = (role: string) => {
  const map: Record<string, string> = {
    admin: 'bg-danger-50 text-danger-700',
    teacher: 'bg-primary-50 text-primary-700',
    student: 'bg-success-50 text-success-700',
    deanery: 'bg-accent-50 text-accent-700',
  };
  return map[role] || 'bg-slate-100 text-slate-700';
};

const actionLabels: Record<string, string> = {
  SET_GRADE: 'Изменена оценка',
  SET_ATTENDANCE: 'Отмечено посещение',
  CREATE_USER: 'Создан пользователь',
  DELETE_USER: 'Удалён пользователь',
  UPDATE_USER: 'Обновлён пользователь',
  UPDATE_USER_GROUP: 'Обновлена группа студента',
  UPDATE_USER_DEPARTMENT: 'Обновлена кафедра преподавателя',
  CREATE_GROUP: 'Создана группа',
  UPDATE_GROUP: 'Обновлена группа',
  DELETE_GROUP: 'Удалена группа',
  CREATE_DISCIPLINE: 'Создана дисциплина',
  DELETE_DISCIPLINE: 'Удалена дисциплина',
  CREATE_ASSIGNMENT: 'Создано назначение',
  DELETE_ASSIGNMENT: 'Удалено назначение',
  CREATE_WORK: 'Создана работа',
  UPDATE_WORK: 'Обновлена работа',
  DELETE_WORK: 'Удалена работа',
  CREATE_LESSON: 'Создано занятие',
  UPDATE_LESSON: 'Обновлено занятие',
  DELETE_LESSON: 'Удалено занятие',
  REORDER_LESSONS: 'Изменён порядок занятий',
  REORDER_WORKS: 'Изменён порядок работ',
  SET_MAINTENANCE: 'Режим обслуживания',
};

const actionBadgeColor = (action: string) => {
  if (action.startsWith('CREATE_')) return 'bg-success-50 text-success-700';
  if (action.startsWith('DELETE_')) return 'bg-danger-50 text-danger-700';
  if (action.startsWith('UPDATE_')) return 'bg-warning-50 text-warning-700';
  return 'bg-primary-50 text-primary-700';
};

function getLogSummary(log: AuditLog): string {
  const v = log.new_value;
  const actor = log.full_name || log.login || 'Система';
  const actorId = log.user_id;
  const idPart = (id: unknown) => (id !== undefined && id !== null ? ` (${id})` : '');

  const formatGrade = (score: number | null | undefined, gs?: string): string => {
    if (score === null || score === undefined) return '—';
    if (gs === 'Зачёт/Незачёт') return score === 1 ? 'зачёт' : 'незачёт';
    return String(score);
  };

  const actionVerb = (() => {
    switch (log.action) {
      case 'SET_GRADE':
        if (v?.deleted) return 'удалил оценку';
        if (log.old_value?.score !== undefined && log.old_value?.score !== null) return 'изменил оценку';
        return 'выставил оценку';
      case 'SET_ATTENDANCE':
        if (log.old_value?.status !== undefined && log.old_value?.status !== null) return 'изменил отметку посещаемости';
        return 'отметил посещаемость';
      case 'CREATE_USER': return 'создал пользователя';
      case 'UPDATE_USER': return 'обновил пользователя';
      case 'DELETE_USER': return 'удалил пользователя';
      case 'CREATE_GROUP': return 'создал группу';
      case 'UPDATE_GROUP': return 'обновил группу';
      case 'DELETE_GROUP': return 'удалил группу';
      case 'CREATE_DISCIPLINE': return 'создал дисциплину';
      case 'DELETE_DISCIPLINE': return 'удалил дисциплину';
      case 'CREATE_ASSIGNMENT': return 'назначил';
      case 'DELETE_ASSIGNMENT': return 'удалил назначение';
      case 'CREATE_WORK': return 'создал работу';
      case 'UPDATE_WORK': return 'обновил работу';
      case 'DELETE_WORK': return 'удалил работу';
      case 'CREATE_LESSON': return 'создал занятие';
      case 'UPDATE_LESSON': return 'обновил занятие';
      case 'DELETE_LESSON': return 'удалил занятие';
      case 'REORDER_LESSONS': return 'изменил порядок занятий';
      case 'REORDER_WORKS': return 'изменил порядок работ';
      case 'SET_MAINTENANCE': return v?.maintenance_mode ? 'включил' : 'выключил';
      default: return 'совершил действие';
    }
  })();

  const actorRole = roleLabel(log.role || '');
  const prefix = `${actorRole} ${actor}${idPart(actorId)} ${actionVerb}`;

  if (!v || typeof v !== 'object') return `${prefix} ${String(v || '')}`;

  switch (log.action) {
    case 'SET_GRADE': {
      if (v.deleted) {
        return `${prefix} студента ${v.student_name || 'ID: ' + v.student_id}${idPart(v.student_id)}, работа «${v.work_title || 'ID: ' + v.work_id}»${idPart(v.work_id)}`;
      }
      const oldScore = log.old_value?.score;
      const newScore = v.score;
      const gs = v.grade_system_name || log.old_value?.grade_system_name;
      if (oldScore !== undefined && oldScore !== null) {
        return `${prefix} студенту ${v.student_name || 'ID: ' + v.student_id}${idPart(v.student_id)} с ${formatGrade(oldScore, gs)} на ${formatGrade(newScore, gs)}, работа «${v.work_title || 'ID: ' + v.work_id}»${idPart(v.work_id)}`;
      }
      return `${prefix} ${formatGrade(newScore, gs)} студенту ${v.student_name || 'ID: ' + v.student_id}${idPart(v.student_id)}, работа «${v.work_title || 'ID: ' + v.work_id}»${idPart(v.work_id)}`;
    }
    case 'SET_ATTENDANCE': {
      const statusMap: Record<string, string> = { present: 'присутствие', absent: 'отсутствие', excused: 'уважительная', late: 'опоздание' };
      const oldStatus = log.old_value?.status;
      const newStatus = v.status;
      const dateStr = v.lesson_date ? String(v.lesson_date).slice(0, 10) : 'ID: ' + v.lesson_id;
      if (oldStatus !== undefined && oldStatus !== null) {
        return `${prefix} студенту ${v.student_name || 'ID: ' + v.student_id}${idPart(v.student_id)} с ${statusMap[oldStatus] || oldStatus} на ${statusMap[newStatus] || newStatus}, занятие ${dateStr}${idPart(v.lesson_id)}`;
      }
      return `${prefix} студента ${v.student_name || 'ID: ' + v.student_id}${idPart(v.student_id)}: ${statusMap[newStatus] || newStatus}, занятие ${dateStr}${idPart(v.lesson_id)}`;
    }
    case 'CREATE_USER':
    case 'UPDATE_USER':
      return `${prefix} ${v.full_name || v.login || '-'}${idPart(v.id)}`;
    case 'DELETE_USER':
      return `${prefix} ${v.full_name || v.login || '-'}${idPart(v.id ?? v.user_id)}`;
    case 'CREATE_GROUP':
    case 'UPDATE_GROUP':
    case 'DELETE_GROUP':
      return `${prefix} ${v.name || '-'}${idPart(v.id)}`;
    case 'CREATE_DISCIPLINE':
    case 'DELETE_DISCIPLINE':
      return `${prefix} «${v.name || '-'}»${idPart(v.id)}`;
    case 'CREATE_ASSIGNMENT':
      return `${prefix} ${v.teacher_name || '-'}${idPart(v.teacher_id)} на дисциплину «${v.discipline_name || '-'}»${idPart(v.discipline_id)}, группа ${v.group_name || '-'}${idPart(v.group_id)}`;
    case 'DELETE_ASSIGNMENT':
      return `${prefix}${idPart(v.id)}`;
    case 'CREATE_WORK':
    case 'UPDATE_WORK':
    case 'DELETE_WORK':
      return `${prefix} «${v.title || '-'}»${idPart(v.id)}`;
    case 'CREATE_LESSON':
    case 'UPDATE_LESSON':
    case 'DELETE_LESSON':
      return `${prefix} ${v.lesson_date || '-'}${idPart(v.id)}`;
    case 'REORDER_LESSONS':
      return `${prefix} в журнале${idPart(v.journal_id)}`;
    case 'REORDER_WORKS':
      return `${prefix} в журнале${idPart(v.journal_id)}`;
    case 'SET_MAINTENANCE':
      return `${prefix} режим обслуживания`;
    default:
      return `${prefix} ${Object.entries(v).map(([k, val]) => `${k}: ${val}`).slice(0, 2).join(', ')}`;
  }
}

function LogDetailButton({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);
  const summary = getLogSummary(log);
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-slate-600 whitespace-normal break-words" title={summary}>{summary}</span>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium underline whitespace-nowrap"
          title="Подробнее"
        >
          <Eye className="w-3 h-3" />
          Подробнее
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Детали записи</h3>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-auto p-6">
                <div className="mb-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Действие</span>
                  <p className="mt-1">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${actionBadgeColor(log.action)}`}>
                      {actionLabels[log.action] || log.action}
                    </span>
                  </p>
                </div>

                {log.old_value && (
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Было</span>
                    <pre className="mt-2 p-4 bg-slate-50 rounded-xl text-xs text-slate-700 overflow-auto border border-slate-100">
                      {JSON.stringify(log.old_value, null, 2)}
                    </pre>
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Стало</span>
                  <pre className="mt-2 p-4 bg-slate-50 rounded-xl text-xs text-slate-700 overflow-auto border border-slate-100">
                    {JSON.stringify(log.new_value, null, 2)}
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('users');
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const { showToast } = useToast();

  // Shared data
  const [users, setUsers] = useState<UserItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [uRes, gRes, dRes, aRes, lRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/groups'),
        api.get('/disciplines'),
        api.get('/assignments'),
        api.get('/admin/audit-logs'),
      ]);
      setUsers(uRes.data);
      setGroups(gRes.data);
      setDisciplines(dRes.data);
      setAssignments(aRes.data);
      setLogs(lRes.data);
    } catch {
      showToast('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    api.get('/settings/maintenance')
      .then((res) => setMaintenanceMode(res.data.maintenance))
      .catch(() => setMaintenanceMode(false));
  }, []);

  const refreshTab = async (tab: TabKey) => {
    try {
      if (tab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } else if (tab === 'groups') {
        const res = await api.get('/admin/groups');
        setGroups(res.data);
      } else if (tab === 'disciplines') {
        const res = await api.get('/disciplines');
        setDisciplines(res.data);
      } else if (tab === 'assignments') {
        const res = await api.get('/assignments');
        setAssignments(res.data);
      } else if (tab === 'logs') {
        const res = await api.get('/admin/audit-logs');
        setLogs(res.data);
      }
    } catch {
      showToast('Ошибка обновления', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonTable rows={8} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Панель администратора</h2>
          <p className="text-slate-500 mt-1">Управление пользователями, группами, дисциплинами и назначениями</p>
        </div>
        <button
          onClick={async () => {
            try {
              const next = !maintenanceMode;
              await api.put('/settings/maintenance', { maintenance: next });
              setMaintenanceMode(next);
              showToast(next ? 'Режим обслуживания включён' : 'Режим обслуживания выключен', 'success');
            } catch {
              showToast('Ошибка изменения режима', 'error');
            }
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all touch-target ${
            maintenanceMode
              ? 'bg-warning-100 text-warning-700 border border-warning-200'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent'
          }`}
        >
          <Wrench className="w-4 h-4" />
          {maintenanceMode ? 'Обслуживание: вкл' : 'Обслуживание: выкл'}
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                active
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-primary-500' : 'text-slate-400'}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'users' && <UsersTab users={users} groups={groups} onRefresh={() => refreshTab('users')} showToast={showToast} />}
          {activeTab === 'groups' && <GroupsTab groups={groups} onRefresh={() => refreshTab('groups')} showToast={showToast} />}
          {activeTab === 'disciplines' && <DisciplinesTab disciplines={disciplines} onRefresh={() => refreshTab('disciplines')} showToast={showToast} />}
          {activeTab === 'assignments' && <AssignmentsTab assignments={assignments} users={users} groups={groups} disciplines={disciplines} onRefresh={() => refreshTab('assignments')} showToast={showToast} />}
          {activeTab === 'logs' && <LogsTab logs={logs} users={users} onRefresh={() => refreshTab('logs')} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ========================= USERS ========================= */
function UsersTab({ users, groups, onRefresh, showToast }: { users: UserItem[]; groups: Group[]; onRefresh: () => void; showToast: any }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [showLogsFor, setShowLogsFor] = useState<number | null>(null);
  const [userLogs, setUserLogs] = useState<AuditLog[]>([]);
  const [creating, setCreating] = useState(false);
  const [fullNameError, setFullNameError] = useState(false);

  const [form, setForm] = useState({
    login: '',
    password: '',
    fullName: '',
    role: 'student',
    department: '',
    groupId: '',
    isBlocked: false,
  });

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.login.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const fullNameRegex = /^[а-яА-ЯёЁ\s-]+$/;

  const openCreate = () => {
    setEditingUser(null);
    setForm({ login: '', password: '', fullName: '', role: 'student', department: '', groupId: '', isBlocked: false });
    setFullNameError(false);
    setShowModal(true);
  };

  const openEdit = (u: UserItem) => {
    setEditingUser(u);
    setForm({
      login: u.login,
      password: '',
      fullName: u.full_name,
      role: u.role,
      department: u.department || '',
      groupId: u.group_name ? String(groups.find((g) => g.name === u.group_name)?.id || '') : '',
      isBlocked: u.is_blocked,
    });
    setFullNameError(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      showToast('Введите ФИО', 'error');
      return;
    }
    if (!/^[а-яА-ЯёЁ\s-]+$/.test(form.fullName.trim())) {
      showToast('ФИО может содержать только русские буквы, пробелы и тире', 'error');
      return;
    }
    if (!editingUser) {
      if (!form.login.trim()) {
        showToast('Введите логин', 'error');
        return;
      }
      if (!form.password.trim()) {
        showToast('Введите пароль', 'error');
        return;
      }
      if (form.password.trim().length < 6) {
        showToast('Пароль должен содержать минимум 6 символов', 'error');
        return;
      }
    }
    if (form.role === 'student' && !form.groupId) {
      showToast('Выберите группу для студента', 'error');
      return;
    }
    if (form.role === 'teacher' && !form.department.trim()) {
      showToast('Введите кафедру для преподавателя', 'error');
      return;
    }
    setCreating(true);
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, {
          fullName: form.fullName,
          role: form.role,
          isBlocked: form.isBlocked,
        });
        if (form.role === 'student' && form.groupId) {
          await api.put(`/admin/users/${editingUser.id}/group`, { groupId: parseInt(form.groupId) });
        }
        if (form.role === 'teacher' && form.department) {
          await api.put(`/admin/users/${editingUser.id}/department`, { department: form.department });
        }
        showToast('Пользователь обновлён', 'success');
      } else {
        await api.post('/admin/users', {
          login: form.login,
          password: form.password,
          fullName: form.fullName,
          role: form.role,
          department: form.department || undefined,
          groupId: form.groupId ? parseInt(form.groupId) : undefined,
        });
        showToast('Пользователь создан', 'success');
      }
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пользователя?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      showToast('Пользователь удалён', 'success');
      onRefresh();
    } catch {
      showToast('Ошибка удаления', 'error');
    }
  };

  const viewLogs = async (userId: number) => {
    try {
      const res = await api.get(`/admin/audit-logs?userId=${userId}`);
      setUserLogs(res.data);
      setShowLogsFor(userId);
    } catch {
      showToast('Ошибка загрузки логов', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по ФИО или логину..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white shadow-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white shadow-sm"
          >
            <option value="">Все роли</option>
            <option value="student">Студент</option>
            <option value="teacher">Преподаватель</option>
            <option value="deanery">Сотрудник деканата</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl text-sm font-medium touch-target shadow-lg shadow-primary-500/25"
        >
          <Plus className="w-4 h-4" />
          Новый пользователь
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">ФИО</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Логин</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Роль</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Группа / Кафедра</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Статус</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u, idx) => (
                <tr key={u.id} className={`transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''} hover:bg-primary-50/30`}>
                  <td className="px-5 py-3 font-semibold text-slate-900">{u.full_name}</td>
                  <td className="px-5 py-3 text-slate-600">{u.login}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${roleBadgeColor(u.role)}`}>
                      <Shield className="w-3 h-3" />
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{u.group_name || u.department || '-'}</td>
                  <td className="px-5 py-3">
                    {u.is_blocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-danger-50 text-danger-600 text-xs font-semibold">Заблокирован</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success-50 text-success-600 text-xs font-semibold">Активен</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors" title="Редактировать">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => viewLogs(u.id)} className="p-1.5 rounded-lg hover:bg-accent-50 text-accent-600 transition-colors" title="Логи">
                        <Activity className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500 transition-colors" title="Удалить">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">Пользователи не найдены</div>}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center"><UserPlus className="w-5 h-5 text-primary-600" /></div>
                  <h3 className="text-lg font-bold text-slate-900">{editingUser ? 'Редактировать пользователя' : 'Новый пользователь'}</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Логин</label>
                    <input required={!editingUser} type="text" disabled={!!editingUser} value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50 disabled:bg-slate-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Пароль {editingUser && <span className="text-slate-400 font-normal">(оставьте пустым)</span>}</label>
                    <input required={!editingUser} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50" />
                    {!editingUser && (
                      <p className="text-xs text-slate-400 mt-1">Минимум 6 символов</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">ФИО</label>
                  <input
                    required
                    type="text"
                    value={form.fullName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, fullName: val });
                      if (val && !fullNameRegex.test(val)) {
                        setFullNameError(true);
                      } else {
                        setFullNameError(false);
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val && !fullNameRegex.test(val)) {
                        setFullNameError(true);
                      } else {
                        setFullNameError(false);
                      }
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none text-sm bg-slate-50/50 ${
                      fullNameError
                        ? 'border-danger-500 focus:ring-2 focus:ring-danger-500 focus:border-transparent'
                        : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                    }`}
                  />
                  {fullNameError && (
                    <p className="text-xs text-danger-500 mt-1">ФИО может содержать только русские буквы, пробелы и тире</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Роль</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50">
                      <option value="student">Студент</option>
                      <option value="teacher">Преподаватель</option>
                      <option value="deanery">Сотрудник деканата</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Статус</label>
                    <select value={String(form.isBlocked)} onChange={(e) => setForm({ ...form, isBlocked: e.target.value === 'true' })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50">
                      <option value="false">Активен</option>
                      <option value="true">Заблокирован</option>
                    </select>
                  </div>
                </div>
                {form.role === 'teacher' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Кафедра</label>
                    <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50" placeholder="Например, КИБЭВС" />
                  </div>
                )}
                {form.role === 'student' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Группа</label>
                    <select value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50">
                      <option value="">Выберите группу</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Отмена</button>
                  <button type="submit" disabled={creating} className="px-5 py-2.5 text-sm font-semibold text-white btn-gradient rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25">
                    {creating ? 'Сохранение...' : editingUser ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User logs modal */}
      <AnimatePresence>
        {showLogsFor !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowLogsFor(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Логи пользователя</h3>
                <button onClick={() => setShowLogsFor(null)} className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto p-0">
                {userLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">Нет записей</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="text-left px-5 py-3 font-semibold text-slate-700">Время</th>
                        <th className="text-left px-5 py-3 font-semibold text-slate-700">Действие</th>
                        <th className="text-left px-5 py-3 font-semibold text-slate-700">Данные</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{formatLogDate(log.changed_at)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${actionBadgeColor(log.action)}`}>
                              {actionLabels[log.action] || log.action}
                            </span>
                          </td>
                          <td className="px-5 py-3"><LogDetailButton log={log} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ========================= GROUPS ========================= */
function GroupsTab({ groups, onRefresh, showToast }: { groups: Group[]; onRefresh: () => void; showToast: any }) {
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [form, setForm] = useState({ name: '', admissionYear: new Date().getFullYear() });
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingGroup(null);
    setForm({ name: '', admissionYear: new Date().getFullYear() });
    setShowModal(true);
  };

  const openEdit = (g: Group) => {
    setEditingGroup(g);
    setForm({ name: g.name, admissionYear: g.admissionYear || (g as any).admission_year || new Date().getFullYear() });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Введите название группы', 'error');
      return;
    }
    if (isNaN(form.admissionYear) || form.admissionYear < 1900 || form.admissionYear > 2100) {
      showToast('Введите корректный год поступления (1900–2100)', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingGroup) {
        await api.put(`/admin/groups/${editingGroup.id}`, form);
        showToast('Группа обновлена', 'success');
      } else {
        await api.post('/admin/groups', form);
        showToast('Группа создана', 'success');
      }
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить группу?')) return;
    try {
      await api.delete(`/admin/groups/${id}`);
      showToast('Группа удалена', 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка удаления', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl text-sm font-medium touch-target shadow-lg shadow-primary-500/25">
          <Plus className="w-4 h-4" />
          Новая группа
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Название</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Год поступления</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Курс</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((g, idx) => (
                <tr key={g.id} className={`transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''} hover:bg-primary-50/30`}>
                  <td className="px-5 py-3 font-semibold text-slate-900">{g.name}</td>
                  <td className="px-5 py-3 text-slate-600">{(g as any).admission_year || g.admissionYear}</td>
                  <td className="px-5 py-3 text-slate-600">{g.course}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors" title="Редактировать"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500 transition-colors" title="Удалить"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {groups.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">Группы не найдены</div>}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">{editingGroup ? 'Редактировать группу' : 'Новая группа'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Название</label>
                  <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Год поступления</label>
                  <input required type="number" value={form.admissionYear} onChange={(e) => setForm({ ...form, admissionYear: parseInt(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Отмена</button>
                  <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-white btn-gradient rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25">
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ========================= DISCIPLINES ========================= */
function DisciplinesTab({ disciplines, onRefresh, showToast }: { disciplines: DisciplineItem[]; onRefresh: () => void; showToast: any }) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Введите название дисциплины', 'error');
      return;
    }
    setCreating(true);
    try {
      await api.post('/disciplines', { name });
      showToast('Дисциплина создана', 'success');
      setName('');
      onRefresh();
    } catch {
      showToast('Ошибка создания', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить дисциплину?')) return;
    try {
      await api.delete(`/disciplines/${id}`);
      showToast('Дисциплина удалена', 'success');
      onRefresh();
    } catch {
      showToast('Ошибка удаления', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex gap-3 max-w-xl">
        <input
          type="text"
          placeholder="Название новой дисциплины..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white shadow-sm"
        />
        <button type="submit" disabled={creating} className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl text-sm font-medium touch-target shadow-lg shadow-primary-500/25 disabled:opacity-50">
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Название</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {disciplines.map((d, idx) => (
                <tr key={d.id} className={`transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''} hover:bg-primary-50/30`}>
                  <td className="px-5 py-3 font-semibold text-slate-900">{d.name}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500 transition-colors" title="Удалить"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {disciplines.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">Дисциплины не найдены</div>}
      </div>
    </div>
  );
}

/* ========================= ASSIGNMENTS ========================= */
function AssignmentsTab({ assignments, users, groups, disciplines, onRefresh, showToast }: {
  assignments: AssignmentItem[];
  users: UserItem[];
  groups: Group[];
  disciplines: DisciplineItem[];
  onRefresh: () => void;
  showToast: any;
}) {
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ teacherId: '', groupId: '', disciplineId: '', semester: getCurrentSemester() });

  const teachers = users.filter((u) => u.role === 'teacher');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacherId || !form.groupId || !form.disciplineId) {
      showToast('Заполните все поля', 'error');
      return;
    }
    setCreating(true);
    try {
      await api.post('/assignments', {
        teacherUserId: parseInt(form.teacherId),
        groupId: parseInt(form.groupId),
        disciplineId: parseInt(form.disciplineId),
        semester: form.semester,
      });
      showToast('Назначение создано', 'success');
      setShowModal(false);
      setForm({ teacherId: '', groupId: '', disciplineId: '', semester: '2025-весна' });
      onRefresh();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить назначение и связанные журналы?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      showToast('Назначение удалено', 'success');
      onRefresh();
    } catch {
      showToast('Ошибка удаления', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl text-sm font-medium touch-target shadow-lg shadow-primary-500/25">
          <Plus className="w-4 h-4" />
          Новое назначение
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Преподаватель</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Группа</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Дисциплина</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Семестр</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((a, idx) => (
                <tr key={a.id} className={`transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''} hover:bg-primary-50/30`}>
                  <td className="px-5 py-3 font-semibold text-slate-900">{a.teacher_name}</td>
                  <td className="px-5 py-3 text-slate-600">{a.group_name}</td>
                  <td className="px-5 py-3 text-slate-600">{a.discipline_name}</td>
                  <td className="px-5 py-3 text-slate-600">{a.semester}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500 transition-colors" title="Удалить"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {assignments.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">Назначения не найдены</div>}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Новое назначение</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Преподаватель</label>
                  <select required value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50">
                    <option value="">Выберите...</option>
                    {teachers.map((t) => (<option key={t.id} value={t.id}>{t.full_name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Группа</label>
                  <select required value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50">
                    <option value="">Выберите...</option>
                    {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Дисциплина</label>
                  <select required value={form.disciplineId} onChange={(e) => setForm({ ...form, disciplineId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50">
                    <option value="">Выберите...</option>
                    {disciplines.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Семестр</label>
                  <select required value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50">
                    {getSemesterOptions(3).map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Отмена</button>
                  <button type="submit" disabled={creating} className="px-5 py-2.5 text-sm font-semibold text-white btn-gradient rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25">
                    {creating ? 'Создание...' : 'Создать'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ========================= LOGS ========================= */
function LogsTab({ logs, users, onRefresh }: { logs: AuditLog[]; users: UserItem[]; onRefresh: () => void }) {
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.action));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = logs.filter((log) => {
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesUser = !userFilter || String(log.user_id) === userFilter;
    const matchesStart = !startDate || new Date(log.changed_at) >= new Date(startDate);
    const matchesEnd = !endDate || new Date(log.changed_at) <= new Date(endDate + 'T23:59:59');
    const text = `${log.action} ${log.full_name || ''} ${log.login || ''} ${typeof log.new_value === 'string' ? log.new_value : JSON.stringify(log.new_value)}`.toLowerCase();
    const matchesSearch = !search || text.includes(search.toLowerCase());
    return matchesAction && matchesUser && matchesStart && matchesEnd && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по логам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white shadow-sm"
          />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white shadow-sm">
          <option value="">Все действия</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{actionLabels[a] || a}</option>
          ))}
        </select>
        <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white shadow-sm">
          <option value="">Все пользователи</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white shadow-sm" />
          <span className="text-slate-400">—</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white shadow-sm" />
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Обновить
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-700 w-44">Время</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Описание</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log, idx) => (
                <tr key={log.id} className={`transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''} hover:bg-primary-50/30`}>
                  <td className="px-5 py-3 text-slate-600 whitespace-nowrap align-top">{formatLogDate(log.changed_at)}</td>
                  <td className="px-5 py-3"><LogDetailButton log={log} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">Записи не найдены</div>}
      </div>
    </div>
  );
}
