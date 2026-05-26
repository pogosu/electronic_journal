import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, XCircle, Clock, GraduationCap } from 'lucide-react';
import api from '../services/api';
import { SkeletonTable } from '../components/SkeletonLoader';

interface AttendanceItem {
  id: number;
  lesson_date: string;
  lesson_type_name: string;
  lesson_type_slug: string;
  discipline_name: string;
  status: 'present' | 'absent' | 'excused';
}

interface DisciplineAttendance {
  discipline: string;
  total: number;
  present: number;
  excused: number;
  absent: number;
  percent: number;
}

const statusMap: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; dot: string }> = {
  present: { label: 'Присутствовал', icon: CheckCircle2, color: 'text-success-700', bg: 'bg-success-100', dot: 'bg-success-500' },
  absent: { label: 'Отсутствовал', icon: XCircle, color: 'text-danger-700', bg: 'bg-danger-100', dot: 'bg-danger-500' },
  excused: { label: 'Уважительная причина отсутствия', icon: Clock, color: 'text-primary-700', bg: 'bg-primary-100', dot: 'bg-primary-500' },
};

export default function StudentAttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    api.get('/students/attendance')
      .then((res) => setAttendances(res.data))
      .catch(() => setAttendances([]))
      .finally(() => setLoading(false));
  }, []);

  const { overall, byDiscipline } = useMemo(() => {
    const total = attendances.length;
    const present = attendances.filter((a) => a.status === 'present' || a.status === 'excused').length;
    const overallPercent = total > 0 ? (present / total) * 100 : 100;

    const discMap: Record<string, DisciplineAttendance> = {};
    for (const a of attendances) {
      if (!discMap[a.discipline_name]) {
        discMap[a.discipline_name] = {
          discipline: a.discipline_name,
          total: 0,
          present: 0,
          excused: 0,
          absent: 0,
          percent: 0,
        };
      }
      discMap[a.discipline_name].total++;
      if (a.status === 'present') discMap[a.discipline_name].present++;
      else if (a.status === 'excused') discMap[a.discipline_name].excused++;
      else if (a.status === 'absent') discMap[a.discipline_name].absent++;
    }

    for (const d of Object.values(discMap)) {
      d.percent = d.total > 0 ? ((d.present + d.excused) / d.total) * 100 : 100;
    }

    return { overall: { total, present, percent: overallPercent }, byDiscipline: Object.values(discMap) };
  }, [attendances]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Моя посещаемость</h2>
        <SkeletonTable rows={6} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold gradient-text">Моя посещаемость</h2>
        <p className="text-slate-500 mt-1">Общая статистика и посещаемость по дисциплинам</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="metric-card border-t-4 border-primary-500 p-6 flex items-center gap-5 max-w-md"
      >
        <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center shadow-lg shadow-primary-500/10">
          <Calendar className="w-7 h-7 text-primary-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Общая посещаемость</p>
          <p className="text-3xl font-extrabold text-slate-900">{overall.percent.toLocaleString('ru-RU', {minimumFractionDigits: 1, maximumFractionDigits: 1})}%</p>
          <p className="text-xs text-slate-400 mt-0.5">{overall.present} из {overall.total} занятий</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {byDiscipline.map((d, idx) => (
          <motion.div
            key={d.discipline}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm card-hover h-full flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success-500 to-primary-500 flex items-center justify-center shadow-md shadow-success-500/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{d.discipline}</h3>
                <p className="text-xs text-slate-500">{d.total} занятий</p>
              </div>
            </div>

            <div className="flex items-end gap-2 mb-4">
              <span className={`text-2xl font-bold ${d.percent >= 80 ? 'text-success-600' : d.percent >= 60 ? 'text-warning-600' : 'text-danger-600'}`}>
                {d.percent.toLocaleString('ru-RU', {minimumFractionDigits: 1, maximumFractionDigits: 1})}%
              </span>
              <span className="text-xs text-slate-400 mb-1">посещаемость</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 rounded-xl bg-success-100">
                <p className="text-sm text-success-700 font-bold">{d.present}</p>
                <p className="text-[10px] text-success-600 font-medium uppercase tracking-wide">Присутствовал</p>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-primary-100">
                <p className="text-sm text-primary-700 font-bold">{d.excused}</p>
                <p className="text-[10px] text-primary-600 font-medium uppercase tracking-wide">Уважит.</p>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-danger-100">
                <p className="text-sm text-danger-700 font-bold">{d.absent}</p>
                <p className="text-[10px] text-danger-600 font-medium uppercase tracking-wide">Отсутствовал</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Дата</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Дисциплина</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Тип</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendances.slice(0, visibleCount).map((a, idx) => {
                const s = statusMap[a.status] || statusMap.present;
                return (
                  <tr key={a.id} className={`transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''} hover:bg-primary-50/30`}>
                    <td className="px-5 py-3 text-slate-900 font-medium">
                      {a.lesson_date ? new Date(a.lesson_date).toLocaleDateString('ru-RU') : '-'}
                    </td>
                    <td className="px-5 py-3 text-slate-900">{a.discipline_name}</td>
                    <td className="px-5 py-3 text-slate-600">{a.lesson_type_name}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${s.bg} ${s.color}`}>
                        <span className={`badge-dot ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {attendances.length > visibleCount && (
          <div className="flex justify-center p-4 border-t border-slate-100">
            <button
              onClick={() => setVisibleCount((c) => c + 5)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Показать ещё ({attendances.length - visibleCount})
            </button>
          </div>
        )}
        {attendances.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">Записи не найдены</div>
        )}
      </div>
    </div>
  );
}
