import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Library, Search, ChevronRight, BookOpen, GraduationCap } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonCard } from '../components/SkeletonLoader';

interface Discipline {
  id: number;
  name: string;
}

export default function TeacherDisciplinesPage() {
  const { user } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const pageTitle = user?.role === 'teacher' ? 'Мои дисциплины' : 'Дисциплины';

  useEffect(() => {
    api.get('/teachers/disciplines')
      .then((res) => setDisciplines(res.data))
      .catch(() => setDisciplines([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return disciplines;
    return disciplines.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
  }, [disciplines, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">{pageTitle}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text">{pageTitle}</h2>
          <p className="text-slate-500 mt-1">Выберите дисциплину, чтобы открыть журналы групп</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск дисциплины..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm w-full md:w-64 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((discipline, idx) => (
          <motion.div
            key={discipline.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className="h-full"
          >
            <Link
              to={`/my-disciplines/${discipline.id}/groups`}
              className="group block h-full flex flex-col bg-white rounded-2xl border border-slate-200 p-6 card-hover relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-100/60 to-accent-100/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110" />
              
              <div className="relative z-10 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                    <Library className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-primary-700 transition-colors">
                  {discipline.name}
                </h3>
                
                <div className="mt-4 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium">
                    <BookOpen className="w-3 h-3" />
                    Журналы
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-50 text-accent-700 text-xs font-medium">
                    <GraduationCap className="w-3 h-3" />
                    Группы
                  </span>
                </div>
              </div>
            </Link>
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
            <Library className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 text-lg font-medium">Дисциплины не найдены</p>
          <p className="text-slate-400 text-sm mt-1">
            {search ? 'Попробуйте изменить поисковый запрос' : 'Обратитесь к администратору для назначения'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
