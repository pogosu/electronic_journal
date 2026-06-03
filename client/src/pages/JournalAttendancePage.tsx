import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  CalendarDays,
  Plus,
  X,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { SkeletonTable } from '../components/SkeletonLoader';
import type { Lesson } from '../types';

interface JournalData {
  journal: {
    id: number;
    discipline_name: string;
    group_name: string;
    semester: string;
  };
  lessons: Lesson[];
  table: {
    studentId: number;
    fullName: string;
    attendances: {
      lessonId: number;
      lessonDate: string;
      lessonTypeId: number;
      lessonTypeName: string;
      lessonTypeSlug: string;
      status: string | null;
    }[];
  }[];
}

interface LessonType {
  id: number;
  name: string;
  slug: string;
}

const statusOptions = [
  { value: 'present', label: 'П', color: 'bg-success-50 text-success-700 border-success-200', fullLabel: 'Присутствовал' },
  { value: 'absent', label: 'Н', color: 'bg-danger-50 text-danger-700 border-danger-200', fullLabel: 'Отсутствовал' },
  { value: 'excused', label: 'У', color: 'bg-primary-50 text-primary-700 border-primary-200', fullLabel: 'Уважительная причина отсутствия' },
];

function getStatusColor(status: string | null) {
  if (!status) return 'bg-white/80 text-slate-400';
  return statusOptions.find((s) => s.value === status)?.color || 'bg-white/80 text-slate-400';
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export default function JournalAttendancePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<JournalData | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSuccessRef = useRef(0);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [reordering, setReordering] = useState(false);
  const [orderedLessonIds, setOrderedLessonIds] = useState<number[]>([]);

  const [newLesson, setNewLesson] = useState({
    lessonDate: getTodayDate(),
    lessonTypeId: '',
  });

  const canEdit = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'deanery';
  const canManageLessons = user?.role === 'teacher' || user?.role === 'admin';

  const fetchData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/journals/${id}/attendance-table`),
      api.get('/lesson-types'),
    ])
      .then(([tableRes, typesRes]) => {
        setData(tableRes.data);
        setLessonTypes(typesRes.data);
        setOrderedLessonIds(tableRes.data.lessons.map((l: Lesson) => l.id));
      })
      .catch(() => showToast('Ошибка загрузки журнала', 'error'))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveAttendance = useCallback(
    async (studentId: number, lessonId: number, status: string) => {
      const prevStatus = data?.table
        .find((r) => r.studentId === studentId)
        ?.attendances.find((a) => a.lessonId === lessonId)?.status ?? null;

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          table: prev.table.map((row) =>
            row.studentId === studentId
              ? {
                  ...row,
                  attendances: row.attendances.map((a) =>
                    a.lessonId === lessonId ? { ...a, status } : a
                  ),
                }
              : row
          ),
        };
      });

      try {
        await api.post('/attendance', { studentId, lessonId, status });
        lastSuccessRef.current++;
        const current = lastSuccessRef.current;
        setTimeout(() => {
          if (lastSuccessRef.current === current) {
            showToast('Изменения сохранены', 'success');
          }
        }, 1200);
      } catch (err: any) {
        showToast(err.response?.data?.error || 'Ошибка сохранения', 'error');
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            table: prev.table.map((row) =>
              row.studentId === studentId
                ? {
                    ...row,
                    attendances: row.attendances.map((a) =>
                      a.lessonId === lessonId ? { ...a, status: prevStatus } : a
                    ),
                  }
                : row
            ),
          };
        });
      }
    },
    [showToast, data]
  );

  async function handleAddLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!newLesson.lessonDate) {
      showToast('Выберите дату занятия', 'error');
      return;
    }
    if (!newLesson.lessonTypeId) {
      showToast('Выберите тип занятия', 'error');
      return;
    }
    try {
      await api.post(`/journals/${id}/lessons`, {
        lessonDate: newLesson.lessonDate,
        lessonTypeId: parseInt(newLesson.lessonTypeId),
        displayOrder: data?.lessons.length || 0,
      });
      showToast('Занятие добавлено', 'success');
      setShowAddLesson(false);
      setNewLesson({ lessonDate: getTodayDate(), lessonTypeId: '' });
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка', 'error');
    }
  }

  async function handleReorderLesson(lessonId: number, direction: 'left' | 'right') {
    if (!data) return;
    const currentIdx = orderedLessonIds.indexOf(lessonId);
    if (currentIdx === -1) return;
    const newIdx = direction === 'left' ? currentIdx - 1 : currentIdx + 1;
    if (newIdx < 0 || newIdx >= orderedLessonIds.length) return;

    const newOrder = [...orderedLessonIds];
    [newOrder[currentIdx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[currentIdx]];
    setOrderedLessonIds(newOrder);

    try {
      await api.post(`/lessons/journal/${id}/reorder`, { lessonIds: newOrder });
      showToast('Порядок обновлён', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка', 'error');
    }
  }

  async function handleDeleteLesson(lessonId: number) {
    if (!confirm('Удалить занятие?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      showToast('Занятие удалено', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка удаления', 'error');
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <SkeletonTable rows={10} cols={8} />
      </div>
    );
  }

  const { journal, lessons, table } = data;
  const sortedLessons = reordering
    ? orderedLessonIds.map((lid) => lessons.find((l) => l.id === lid)!).filter(Boolean)
    : lessons;

  const columnWidth = 150;
  const nameColumnWidth = 260;
  const tableWidth = nameColumnWidth + sortedLessons.length * columnWidth;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = table[index];
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center' }} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
        <div className="flex-shrink-0 px-4 py-3 font-semibold text-slate-900 text-sm border-r border-slate-200 bg-white sticky left-0 z-10 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)] self-stretch flex items-center" style={{ width: nameColumnWidth }}>
          {row.fullName}
        </div>
        {sortedLessons.map((l) => {
          const a = row.attendances.find((att) => att.lessonId === l.id);
          if (!a) return null;
          const colorClass = getStatusColor(a.status);
          return (
            <div key={a.lessonId} className={`flex-shrink-0 px-2 py-2 border-r border-slate-100 ${colorClass}`} style={{ width: columnWidth }}>
              {canEdit ? (
                <div className="relative flex justify-center">
                  <select
                    value={a.status ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) handleSaveAttendance(row.studentId, a.lessonId, val);
                    }}
                    className={`w-full px-2 py-1.5 text-center text-sm rounded-lg border border-transparent hover:border-slate-300 focus:border-success-500 focus:ring-2 focus:ring-success-500/20 outline-none bg-transparent touch-target cursor-pointer transition-all ${colorClass}`}
                  >
                    <option value="">-</option>
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                </div>
              ) : (
                <div className={`text-center text-sm font-semibold py-1.5 rounded-md border ${colorClass}`}>
                  {statusOptions.find((s) => s.value === a.status)?.label ?? '-'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            title="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-primary-500 flex items-center justify-center shadow-lg shadow-success-500/25">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{journal.discipline_name}</h2>
            <p className="text-sm text-slate-500">{journal.group_name} • {journal.semester} • Журнал посещаемости</p>
          </div>
        </div>
        {canManageLessons && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReordering(!reordering)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all touch-target ${
                reordering ? 'bg-success-100 text-success-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <GripVertical className="w-4 h-4" />
              {reordering ? 'Готово' : 'Изменить порядок'}
            </button>
            <button
              onClick={() => setShowAddLesson(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-success-500 to-primary-500 text-white rounded-xl text-sm font-medium touch-target shadow-lg shadow-success-500/25 hover:shadow-xl hover:shadow-success-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Добавить занятие
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {statusOptions.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2 text-sm">
            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold border ${opt.color}`}>{opt.label}</span>
            <span className="text-slate-600">{opt.fullLabel}</span>
          </div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
          <div style={{ minWidth: tableWidth }}>
            <div className="flex border-b border-slate-200 bg-slate-100 sticky top-0 z-20">
              <div className="flex-shrink-0 px-4 py-3 font-bold text-slate-700 text-sm border-r border-slate-200 sticky left-0 bg-slate-100 z-30 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)] self-stretch flex items-center" style={{ width: nameColumnWidth }}>
                ФИО студента
              </div>
              {sortedLessons.map((l, idx) => (
                <div key={l.id} className="flex-shrink-0 px-2 py-3 text-center text-xs font-bold text-slate-700 border-r border-slate-200 relative group" style={{ width: columnWidth }}>
                  {reordering && canManageLessons && (
                    <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleReorderLesson(l.id, 'left')} disabled={idx === 0} className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30"><ChevronLeft className="w-3 h-3" /></button>
                      <button onClick={() => handleReorderLesson(l.id, 'right')} disabled={idx === sortedLessons.length - 1} className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30"><ChevronRight className="w-3 h-3" /></button>
                      <button onClick={() => handleDeleteLesson(l.id)} className="p-0.5 rounded hover:bg-red-100 text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  )}
                  <div className="truncate px-1">
                    {l.lesson_date ? new Date(l.lesson_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '-'}
                  </div>
                  <div className="text-slate-400 font-normal mt-0.5 flex items-center justify-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-success-400" />
                    {l.lesson_type_name}
                  </div>
                </div>
              ))}
            </div>
            <div>
              {table.map((row, index) => (
                <Row key={row.studentId} index={index} style={{}} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {table.length === 0 && <div className="text-center py-12 text-slate-500">В журнале нет студентов</div>}

      <AnimatePresence>
        {showAddLesson && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowAddLesson(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-success-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Новое занятие</h3>
                </div>
                <button onClick={() => setShowAddLesson(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleAddLesson} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Дата занятия</label>
                  <input required type="date" value={newLesson.lessonDate} onChange={(e) => setNewLesson({ ...newLesson, lessonDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-success-500 focus:border-transparent outline-none text-sm bg-slate-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Тип занятия</label>
                  <select required value={newLesson.lessonTypeId} onChange={(e) => setNewLesson({ ...newLesson, lessonTypeId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-success-500 focus:border-transparent outline-none text-sm bg-slate-50/50">
                    <option value="">Выберите тип...</option>
                    {lessonTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddLesson(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Отмена</button>
                  <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-success-500 to-primary-500 rounded-xl shadow-lg shadow-success-500/25">Добавить занятие</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
