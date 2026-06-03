import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Clock,
  User,
  Users,
  GraduationCap,
  TrendingUp,
  Activity,
  AlertTriangle,
  CalendarClock,
  Search,
  Filter,
} from 'lucide-react';
import api from '../services/api';
import { SkeletonTable } from '../components/SkeletonLoader';

interface WorkItem {
  workId: number;
  title: string;
  type: string;
  gradeSystem: string;
  maxScore: number;
  isMandatory: boolean;
  deadline: string;
  score: number | null;
  isDebt: boolean;
}

interface DisciplineGrades {
  discipline: string;
  disciplineId: number;
  semester: string;
  works: WorkItem[];
  progressPercent: number;
  totalWorks: number;
  completedWorks: number;
  debtsCount: number;
}

interface StudentStats {
  examAverageScore: string;
  attendancePercent: string;
  totalGrades: number;
  totalAttendances: number;
  debtsCount: number;
  debts: { title: string; score: number; maxScore: number; discipline: string }[];
  perDiscipline: {
    discipline: string;
    progressPercent: string;
    attendancePercent: string;
    gradesCount: number;
    attendanceCount: number;
    debts: { title: string; score: number; maxScore: number }[];
  }[];
}

interface StudentProfile {
  fullName: string;
  groupName: string;
  admissionYear: number;
  course: number;
}

function getDisciplineStats(works: WorkItem[]) {
  const numeric = works.filter((w) => w.gradeSystem !== 'Зачёт/Незачёт' && w.score !== null);
  const passFail = works.filter((w) => w.gradeSystem === 'Зачёт/Незачёт');
  const passed = passFail.filter((w) => w.score === 1).length;

  const numericAvg =
    numeric.length > 0
      ? numeric.reduce((s, w) => s + (w.score || 0), 0) / numeric.length
      : null;

  return { numericAvg, passFailTotal: passFail.length, passed };
}

function getScoreColor(score: number | null, maxScore: number, _isMandatory: boolean, isDebt: boolean, gradeSystem: string) {
  if (score === null) return 'text-slate-400';
  if (gradeSystem === 'Зачёт/Незачёт') {
    return score === 1 ? 'text-success-600 font-bold' : 'text-danger-600 font-bold';
  }
  if (isDebt) return 'text-danger-600 font-bold';
  const pct = score / maxScore;
  if (pct >= 0.9) return 'text-success-600 font-bold';
  if (pct >= 0.7) return 'text-primary-600 font-bold';
  return 'text-warning-600 font-bold';
}

