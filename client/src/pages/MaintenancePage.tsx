import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-warning-50 flex items-center justify-center mx-auto">
          <Wrench className="w-10 h-10 text-warning-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Техническое обслуживание</h1>
        <p className="text-slate-500 text-lg">
          Система временно недоступна. Мы проводим плановые работы по обновлению функционала.
        </p>
        <p className="text-slate-400 text-sm">
          Пожалуйста, зайдите позже. Приносим извинения за неудобства.
        </p>
      </div>
    </div>
  );
}
