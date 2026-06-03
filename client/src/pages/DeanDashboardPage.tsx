import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, BookOpen, GraduationCap, CalendarCheck, AlertTriangle, Search, ArrowRight, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { SkeletonTable } from '../components/SkeletonLoader';
import { useNavigate } from 'react-router-dom';

interface GroupSummary {
  id: number;
  name: string;
  admission_year: number;
  course: number;
  student_count: number;
  debtor_count: number;
  attendance_pct: number;
}

interface DisciplineSummary {
  discipline_id: number;
  discipline_name: string;
  group_count: number;
  student_count: number;
  exam_avg_score: number;
  attendance_pct: number;
}

const PAGE_SIZE = 5;

export default function DeanDashboardPage() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [disciplines, setDisciplines] = useState<DisciplineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupSearch, setGroupSearch] = useState('');
  const [disciplineSearch, setDisciplineSearch] = useState('');
  const [groupLimit, setGroupLimit] = useState(PAGE_SIZE);
  const [disciplineLimit, setDisciplineLimit] = useState(PAGE_SIZE);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [gRes, dRes] = await Promise.all([
          api.get('/dean/summary/groups'),
          api.get('/dean/summary/disciplines'),
        ]);
        setGroups(gRes.data);
        setDisciplines(dRes.data);
      } catch {
        showToast('Ошибка загрузки сводок', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [showToast]);

  const filteredGroups = useMemo(() => {
    if (!groupSearch) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(groupSearch.toLowerCase()));
  }, [groups, groupSearch]);

  const filteredDisciplines = useMemo(() => {
    if (!disciplineSearch) return disciplines;
    return disciplines.filter((d) => d.discipline_name.toLowerCase().includes(disciplineSearch.toLowerCase()));
  }, [disciplines, disciplineSearch]);

  const visibleGroups = filteredGroups.slice(0, groupLimit);
  const visibleDisciplines = filteredDisciplines.slice(0, disciplineLimit);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonTable rows={6} cols={5} />
      </div>
    );
  }

  const totalStudents = groups.reduce((sum, g) => sum + Number(g.student_count || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold gradient-text">Сводки деканата</h2>
        <p className="text-slate-500 mt-1">Общая статистика по группам и дисциплинам</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="metric-card border-t-4 border-primary-500 p-5 h-full">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center"><Users className="w-5 h-5 text-primary-600" /></div>
            <span className="text-xs font-medium text-slate-400">Группы</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{groups.length}</p>
          <p className="text-xs text-slate-500 mt-1">Активные группы</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="metric-card border-t-4 border-success-500 p-5 h-full">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-success-600" /></div>
            <span className="text-xs font-medium text-slate-400">Студенты</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalStudents}</p>
          <p className="text-xs text-slate-500 mt-1">Всего зачислено</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="metric-card border-t-4 border-accent-500 p-5 h-full">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center"><BookOpen className="w-5 h-5 text-accent-600" /></div>
            <span className="text-xs font-medium text-slate-400">Дисциплины</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{disciplines.length}</p>
          <p className="text-xs text-slate-500 mt-1">Всего в программе</p>
        </motion.div>
      </div>

      {/* Groups table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-slate-900">Сводка по группам</h3>
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск группы..."
              value={groupSearch}
              onChange={(e) => { setGroupSearch(e.target.value); setGroupLimit(PAGE_SIZE); }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Группа</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Курс</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Студентов</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Должников</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Посещаемость</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleGroups.map((g, idx) => (
                <tr key={g.id} className={`transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''} hover:bg-primary-50/30`}>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => navigate(`/groups/${g.id}/disciplines`)}
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-900 hover:text-primary-600 transition-colors"
                    >
                      {g.name}
                      <ArrowRight className="w-3.5 h-3.5 text-primary-500" />
                    </button>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{g.course}</td>
                  <td className="px-5 py-3 text-slate-600">{Number(g.student_count).toLocaleString('ru-RU')}</td>
                  <td className="px-5 py-3 text-slate-600">{Number(g.debtor_count || 0).toLocaleString('ru-RU')}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      Number(g.attendance_pct) >= 80 ? 'bg-success-50 text-success-700' : Number(g.attendance_pct) >= 60 ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700'
                    }`}>
                      {Number(g.attendance_pct) >= 80 ? <CalendarCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {Number(parseFloat(String(g.attendance_pct || 0))).toLocaleString('ru-RU', {maximumFractionDigits: 0})}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredGroups.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">Группы не найдены</div>}
        {filteredGroups.length > 0 && visibleGroups.length < filteredGroups.length && (
          <div className="px-6 py-3 border-t border-slate-100">
            <button
              onClick={() => setGroupLimit((prev) => prev + PAGE_SIZE)}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
              Показать ещё ({filteredGroups.length - visibleGroups.length})
            </button>
          </div>
        )}
      </div>

      {/* Disciplines table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-slate-900">Сводка по дисциплинам</h3>
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск дисциплины..."
              value={disciplineSearch}
              onChange={(e) => { setDisciplineSearch(e.target.value); setDisciplineLimit(PAGE_SIZE); }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Дисциплина</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Групп</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Студентов</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Зачёты/экзамены</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Посещаемость</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleDisciplines.map((d, idx) => (
                <tr key={d.discipline_id} className={`transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''} hover:bg-primary-50/30`}>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => navigate(`/my-disciplines/${d.discipline_id}/groups`)}
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-900 hover:text-primary-600 transition-colors"
                    >
                      {d.discipline_name}
                      <ArrowRight className="w-3.5 h-3.5 text-primary-500" />
                    </button>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{Number(d.group_count || 0).toLocaleString('ru-RU')}</td>
                  <td className="px-5 py-3 text-slate-600">{Number(d.student_count || 0).toLocaleString('ru-RU')}</td>
                  <td className="px-5 py-3 text-slate-600">{Number(parseFloat(String(d.exam_avg_score || 0))).toLocaleString('ru-RU', {minimumFractionDigits: 1, maximumFractionDigits: 1})}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      Number(d.attendance_pct) >= 80 ? 'bg-success-50 text-success-700' : Number(d.attendance_pct) >= 60 ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700'
                    }`}>
                      {Number(d.attendance_pct) >= 80 ? <CalendarCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {Number(parseFloat(String(d.attendance_pct || 0))).toLocaleString('ru-RU', {maximumFractionDigits: 0})}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredDisciplines.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">Дисциплины не найдены</div>}
        {filteredDisciplines.length > 0 && visibleDisciplines.length < filteredDisciplines.length && (
          <div className="px-6 py-3 border-t border-slate-100">
            <button
              onClick={() => setDisciplineLimit((prev) => prev + PAGE_SIZE)}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
              Показать ещё ({filteredDisciplines.length - visibleDisciplines.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
