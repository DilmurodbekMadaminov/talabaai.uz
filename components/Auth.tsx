
import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, ChevronLeft } from 'lucide-react';
import { dbService } from '../services/dbService';
import { useLanguage } from '../context/LanguageContext';
import { signInWithGoogleAccount } from '../services/firebase';

interface AuthProps {
  onLogin: (userData: { name: string; email: string; photoURL?: string }) => void;
  onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const googleUser = await signInWithGoogleAccount();
      if (googleUser && googleUser.email) {
        // Send to backend/dbService to register or fetch
        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(googleUser)
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              onLogin({
                name: data.user.name || googleUser.name,
                email: data.user.email || googleUser.email,
                photoURL: data.user.photoURL || googleUser.photoURL
              });
              return;
            }
          }
        } catch (apiErr) {
          console.warn("Backend auth/google sync handled locally:", apiErr);
        }

        onLogin({
          name: googleUser.name,
          email: googleUser.email,
          photoURL: googleUser.photoURL
        });
      }
    } catch (err: any) {
      setError(err.message || "Google orqali kirishda xatolik yuz berdi");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || t('email') + " or " + t('password') + " is incorrect!");
          return;
        }
        
        onLogin({ name: data.user.name, email: data.user.email });
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Ro'yxatdan o'tishda xatolik yuz berdi");
          return;
        }
        
        onLogin({ name: data.user.name, email: data.user.email });
      }
    } catch (err: any) {
      setError("Server bilan ulanishda xatolik yuz berdi: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFF] flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-10 left-10 flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-primary transition-colors cursor-pointer"
      >
        <ChevronLeft size={18} /> Orqaga qaytish
      </button>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-[2rem] shadow-2xl shadow-primary/30 mb-4 rotate-6">
            <GraduationCap size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            {t('appName')} <span className="text-primary italic">Pro</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{isLogin ? 'Hisobingizga kiring' : 'Yangi hisob yarating'}</p>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 text-red-500 text-xs font-bold rounded-2xl animate-shake">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Google One-Click Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 px-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{isGoogleLoading ? 'Google ulanmoqda...' : 'Google orqali kirish'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">yoki email orqali</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('fullName')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-xs"
                    placeholder="Alisher Aliyev"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-xs"
                  placeholder="talaba@edu.uz"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'} required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-xs"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-primary transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer mt-2"
            >
              {isLogin ? t('login') : t('register')}
              <ArrowRight size={18} />
            </button>
          </form>

          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-widest transition-colors cursor-pointer"
          >
            {isLogin ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting" : "Hisobingiz bormi? Kirish"}
          </button>
        </div>
      </div>

      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
    </div>
  );
};
