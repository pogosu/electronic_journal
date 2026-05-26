import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

function WaveSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path
        fill="currentColor"
        fillOpacity="0.15"
        d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password.trim()) {
      showToast('Введите логин и пароль', 'error');
      return;
    }
    setLoading(true);
    try {
      const user = await authLogin(login, password);
      showToast('Вход выполнен успешно', 'success');
      const redirectMap: Record<string, string> = {
        admin: '/admin',
        deanery: '/dean/dashboard',
        teacher: '/my-disciplines',
        student: '/grades',
      };
      navigate(redirectMap[user.role] || '/');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Ошибка входа', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-accent-200/30 rounded-full blur-3xl" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-primary-500/10 border border-white/50 px-8 pt-8 pb-10 overflow-hidden relative">
          <div className="absolute bottom-0 left-0 right-0 text-primary-500 pointer-events-none">
            <WaveSVG className="w-full h-16" />
          </div>
          
          <div className="flex flex-col items-center mb-4 relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 btn-gradient rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30"
            >
              <BookOpen className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900">Электронный журнал</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-sm text-slate-500">Войдите в систему</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Логин</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm bg-white/70"
                placeholder="Введите логин"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm bg-white/70 pr-10"
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-target shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

        </div>
      </motion.div>
    </div>
  );
}
