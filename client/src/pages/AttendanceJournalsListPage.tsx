import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronRight, BookOpen } from 'lucide-react';
import api from '../services/api';
import { SkeletonTable } from '../components/SkeletonLoader';

interface Journal {
  id: number;
  discipline_name: string;
  group_name: string;
  semester: string;
  teacher_name: string;
}

export default function AttendanceJournalsListPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/journals?type=attendance')
      .then((res) => setJournals(res.data))
      .catch(() => setJournals([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Журналы посещаемости</h2>
        <SkeletonTable rows={5} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold gradient-text">Журналы посещаемости</h2>
        <p className="text-slate-500 mt-1">Все журналы посещаемости</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {journals.map((journal, idx) => (
          <motion.div
            key={journal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="h-full"
          >
            <Link
              to={`/attendance-journals/${journal.id}`}
              className="group block h-full flex flex-col bg-white rounded-2xl border border-slate-200 p-6 card-hover relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-success-100/60 to-primary-100/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110" />
              
              <div className="relative z-10 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-primary-500 flex items-center justify-center shadow-lg shadow-success-500/25">
                    <CalendarDays className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-success-50 transition-colors">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-success-600 transition-colors" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-success-700 transition-colors">
                  {journal.discipline_name}
                </h3>
                <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {journal.group_name}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{journal.semester}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{journal.teacher_name}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {journals.length === 0 && (
        <div className="text-center py-12 text-slate-500">Журналы посещаемости не найдены</div>
      )}
    </div>
  );
}
