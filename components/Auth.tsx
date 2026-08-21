
import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, ChevronLeft } from 'lucide-react';
import { dbService } from '../services/dbService';
import { useLanguage } from '../context/LanguageContext';

interface AuthProps {
  onLogin: (userData: { name: string; email: string }) => void;
  onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

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
        className="absolute top-10 left-10 flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-primary transition-colors"
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

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 text-red-500 text-xs font-bold rounded-2xl animate-shake">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('fullName')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold"
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
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold"
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
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] hover:bg-primary transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer"
            >
              {isLogin ? t('login') : t('register')}
              <ArrowRight size={20} />
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
