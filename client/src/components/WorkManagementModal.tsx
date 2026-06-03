import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Save, AlertCircle, Settings2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from './Toast';
import type { Work, WorkType, GradeSystem } from '../types';

interface WorkManagementModalProps {
  journalId: number;
  onClose: () => void;
  onUpdate: () => void;
}

export default function WorkManagementModal({ journalId, onClose, onUpdate }: WorkManagementModalProps) {
  const [works, setWorks] = useState<Work[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [gradeSystems, setGradeSystems] = useState<GradeSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState<Partial<Work>>({
    title: '',
    work_type_id: 0,
    grade_system_id: 0,
    min_score: 0,
    max_score: 100,
    is_mandatory: true,
    deadline: null,
    display_order: 0
  });

  useEffect(() => {
    fetchData();
  }, [journalId]);

  async function fetchData() {
    try {
      const [worksRes, dictRes] = await Promise.all([
        api.get(`/works/journal/${journalId}`),
        api.get('/works/dictionaries')
      ]);
      setWorks(worksRes.data);
      setWorkTypes(dictRes.data.workTypes);
      setGradeSystems(dictRes.data.gradeSystems);

      if (dictRes.data.workTypes.length > 0) {
        setForm(f => ({ 
          ...f, 
          work_type_id: dictRes.data.workTypes[0].id,
          grade_system_id: dictRes.data.gradeSystems[0].id
        }));
      }
    } catch {
      showToast('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title?.trim()) {
      showToast('Введите название работы', 'error');
      return;
    }
    if (!form.work_type_id || !form.grade_system_id) {
      showToast('Выберите тип работы и систему оценивания', 'error');
      return;
    }
    if (form.max_score === undefined || isNaN(form.max_score) || form.max_score <= 0) {
      showToast('Максимальный балл должен быть числом больше 0', 'error');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/works/${editingId}`, form);
        showToast('Работа обновлена', 'success');
      } else {
        await api.post(`/works/journal/${journalId}`, form);
        showToast('Работа создана', 'success');
      }
      setEditingId(null);
      setIsCreating(false);
      fetchData();
      onUpdate();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка сохранения', 'error');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Вы уверены? Если у работы есть оценки, она будет скрыта, но данные сохранятся.')) return;
    try {
      await api.delete(`/works/${id}`);
      showToast('Действие выполнено', 'success');
      fetchData();
      onUpdate();
    } catch {
      showToast('Ошибка при удалении', 'error');
    }
  }

  const startEdit = (work: Work) => {
    setForm({
      title: work.title,
      work_type_id: work.work_type_id,
      grade_system_id: work.grade_system_id,
      min_score: work.min_score,
      max_score: work.max_score,
      is_mandatory: work.is_mandatory,
      deadline: work.deadline ? work.deadline.split('T')[0] : null,
      display_order: work.display_order
    });
    setEditingId(work.id);
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Управление работами</h3>
              <p className="text-sm text-gray-500">Настройка контрольных точек и критериев оценки</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Список работ */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Текущие работы</h4>
                {!isCreating && !editingId && (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-all uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" /> Добавить
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-10"><Plus className="animate-spin text-gray-300" /></div>
              ) : works.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">Работ пока нет</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {works.map((work) => (
                    <div
                      key={work.id}
                      className={`p-4 rounded-xl border transition-all ${
                        work.id === editingId ? 'border-primary-500 bg-primary-50/30' : 'border-gray-100 hover:border-gray-200 bg-white'
                      } ${!work.is_active ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase tracking-tight">
                              {work.work_type_name}
                            </span>
                            {!work.is_mandatory && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase">
                                Опционально
                              </span>
                            )}
                            {!work.is_active && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 uppercase">
                                Скрыта
                              </span>
                            )}
                          </div>
                          <h5 className="font-bold text-gray-900">{work.title}</h5>
                          <p className="text-xs text-gray-500 mt-1">
                            {work.grade_system_name} • Max: {work.max_score} • Порядок: {work.display_order}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(work)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(work.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Форма */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                {editingId ? <Edit2 className="w-4 h-4 text-primary-600" /> : <Plus className="w-4 h-4 text-primary-600" />}
                {editingId ? 'Редактировать работу' : 'Новая работа'}
              </h4>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Название</label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white transition-all text-sm"
                    placeholder="Например: Лабораторная №1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Тип работы</label>
                    <select
                      value={form.work_type_id}
                      onChange={(e) => setForm({ ...form, work_type_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                    >
                      {workTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Система оценки</label>
                    <select
                      value={form.grade_system_id}
                      onChange={(e) => setForm({ ...form, grade_system_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                    >
                      {gradeSystems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Макс. балл</label>
                    <input
                      required
                      type="number"
                      min={1}
                      value={form.max_score}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setForm({ ...form, max_score: isNaN(val) ? 0 : val });
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Порядок</label>
                    <input
                      type="number"
                      value={form.display_order}
                      onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Срок сдачи (deadline)</label>
                  <input
                    type="date"
                    value={form.deadline || ''}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value || null })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.is_mandatory}
                      onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">Обязательная</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-6">
                  {(isCreating || editingId) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { setEditingId(null); setIsCreating(false); }}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all uppercase tracking-wider"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" /> Сохранить
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-4 bg-primary-50 rounded-xl text-primary-700 text-xs border border-primary-100 w-full">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Выберите работу для редактирования или нажмите "Добавить"
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
