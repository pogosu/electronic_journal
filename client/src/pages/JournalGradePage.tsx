import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  GraduationCap,
  Plus,
  X,
  Settings,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertCircle,
  Calendar,
  ArrowLeft,
  Pencil,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { SkeletonTable } from '../components/SkeletonLoader';
import type { Work } from '../types';

interface JournalData {
  journal: {
    id: number;
    discipline_name: string;
    group_name: string;
    semester: string;
  };
  works: Work[];
  table: {
    studentId: number;
    fullName: string;
    grades: {
      workId: number;
      title: string;
      score: number | null;
      maxScore: number;
      minScore: number;
      gradeSystem: string;
      isMandatory: boolean;
    }[];
  }[];
}

interface DictionaryData {
  workTypes: { id: number; name: string; slug: string }[];
  gradeSystems: { id: number; name: string; description: string }[];
}

export default function JournalGradePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<JournalData | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSuccessRef = useRef(0);
  const [showAddWork, setShowAddWork] = useState(false);
  const [dictionaries, setDictionaries] = useState<DictionaryData | null>(null);
  const [reordering, setReordering] = useState(false);
  const [orderedWorkIds, setOrderedWorkIds] = useState<number[]>([]);

  const [newWork, setNewWork] = useState({
    title: '',
    work_type_id: '',
    grade_system_id: '',
    min_score: 0,
    max_score: 100,
    is_mandatory: true,
    deadline: '',
  });
  const [editingWorkId, setEditingWorkId] = useState<number | null>(null);

  const canEdit = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'deanery';
  const canManageWorks = user?.role === 'teacher' || user?.role === 'admin';

  const selectedGradeSystem = useMemo(() => {
    if (!dictionaries || !newWork.grade_system_id) return null;
    return dictionaries.gradeSystems.find((s) => s.id === parseInt(newWork.grade_system_id));
  }, [dictionaries, newWork.grade_system_id]);

  const showMinMax = useMemo(() => {
    if (!selectedGradeSystem) return true;
    const name = selectedGradeSystem.name;
    if (name === '5-балльная' || name === 'Зачёт/Незачёт') return false;
    return true;
  }, [selectedGradeSystem]);

  const showMax = useMemo(() => {
    if (!selectedGradeSystem) return true;
    const name = selectedGradeSystem.name;
    if (name === '100-балльная') return false;
    return true;
  }, [selectedGradeSystem]);

  useEffect(() => {
    if (!selectedGradeSystem) return;
    const name = selectedGradeSystem.name;
    setNewWork((prev) => ({
      ...prev,
      max_score: name === '100-балльная' ? 100 : name === '5-балльная' ? 5 : name === 'Зачёт/Незачёт' ? 1 : prev.max_score,
      min_score: name === '5-балльная' ? 2 : name === 'Зачёт/Незачёт' ? 0 : prev.min_score,
    }));
  }, [selectedGradeSystem?.id]);

  const fetchData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/journals/${id}/table`),
      api.get('/works/dictionaries'),
    ])
      .then(([tableRes, dictRes]) => {
        setData(tableRes.data);
        setDictionaries(dictRes.data);
        setOrderedWorkIds(tableRes.data.works.map((w: Work) => w.id));
      })
      .catch(() => showToast('Ошибка загрузки журнала', 'error'))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveScore = useCallback(
    async (studentId: number, workId: number, score: number | null) => {
      const prevScore = data?.table
        .find((r) => r.studentId === studentId)
        ?.grades.find((g) => g.workId === workId)?.score ?? null;

      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          table: prev.table.map((row) =>
            row.studentId === studentId
              ? {
                  ...row,
                  grades: row.grades.map((g) =>
                    g.workId === workId ? { ...g, score } : g
                  ),
                }
              : row
          ),
        };
      });

      try {
        await api.post('/grades', { studentId, workId, score });
        lastSuccessRef.current++;
        const current = lastSuccessRef.current;
        setTimeout(() => {
          if (lastSuccessRef.current === current) {
            showToast('Изменения сохранены', 'success');
          }
        }, 1200);
      } catch (err: any) {
        showToast(err.response?.data?.error || 'Ошибка сохранения', 'error');
        // Revert optimistic update
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            table: prev.table.map((row) =>
              row.studentId === studentId
                ? {
                    ...row,
                    grades: row.grades.map((g) =>
                      g.workId === workId ? { ...g, score: prevScore } : g
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

  async function handleAddWork(e: React.FormEvent) {
    e.preventDefault();
    if (!newWork.title.trim()) {
      showToast('Введите название работы', 'error');
      return;
    }
    if (!newWork.work_type_id || !newWork.grade_system_id) {
      showToast('Выберите тип работы и систему оценивания', 'error');
      return;
    }
    if (showMinMax) {
      if (isNaN(newWork.min_score) || isNaN(newWork.max_score)) {
        showToast('Введите корректные числовые значения для баллов', 'error');
        return;
      }
      if (newWork.max_score <= 0) {
        showToast('Максимальный балл должен быть больше 0', 'error');
        return;
      }
      if (newWork.min_score >= newWork.max_score) {
        showToast('Минимальный балл должен быть меньше максимального', 'error');
        return;
      }
      if (newWork.min_score < 0) {
        showToast('Минимальный балл не может быть отрицательным', 'error');
        return;
      }
    }
    try {
      await api.post(`/journals/${id}/works`, {
        title: newWork.title,
        work_type_id: parseInt(newWork.work_type_id),
        grade_system_id: parseInt(newWork.grade_system_id),
        min_score: newWork.min_score,
        max_score: newWork.max_score,
        is_mandatory: newWork.is_mandatory,
        deadline: newWork.deadline || null,
        display_order: data?.works.length || 0,
      });
      showToast('Работа добавлена', 'success');
      setShowAddWork(false);
      setNewWork({
        title: '',
        work_type_id: '',
        grade_system_id: '',
        min_score: 0,
        max_score: 100,
        is_mandatory: true,
        deadline: '',
      });
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка', 'error');
    }
  }

  async function handleReorderWork(workId: number, direction: 'left' | 'right') {
    if (!data) return;
    const currentIdx = orderedWorkIds.indexOf(workId);
    if (currentIdx === -1) return;
    const newIdx = direction === 'left' ? currentIdx - 1 : currentIdx + 1;
    if (newIdx < 0 || newIdx >= orderedWorkIds.length) return;

    const newOrder = [...orderedWorkIds];
    [newOrder[currentIdx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[currentIdx]];
    setOrderedWorkIds(newOrder);

    try {
      await api.post(`/lessons/works/journal/${id}/reorder`, { workIds: newOrder });
      showToast('Порядок обновлён', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка', 'error');
    }
  }

  async function handleDeleteWork(workId: number) {
    if (!confirm('Удалить работу?')) return;
    try {
      await api.delete(`/works/${workId}`);
      showToast('Работа удалена', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка удаления', 'error');
    }
  }

  function handleOpenEdit(work: Work) {
    setEditingWorkId(work.id);
    setNewWork({
      title: work.title,
      work_type_id: String(work.work_type_id || ''),
      grade_system_id: String(work.grade_system_id || ''),
      min_score: work.min_score || 0,
      max_score: work.max_score || 100,
      is_mandatory: work.is_mandatory ?? true,
      deadline: work.deadline ? work.deadline.split('T')[0] : '',
    });
    setShowAddWork(true);
  }

  async function handleUpdateWork(e: React.FormEvent) {
    e.preventDefault();
    if (!editingWorkId) return;
    if (!newWork.title.trim()) {
      showToast('Введите название работы', 'error');
      return;
    }
    if (!newWork.work_type_id || !newWork.grade_system_id) {
      showToast('Выберите тип работы и систему оценивания', 'error');
      return;
    }
    if (showMinMax) {
      if (isNaN(newWork.min_score) || isNaN(newWork.max_score)) {
        showToast('Введите корректные числовые значения для баллов', 'error');
        return;
      }
      if (newWork.max_score <= 0) {
        showToast('Максимальный балл должен быть больше 0', 'error');
        return;
      }
      if (newWork.min_score >= newWork.max_score) {
        showToast('Минимальный балл должен быть меньше максимального', 'error');
        return;
      }
      if (newWork.min_score < 0) {
        showToast('Минимальный балл не может быть отрицательным', 'error');
        return;
      }
    }
    try {
      await api.put(`/works/${editingWorkId}`, {
        title: newWork.title,
        work_type_id: parseInt(newWork.work_type_id),
        grade_system_id: parseInt(newWork.grade_system_id),
        min_score: newWork.min_score,
        max_score: newWork.max_score,
        is_mandatory: newWork.is_mandatory,
        deadline: newWork.deadline || null,
      });
      showToast('Работа обновлена', 'success');
      setShowAddWork(false);
      setEditingWorkId(null);
      setNewWork({
        title: '',
        work_type_id: '',
        grade_system_id: '',
        min_score: 0,
        max_score: 100,
        is_mandatory: true,
        deadline: '',
      });
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка', 'error');
    }
  }

  const getScoreColor = (score: number | null, maxScore: number, minScore: number, isMandatory: boolean, gradeSystem?: string) => {
    if (score === null) return 'bg-white/80 text-slate-400';

    if (gradeSystem === 'Зачёт/Незачёт') {
      if (score === 1) return 'bg-success-100 text-success-700 border-success-300';
      return 'bg-danger-100 text-danger-700 border-danger-300';
    }

    if (gradeSystem === '5-балльная') {
      if (score < 3) return 'bg-danger-100 text-danger-700 border-danger-300';
      if (score === 3) return 'bg-warning-100 text-warning-700 border-warning-300';
      if (score === 4) return 'bg-primary-100 text-primary-700 border-primary-300';
      return 'bg-success-100 text-success-700 border-success-300';
    }

    // Произвольная
    if (isMandatory && score < minScore) return 'bg-danger-100 text-danger-700 border-danger-300';

    const pct = score / maxScore;
    if (pct >= 0.9) return 'bg-success-100 text-success-700 border-success-300';
    if (pct >= 0.7) return 'bg-primary-100 text-primary-700 border-primary-300';
    return 'bg-warning-100 text-warning-700 border-warning-300';
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <SkeletonTable rows={10} cols={8} />
      </div>
    );
  }

  const { journal, works, table } = data;
  const sortedWorks = reordering
    ? orderedWorkIds.map((wid) => works.find((w) => w.id === wid)!).filter(Boolean)
    : works;

  const columnWidth = 150;
  const nameColumnWidth = 260;
  const tableWidth = nameColumnWidth + sortedWorks.length * columnWidth;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = table[index];
    return (
      <div
        style={{ ...style, display: 'flex', alignItems: 'center' }}
        className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
      >
        <div
          className="flex-shrink-0 px-4 py-3 font-semibold text-slate-900 text-sm border-r border-slate-200 bg-white sticky left-0 z-10 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)] self-stretch flex items-center"
          style={{ width: nameColumnWidth }}
        >
          {row.fullName}
        </div>
        {sortedWorks.map((w) => {
          const g = row.grades.find((gr) => gr.workId === w.id);
          if (!g) return null;
          const gradeSystem = w.grade_system_name;
          const cellColor = getScoreColor(g.score, g.maxScore, g.minScore, g.isMandatory, g.gradeSystem);
          const cellCanEdit = canEdit && (user?.role !== 'deanery' || ['credit', 'final_exam'].includes(w.work_type_slug || ''));

          const handleClickPassFail = () => {
            if (!cellCanEdit) return;
            const next = g.score === null ? 1 : g.score === 1 ? 0 : null;
            if (next !== g.score) {
              handleSaveScore(row.studentId, g.workId, next);
            }
          };

          const handleSelectFive = (val: string) => {
            if (!cellCanEdit) return;
            const num = parseInt(val);
            if (!isNaN(num) && num !== g.score) {
              handleSaveScore(row.studentId, g.workId, num);
            }
          };

          return (
            <div
              key={g.workId}
              className={`flex-shrink-0 px-2 py-2 border-r border-slate-100 self-stretch flex items-center ${cellColor}`}
              style={{ width: columnWidth }}
            >
              {cellCanEdit ? (
                <div className="relative flex justify-center items-center w-full">
                  {gradeSystem === 'Зачёт/Незачёт' ? (
                    <button
                      onClick={handleClickPassFail}
                      className={`w-10 h-8 rounded-lg text-lg font-bold flex items-center justify-center transition-colors ${
                        g.score === 1 ? 'bg-success-100 text-success-700' : g.score === 0 ? 'bg-danger-100 text-danger-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {g.score === 1 ? '+' : g.score === 0 ? '−' : '—'}
                    </button>
                  ) : gradeSystem === '5-балльная' ? (
                    <select
                      value={g.score ?? ''}
                      onChange={(e) => handleSelectFive(e.target.value)}
                      className={`w-16 px-1 py-1 text-center text-sm rounded-lg border border-transparent hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none bg-transparent touch-target cursor-pointer transition-all ${cellColor}`}
                    >
                      <option value="">-</option>
                      {[2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      inputMode="decimal"
                      defaultValue={g.score ?? ''}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9.,\-]/g, '');
                        if (cleaned !== e.target.value) {
                          e.target.value = cleaned;
                        }
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value.trim().replace(',', '.');
                        if (raw === '') {
                          if (g.score !== null) {
                            handleSaveScore(row.studentId, g.workId, null);
                          }
                          return;
                        }
                        const val = parseFloat(raw);
                        if (isNaN(val)) {
                          showToast('Введите корректное число', 'error');
                          e.target.value = String(g.score ?? '');
                          return;
                        }
                        if (val < 0) {
                          showToast('Оценка не может быть отрицательной', 'error');
                          e.target.value = String(g.score ?? '');
                          return;
                        }
                        if (val > g.maxScore) {
                          showToast(`Оценка не может превышать максимальный балл (${g.maxScore})`, 'error');
                          e.target.value = String(g.score ?? '');
                          return;
                        }
                        if (val !== g.score) {
                          handleSaveScore(row.studentId, g.workId, val);
                        }
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      className="w-full px-2 py-1.5 text-center text-sm rounded-lg border border-transparent hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none bg-transparent touch-target transition-all"
                    />
                  )}

                </div>
              ) : (
                <div className="w-full text-center text-sm font-semibold py-1.5">
                  {gradeSystem === 'Зачёт/Незачёт'
                    ? (g.score === 1 ? '+' : g.score === 0 ? '−' : '-')
                    : (g.score ?? '-')}
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{journal.discipline_name}</h2>
            <p className="text-sm text-slate-500">{journal.group_name} • {journal.semester} • Журнал успеваемости</p>
          </div>
        </div>
        {canManageWorks && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReordering(!reordering)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all touch-target ${
                reordering ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <GripVertical className="w-4 h-4" />
              {reordering ? 'Готово' : 'Изменить порядок'}
            </button>
            <button
              onClick={() => setShowAddWork(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl text-sm font-medium touch-target shadow-lg shadow-primary-500/25"
            >
              <Plus className="w-4 h-4" />
              Добавить работу
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm"><span className="w-4 h-4 rounded bg-danger-100 border border-danger-300" /><span className="text-slate-700 font-medium">Задолженность</span></div>
        <div className="flex items-center gap-2 text-sm"><span className="w-4 h-4 rounded bg-warning-100 border border-warning-300" /><span className="text-slate-700 font-medium">Удовлетворительно</span></div>
        <div className="flex items-center gap-2 text-sm"><span className="w-4 h-4 rounded bg-primary-100 border border-primary-300" /><span className="text-slate-700 font-medium">Хорошо</span></div>
        <div className="flex items-center gap-2 text-sm"><span className="w-4 h-4 rounded bg-success-100 border border-success-300" /><span className="text-slate-700 font-medium">Отлично</span></div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
          <div style={{ minWidth: tableWidth }}>
            <div className="flex border-b border-slate-200 bg-slate-100 sticky top-0 z-20">
              <div className="flex-shrink-0 px-4 py-3 font-bold text-slate-700 text-sm border-r border-slate-200 sticky left-0 bg-slate-100 z-30 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)] self-stretch flex items-center" style={{ width: nameColumnWidth }}>
                ФИО студента
              </div>
              {sortedWorks.map((w, idx) => (
                <div key={w.id} className="flex-shrink-0 px-2 py-3 text-center text-xs font-bold text-slate-700 border-r border-slate-200 relative group" style={{ width: columnWidth }}>
                  {canEdit && (
                    <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canManageWorks && (
                        <>
                          {!reordering && (
                            <button onClick={() => handleOpenEdit(w)} className="p-0.5 rounded hover:bg-primary-100 text-primary-600" title="Редактировать"><Pencil className="w-3 h-3" /></button>
                          )}
                          {reordering && (
                            <>
                              <button onClick={() => handleReorderWork(w.id, 'left')} disabled={idx === 0} className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30"><ChevronLeft className="w-3 h-3" /></button>
                              <button onClick={() => handleReorderWork(w.id, 'right')} disabled={idx === sortedWorks.length - 1} className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30"><ChevronRight className="w-3 h-3" /></button>
                            </>
                          )}
                          <button onClick={() => handleDeleteWork(w.id)} className="p-0.5 rounded hover:bg-red-100 text-red-500"><Trash2 className="w-3 h-3" /></button>
                        </>
                      )}
                    </div>
                  )}
                  <div className="truncate px-1" title={w.title}>{w.title}</div>
                  <div className="text-slate-400 font-normal mt-0.5 flex items-center justify-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-400" />
                    макс. {w.max_score}
                  </div>
                  <div className="text-slate-400 font-normal mt-0.5 text-[10px]">
                    {w.work_type_name}
                  </div>
                  {w.deadline && (
                    <div className="text-warning-500 font-normal mt-0.5 text-[10px] flex items-center justify-center gap-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(w.deadline).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                  {w.is_mandatory && (
                    <div className="absolute top-1 left-1" title="Обязательная работа">
                      <AlertCircle className="w-3 h-3 text-danger-400" />
                    </div>
                  )}
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
        {showAddWork && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowAddWork(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{editingWorkId ? 'Редактировать работу' : 'Новая работа'}</h3>
                </div>
                <button onClick={() => { setShowAddWork(false); setEditingWorkId(null); }} className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={editingWorkId ? handleUpdateWork : handleAddWork} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Название работы</label>
                  <input required type="text" value={newWork.title} onChange={(e) => setNewWork({ ...newWork, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50" placeholder="Например, Лабораторная работа №1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Тип работы</label>
                    <select required value={newWork.work_type_id} onChange={(e) => setNewWork({ ...newWork, work_type_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50">
                      <option value="">Выберите...</option>
                      {dictionaries?.workTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Система оценивания</label>
                    <select required value={newWork.grade_system_id} onChange={(e) => setNewWork({ ...newWork, grade_system_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50">
                      <option value="">Выберите...</option>
                      {dictionaries?.gradeSystems.filter((s) => s.name !== '100-балльная').map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {showMinMax && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Мин. балл</label>
                      <input type="number" min={0} value={newWork.min_score} onChange={(e) => setNewWork({ ...newWork, min_score: parseFloat(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50" />
                    </div>
                    {showMax && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Макс. балл</label>
                        <input type="number" min={1} value={newWork.max_score} onChange={(e) => setNewWork({ ...newWork, max_score: parseFloat(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50" />
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Срок сдачи</label>
                    <input type="date" value={newWork.deadline} onChange={(e) => setNewWork({ ...newWork, deadline: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-slate-50/50" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2.5 cursor-pointer pb-2">
                      <input type="checkbox" checked={newWork.is_mandatory} onChange={(e) => setNewWork({ ...newWork, is_mandatory: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                      <span className="text-sm font-medium text-slate-700">Обязательная работа</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAddWork(false); setEditingWorkId(null); }} className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Отмена</button>
                  <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white btn-gradient rounded-xl shadow-lg shadow-primary-500/25">{editingWorkId ? 'Сохранить' : 'Добавить работу'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