export default function StudentGradesPage() {
  const [loading, setLoading] = useState(true);
  const [disciplineData, setDisciplineData] = useState<DisciplineGrades[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [gradesRes, statsRes, profileRes] = await Promise.all([
          api.get('/students/grades-full'),
          api.get('/students/stats'),
          api.get('/students/profile'),
        ]);
        setDisciplineData(gradesRes.data.disciplines);
        setStats(statsRes.data);
        setProfile(profileRes.data);
      } catch {
        setDisciplineData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const semesters = useMemo(() => {
    const set = new Set(disciplineData.map((d) => d.semester));
    return [...set].sort();
  }, [disciplineData]);

  const filteredDisciplines = useMemo(() => {
    return disciplineData.filter((d) => {
      const matchesSearch = !search.trim() || d.discipline.toLowerCase().includes(search.toLowerCase());
      const matchesSemester = !semesterFilter || d.semester === semesterFilter;
      return matchesSearch && matchesSemester;
    });
  }, [disciplineData, search, semesterFilter]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const allWorks: { title: string; discipline: string; deadline: string; daysLeft: number }[] = [];
    for (const d of filteredDisciplines) {
      for (const w of d.works) {
        if (w.score === null && w.deadline) {
          const dl = new Date(w.deadline);
          const daysLeft = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          allWorks.push({ title: w.title, discipline: d.discipline, deadline: w.deadline, daysLeft });
        }
      }
    }
    return allWorks.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5);
  }, [filteredDisciplines]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Мои оценки</h2>
        <SkeletonTable rows={6} cols={5} />
      </div>
    );
  }

  const totalCompleted = disciplineData.reduce((s, d) => s + d.completedWorks, 0);
  const totalWorks = disciplineData.reduce((s, d) => s + d.totalWorks, 0);
  const totalDebts = disciplineData.reduce((s, d) => s + d.debtsCount, 0);

  return (
    <div className="space-y-8">
      {/* Profile + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25 shrink-0">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{profile?.fullName}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-slate-500">
              <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {profile?.groupName}</span>
              <span className="inline-flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {profile?.course} курс</span>
            </div>
          </div>
        </motion.div>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="metric-card border-t-4 border-primary-500 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5 text-primary-600" />
              </div>
              <span className="text-xs font-medium text-slate-400">Зачётка</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{stats?.examAverageScore ?? '—'}</div>
            <p className="text-xs text-slate-500 mt-1">Средний балл за экзамены</p>
          </div>
          <div className="metric-card border-t-4 border-success-500 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-success-100 flex items-center justify-center">
                <Activity className="w-4.5 h-4.5 text-success-600" />
              </div>
              <span className="text-xs font-medium text-slate-400">Посещаемость</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{stats?.attendancePercent ?? '—'}%</div>
            <p className="text-xs text-slate-500 mt-1">Общая статистика</p>
          </div>
          <div className="metric-card border-t-4 border-accent-500 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-accent-100 flex items-center justify-center">
                <CheckCircle2 className="w-4.5 h-4.5 text-accent-600" />
              </div>
              <span className="text-xs font-medium text-slate-400">Выполнено</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{totalCompleted}/{totalWorks}</div>
            <p className="text-xs text-slate-500 mt-1">Работ сдано</p>
          </div>
          <div className={`metric-card border-t-4 ${totalDebts > 0 ? 'border-danger-500' : 'border-slate-300'} p-5`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${totalDebts > 0 ? 'bg-danger-100' : 'bg-slate-100'}`}>
                <AlertTriangle className={`w-4.5 h-4.5 ${totalDebts > 0 ? 'text-danger-600' : 'text-slate-500'}`} />
              </div>
              <span className="text-xs font-medium text-slate-400">Задолженности</span>
            </div>
            <div className={`text-2xl font-extrabold ${totalDebts > 0 ? 'text-danger-600' : 'text-slate-900'}`}>{totalDebts}</div>
            <p className="text-xs text-slate-500 mt-1">{totalDebts > 0 ? 'Требуется пересдача' : 'Всё в порядке'}</p>
          </div>
        </motion.div>
      </div>

      {/* Charts + Deadlines */}
      {stats && stats.perDiscipline.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              Успеваемость по дисциплинам
            </h3>
            <div className="space-y-4">
              {stats.perDiscipline.map((d) => {
                const progress = parseFloat(d.progressPercent);
                const pct = Math.min(progress, 100);
                let label: string;
                let labelColor: string;
                let barColor: string;
                if (progress >= 90) {
                  label = 'Отлично';
                  labelColor = 'text-success-600';
                  barColor = 'from-success-400 to-success-500';
                } else if (progress >= 70) {
                  label = 'Хорошо';
                  labelColor = 'text-primary-600';
                  barColor = 'from-primary-400 to-primary-500';
                } else if (progress >= 60) {
                  label = 'Удовлетворительно';
                  labelColor = 'text-warning-600';
                  barColor = 'from-warning-400 to-warning-500';
                } else {
                  label = 'Задолженность';
                  labelColor = 'text-danger-600';
                  barColor = 'from-danger-400 to-danger-500';
                }
                return (
                  <div key={d.discipline}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{d.discipline}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`font-bold ${labelColor}`}>{label} ({Number(progress).toLocaleString('ru-RU', {maximumFractionDigits: 0})}%)</span>
                        <span className="text-slate-400">{d.attendancePercent}% посещ.</span>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        key={`${d.discipline}-${pct}`}
                        className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Deadlines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-warning-500" />
              Ближайшие сроки
            </h3>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success-400" />
                Все работы выполнены
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((dl) => (
                  <div key={`${dl.discipline}-${dl.title}`} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dl.daysLeft < 0 ? 'bg-danger-500' : dl.daysLeft <= 3 ? 'bg-warning-500' : 'bg-primary-400'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{dl.title}</p>
                      <p className="text-xs text-slate-500">{dl.discipline}</p>
                      <p className={`text-xs font-medium mt-0.5 ${dl.daysLeft < 0 ? 'text-danger-600' : dl.daysLeft <= 3 ? 'text-warning-600' : 'text-primary-600'}`}>
                        {dl.daysLeft < 0 ? `Просрочено ${Math.abs(dl.daysLeft)} дн.` : dl.daysLeft === 0 ? 'Сегодня' : `Осталось ${dl.daysLeft} дн.`}
                        {' • '}{new Date(dl.deadline).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Discipline Tables */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900">Детализация по дисциплинам</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск дисциплины..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm w-full md:w-56 shadow-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm w-full md:w-48 shadow-sm appearance-none cursor-pointer"
              >
                <option value="">Все семестры</option>
                {semesters.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {filteredDisciplines.slice(0, visibleCount).map((discipline, idx) => {
          const statsLocal = getDisciplineStats(discipline.works);
          return (
            <motion.div
              key={discipline.discipline}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm card-hover"
            >
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md shadow-primary-500/20">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900">{discipline.discipline}</h3>
                    <p className="text-xs text-slate-500 truncate">
                      <span className="font-semibold text-slate-700">
                        Прогресс: {discipline.progressPercent.toLocaleString('ru-RU', {minimumFractionDigits: 1, maximumFractionDigits: 1})}%
                      </span>
                      {statsLocal.passFailTotal > 0 && (
                        <span className="font-semibold text-slate-700">
                          {' • '}Зачтено {statsLocal.passed} из {statsLocal.passFailTotal}
                        </span>
                      )}
                      {' • '}
                      Выполнено: <span className="font-semibold text-slate-700">{discipline.completedWorks}/{discipline.totalWorks}</span>
                      {discipline.debtsCount > 0 && (
                        <span className="text-danger-600 font-semibold ml-2">{discipline.debtsCount} задолженностей</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      discipline.progressPercent >= 90
                        ? 'from-success-400 to-success-500'
                        : discipline.progressPercent >= 70
                        ? 'from-primary-400 to-primary-500'
                        : discipline.progressPercent >= 60
                        ? 'from-warning-400 to-warning-500'
                        : 'from-danger-400 to-danger-500'
                    }`}
                    style={{ width: `${Math.min(discipline.progressPercent, 100)}%` }}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-slate-700">Работа</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-700">Тип</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-700">Макс.</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-700">Оценка</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-700">Срок</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-700">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {discipline.works.map((w, wIdx) => {
                      const isPending = w.score === null;
                      const isDebt = w.isDebt;
                      return (
                        <tr key={w.workId} className={`transition-colors ${wIdx % 2 === 1 ? 'bg-slate-50/40' : ''} hover:bg-primary-50/30`}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              {w.isMandatory && <span title="Обязательная работа"><AlertCircle className="w-3.5 h-3.5 text-danger-400" /></span>}
                              <span className="font-medium text-slate-900">{w.title}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-slate-600">{w.type}</td>
                          <td className="px-5 py-3 text-slate-500">{w.maxScore}</td>
                          <td className={`px-5 py-3 ${getScoreColor(w.score, w.maxScore, w.isMandatory, isDebt, w.gradeSystem)}`}>
                            {w.gradeSystem === 'Зачёт/Незачёт'
                              ? (w.score === 1 ? '+' : w.score === 0 ? '−' : '-')
                              : (w.score !== null ? w.score : '-')}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {w.deadline ? (
                              <span className={`inline-flex items-center gap-1 ${isPending && new Date(w.deadline) < new Date() ? 'text-danger-500' : ''}`}>
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(w.deadline).toLocaleDateString('ru-RU')}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                                <span className="badge-dot bg-slate-400" />
                                Не сдано
                              </span>
                            ) : isDebt ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-danger-100 text-danger-700 text-xs font-medium">
                                <span className="badge-dot bg-danger-500" />
                                Задолженность
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success-100 text-success-700 text-xs font-medium">
                                <span className="badge-dot bg-success-500" />
                                Сдано
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredDisciplines.length > visibleCount && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + 5)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Показать ещё ({filteredDisciplines.length - visibleCount})
          </button>
        </div>
      )}
      {filteredDisciplines.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 text-lg font-medium">Оценок пока нет</p>
          <p className="text-slate-400 text-sm mt-1">Преподаватели ещё не выставили оценки</p>
        </motion.div>
      )}
    </div>
  );
}
