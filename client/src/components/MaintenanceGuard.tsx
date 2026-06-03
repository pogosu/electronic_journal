import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import MaintenancePage from '../pages/MaintenancePage';

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = () => {
      api.get('/settings/maintenance')
        .then((res) => setMaintenance(res.data.maintenance))
        .catch(() => setMaintenance(false))
        .finally(() => setLoading(false));
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (maintenance && user?.role !== 'admin') {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
