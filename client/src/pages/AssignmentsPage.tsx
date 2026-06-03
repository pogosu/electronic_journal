import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCog, Plus, X, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { SkeletonTable } from '../components/SkeletonLoader';
import { getSemesterOptions } from '../utils/semester';

interface Assignment {
  id: number;
  teacher_name: string;
  group_name: string;
  discipline_name: string;
  semester: string;
}

interface Teacher {
  id: number;
  full_name: string;
}

interface Group {
  id: number;
  name: string;
}

interface Discipline {
  id: number;
  name: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    teacherId: '',
    groupId: '',
    disciplineId: '',
    semester: '2025-весна',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [aRes, uRes, gRes, dRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/admin/users?role=teacher'),
        api.get('/admin/groups'),
        api.get('/disciplines'),
      ]);
      setAssignments(aRes.data);
      setTeachers(uRes.data.map((u: any) => ({ id: u.id, full_name: u.full_name })));
      setGroups(gRes.data);
      setDisciplines(dRes.data);
    } catch {
      showToast('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
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
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка создания', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить назначение и связанные журналы?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      showToast('Назначение удалено', 'success');
      fetchData();
    } catch {
      showToast('Ошибка удаления', 'error');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Назначения преподавателей</h2>
        <SkeletonTable rows={5} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Назначения преподавателей</h2>
          <p className="text-slate-500 mt-1">Управление закреплением преподавателей за группами и дисциплинами</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl text-sm font-medium touch-target shadow-lg shadow-primary-500/25"
        >
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
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-slate-400 hover:text-danger-600 transition-colors w-8 h-8 rounded-lg hover:bg-danger-50 flex items-center justify-center"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {assignments.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">Назначения не найдены</div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <UserCog className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Новое назначение</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Преподаватель</label>
                  <select
                    required
                    value={form.teacherId}
                    onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50"
                  >
                    <option value="">Выберите преподавателя</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Группа</label>
                  <select
                    required
                    value={form.groupId}
                    onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50"
                  >
                    <option value="">Выберите группу</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Дисциплина</label>
                  <select
                    required
                    value={form.disciplineId}
                    onChange={(e) => setForm({ ...form, disciplineId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50"
                  >
                    <option value="">Выберите дисциплину</option>
                    {disciplines.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Семестр</label>
                  <select
                    required
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50"
                  >
                    {getSemesterOptions().map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 text-sm font-semibold text-white btn-gradient rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25"
                  >
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
