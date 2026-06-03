import { useEffect, useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Search, GraduationCap, CalendarDays, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { SkeletonCard } from '../components/SkeletonLoader';
import { getCurrentSemester } from '../utils/semester';

interface GroupItem {
  id: number;
  name: string;
  admission_year: number;
  grade_journal_id: number;
  attendance_journal_id: number;
  semester: string;
  debt_count: number;
}

export default function TeacherGroupsPage() {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [disciplineName, setDisciplineName] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  useEffect(() => {
    if (!disciplineId) return;
    api.get(`/teachers/disciplines/${disciplineId}/groups`)
      .then((res) => {
        setGroups(res.data);
        if (res.data.length > 0) {
          setDisciplineName(res.data[0].discipline_name || '');
        }
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
    
    api.get('/disciplines')
      .then((res) => {
        const d = res.data.find((x: any) => x.id === parseInt(disciplineId));
        if (d) setDisciplineName(d.name);
      });
  }, [disciplineId]);

  const semesters = useMemo(() => {
    const set = new Set(groups.map((g) => g.semester));
    return [...set].sort();
  }, [groups]);

  const currentSemester = getCurrentSemester();

  const filtered = useMemo(() => {
    const list = groups.filter((g) => {
      const matchesSearch = !search.trim() || g.name.toLowerCase().includes(search.toLowerCase());
      const matchesSemester = !semesterFilter || g.semester === semesterFilter;
      return matchesSearch && matchesSemester;
    });
    return list.sort((a, b) => {
      const aCurrent = a.semester === currentSemester ? 1 : 0;
      const bCurrent = b.semester === currentSemester ? 1 : 0;
      return bCurrent - aCurrent;
    });
  }, [groups, search, semesterFilter, currentSemester]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/my-disciplines" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Группы</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/my-disciplines"
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold gradient-text">{disciplineName}</h2>
            <p className="text-slate-500 mt-1">Выберите группу для работы с журналом</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск группы..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((group, idx) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 card-hover relative overflow-hidden h-full flex flex-col"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-success-100/50 to-primary-100/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-primary-500 flex items-center justify-center shadow-lg shadow-success-500/25">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-lg ${group.semester === currentSemester ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-400'}`}>
                  {group.semester}
                </span>
                {group.semester !== currentSemester && (
                  <span className="text-[10px] font-medium text-danger-500 bg-danger-50 px-1.5 py-0.5 rounded">Завершено</span>
                )}
                {group.semester !== currentSemester && group.debt_count > 0 && (
                  <span className="text-[10px] font-medium text-white bg-danger-500 px-1.5 py-0.5 rounded" title="Студенты с задолженностями по зачётам/экзаменам">
                    {group.debt_count} должник{group.debt_count === 1 ? '' : group.debt_count < 5 ? 'а' : 'ов'}
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-900">{group.name}</h3>
              <p className="text-sm text-slate-500 mt-0.5">Год поступления: {group.admission_year}</p>
              
              <div className="mt-auto flex items-center gap-3 pt-5">
                <Link
                  to={`/grade-journals/${group.grade_journal_id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 transition-colors text-sm font-medium"
                >
                  <GraduationCap className="w-4 h-4" />
                  Успеваемость
                </Link>
                <Link
                  to={`/attendance-journals/${group.attendance_journal_id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-success-50 text-success-700 rounded-xl hover:bg-success-100 transition-colors text-sm font-medium"
                >
                  <CalendarDays className="w-4 h-4" />
                  Посещаемость
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 text-lg font-medium">Группы не найдены</p>
          <p className="text-slate-400 text-sm mt-1">
            {search ? 'Попробуйте изменить поисковый запрос' : 'Для этой дисциплины пока нет назначенных групп'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
