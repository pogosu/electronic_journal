import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, GraduationCap, CalendarCheck } from 'lucide-react';
import api from '../services/api';
import { SkeletonTable } from '../components/SkeletonLoader';

interface DisciplineItem {
  id: number;
  name: string;
  exam_avg_score: number;
  attendance_pct: number;
  grade_journal_id?: number;
  attendance_journal_id?: number;
}

export default function GroupDisciplinesPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;

    async function fetchData() {
      try {
        const [groupsRes, discRes] = await Promise.all([
          api.get(`/dean/groups`),
          api.get(`/dean/groups/${groupId}/disciplines`),
        ]);
        if (cancelled) return;
        const group = groupsRes.data.find((g: any) => g.id === parseInt(groupId!, 10));
        setGroupName(group?.name || `Группа ${groupId}`);
        setDisciplines(discRes.data);
      } catch {
        if (!cancelled) {
          setDisciplines([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [groupId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonTable rows={5} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          title="Назад"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-bold gradient-text">{groupName}</h2>
          <p className="text-slate-500 mt-1">Дисциплины группы</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Дисциплина</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Зачёты/экзамены</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Посещаемость</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Журналы</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {disciplines.map((d, idx) => (
                <tr key={d.id} className={`transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''} hover:bg-primary-50/30`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-sm">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-slate-900">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium">
                      <GraduationCap className="w-3 h-3" />
                      {Number(parseFloat(String(d.exam_avg_score || 0))).toLocaleString('ru-RU', {minimumFractionDigits: 1, maximumFractionDigits: 1})}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      Number(d.attendance_pct) >= 80 ? 'bg-success-50 text-success-700' : Number(d.attendance_pct) >= 60 ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700'
                    }`}>
                      <CalendarCheck className="w-3 h-3" />
                      {Number(parseFloat(String(d.attendance_pct || 0))).toLocaleString('ru-RU', {maximumFractionDigits: 0})}%
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {d.grade_journal_id ? (
                        <button
                          onClick={() => navigate(`/grade-journals/${d.grade_journal_id}`)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          Успеваемость
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                      {d.attendance_journal_id ? (
                        <button
                          onClick={() => navigate(`/attendance-journals/${d.attendance_journal_id}`)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-success-600 hover:text-success-700 transition-colors"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                          Посещаемость
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {disciplines.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">Дисциплины не найдены</div>
        )}
      </div>
    </div>
  );
}
