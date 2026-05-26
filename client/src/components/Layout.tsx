import { useMemo, useState } from 'react';

function formatName(fullName?: string) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return fullName;
  const surname = parts[0];
  const initials = parts.slice(1).map((p) => p[0]?.toUpperCase() + '.').join('');
  return `${surname} ${initials}`;
}
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  LogOut,
  Menu,
  X,
  Sparkles,
  Shield,
  TrendingUp,
  CalendarCheck,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

const navIconMap: Record<string, React.ElementType> = {
  'Админ-панель': Shield,
  'Дисциплины': BookOpen,
  'Мои дисциплины': BookOpen,
  'Мои оценки': TrendingUp,
  'Моя посещаемость': CalendarCheck,
  'Сводки': BarChart3,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Выход выполнен', 'success');
      navigate('/login');
    } catch {
      showToast('Ошибка при выходе', 'error');
    }
  };

  const navItems = useMemo(() => {
    if (!user) return [];
    const items = [];
    if (user.role === 'admin') {
      items.push(
        { label: 'Админ-панель', path: '/admin' },
        { label: 'Дисциплины', path: '/my-disciplines' }
      );
    } else if (user.role === 'teacher') {
      items.push(
        { label: 'Мои дисциплины', path: '/my-disciplines' }
      );
    } else if (user.role === 'student') {
      items.push(
        { label: 'Мои оценки', path: '/grades' },
        { label: 'Моя посещаемость', path: '/attendance' }
      );
    } else if (user.role === 'deanery') {
      items.push(
        { label: 'Сводки', path: '/dean/dashboard' },
        { label: 'Дисциплины', path: '/my-disciplines' }
      );
    }
    return items;
  }, [user]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const homePath = useMemo(() => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'deanery') return '/dean/dashboard';
    if (user.role === 'teacher') return '/my-disciplines';
    if (user.role === 'student') return '/grades';
    return '/';
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to={homePath} className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-lg btn-gradient flex items-center justify-center shadow-lg shadow-primary-500/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-base text-slate-900 leading-tight tracking-tight">Электронный журнал</h1>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = navIconMap[item.label] || BookOpen;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-primary-500' : 'text-slate-400'}`} />
                  {item.label}
                  {active && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100/80">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-slate-600 font-medium">
                {user?.role === 'teacher' ? 'Преподаватель' : user?.role === 'student' ? 'Студент' : user?.role === 'admin' ? 'Администратор' : 'Сотрудник деканата'}
              </span>
            </div>
            <span className="hidden md:block text-sm font-semibold text-slate-900 truncate max-w-[140px]">{formatName(user?.fullName)}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/30 overflow-hidden bg-white/80 backdrop-blur-xl"
            >
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = navIconMap[item.label] || BookOpen;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-primary-500' : 'text-slate-400'}`} />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <p className="px-3 text-xs text-slate-400">{formatName(user?.fullName)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative">
        {/* Decorative background blobs - subtle and performant */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-100/40 rounded-full pointer-events-none" style={{ filter: 'blur(80px)', transform: 'translate(20%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent-100/30 rounded-full pointer-events-none" style={{ filter: 'blur(60px)', transform: 'translate(-20%, 30%)' }} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-4 md:p-8 max-w-7xl mx-auto relative z-10"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
