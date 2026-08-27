import React, { useState } from 'react';
import { 
  GraduationCap, Mail, Lock, User, ArrowRight, Eye, EyeOff, 
  AlertCircle, ChevronLeft, Fingerprint, Sparkles, Loader2,
  CheckCircle2, ShieldCheck, Github
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { useLanguage } from '../context/LanguageContext';
import { signInWithGoogleAccount, signInWithGithubAccount } from '../services/firebase';
import { authenticateWithBiometrics } from '../services/webAuthnService';

interface AuthProps {
  onLogin: (userData: { name: string; email: string; photoURL?: string; isAdmin?: boolean }) => void;
  onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | 'biometric' | 'email' | 'guest' | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // Standard Email & Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);
    setLoadingProvider('email');

    try {
      if (isLogin) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email.trim().toLowerCase(), password: formData.password })
        });
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || t('email') + " yoki " + t('password') + " noto'g'ri!");
          setLoading(false);
          setLoadingProvider(null);
          return;
        }
        
        onLogin({ 
          name: data.user.name, 
          email: data.user.email,
          photoURL: data.user.photoURL,
          isAdmin: data.user.isAdmin
        });
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password
          })
        });
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Ro'yxatdan o'tishda xatolik yuz berdi");
          setLoading(false);
          setLoadingProvider(null);
          return;
        }
        
        onLogin({ 
          name: data.user.name, 
          email: data.user.email,
          photoURL: data.user.photoURL,
          isAdmin: data.user.isAdmin
        });
      }
    } catch (err: any) {
      setError("Server bilan ulanishda xatolik yuz berdi: " + (err.message || 'Tarmoq xatosi'));
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  // Google OAuth Flow
  const handleGoogleLogin = async () => {
    setError('');
    setInfoMessage('');
    setLoading(true);
    setLoadingProvider('google');

    try {
      const googleUser = await signInWithGoogleAccount();
      const user = await dbService.googleLogin({
        name: googleUser.name,
        email: googleUser.email,
        photoURL: googleUser.photoURL
      });
      onLogin({
        name: user.name,
        email: user.email,
        photoURL: user.photoURL || googleUser.photoURL,
        isAdmin: user.isAdmin
      });
    } catch (err: any) {
      console.warn("Google Auth error handled:", err);
      setError(err.message || "Google orqali kirish amalga oshmadi.");
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  // GitHub OAuth Flow
  const handleGithubLogin = async () => {
    setError('');
    setInfoMessage('');
    setLoading(true);
    setLoadingProvider('github');

    try {
      const githubUser = await signInWithGithubAccount();
      const user = await dbService.githubLogin({
        name: githubUser.name,
        email: githubUser.email,
        photoURL: githubUser.photoURL
      });
      onLogin({
        name: user.name,
        email: user.email,
        photoURL: user.photoURL || githubUser.photoURL,
        isAdmin: user.isAdmin
      });
    } catch (err: any) {
      console.warn("GitHub Auth error handled:", err);
      setError(err.message || "GitHub orqali kirish amalga oshmadi.");
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  // Biometric / WebAuthn Hardware Login
  const handleBiometricLogin = async () => {
    setError('');
    setInfoMessage('');
    setLoading(true);
    setLoadingProvider('biometric');

    try {
      const bioResult = await authenticateWithBiometrics(formData.email.trim() || undefined);
      if (bioResult.success && bioResult.user) {
        onLogin({
          name: bioResult.user.name,
          email: bioResult.user.email,
          photoURL: bioResult.user.photoURL,
          isAdmin: bioResult.user.isAdmin
        });
      } else {
        setError(bioResult.message || "Biometrik kalit topilmadi. Avval parolingiz bilan kiring va Sozlamalardan biometrik kalit qo'shing.");
      }
    } catch (err: any) {
      setError(err.message || "Biometrik autentifikatsiyada xatolik yuz berdi");
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  // Fast Guest / Test Mode
  const handleGuestLogin = () => {
    setLoading(true);
    setLoadingProvider('guest');
    const guestUser = {
      name: "Mehmon Foydalanuvchi",
      email: `mehmon_${Math.floor(1000 + Math.random() * 9000)}@student.ai`,
      isAdmin: false
    };
    setTimeout(() => {
      onLogin(guestUser);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F9FBFF] flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in relative overflow-hidden">
      {/* Top Bar Back Button */}
      <button 
        id="auth-back-btn"
        onClick={onBack}
        className="absolute top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-primary transition-colors cursor-pointer z-20 py-2 px-3 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm"
      >
        <ChevronLeft size={16} /> Bosh sahifa
      </button>

      <div className="w-full max-w-md space-y-6 relative z-10 my-auto py-8">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 text-white rounded-[1.75rem] shadow-xl shadow-slate-900/10 mb-2 rotate-3 hover:rotate-0 transition-transform duration-300">
            <GraduationCap size={36} className="text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Student AI <span className="text-primary font-serif italic">Pro</span>
          </h1>
          <p className="text-slate-500 font-semibold text-xs tracking-wide">
            {isLogin ? 'Hisobingizga kiring va o\'qishni davom ettiring' : 'Yangi hisob oching va barcha imkoniyatlardan foydalaning'}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-2xl shadow-slate-200/50 space-y-5">
          
          {/* Quick OAuth Providers (GitHub & Google) */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* GitHub Button */}
              <button
                id="btn-login-github"
                type="button"
                disabled={loading}
                onClick={handleGithubLogin}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-slate-900/10 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loadingProvider === 'github' ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <Github size={18} className="text-white" />
                )}
                <span>GitHub orqali</span>
              </button>

              {/* Google Button */}
              <button
                id="btn-login-google"
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs tracking-wide transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loadingProvider === 'google' ? (
                  <Loader2 size={16} className="animate-spin text-primary" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                )}
                <span>Google orqali</span>
              </button>
            </div>

            {/* Passkey / Hardware Biometrics & Guest */}
            <div className="flex items-center gap-2 pt-1">
              <button
                id="btn-login-biometric"
                type="button"
                disabled={loading}
                onClick={handleBiometricLogin}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] tracking-wide transition-all border border-indigo-100 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Barmoq izi, FaceID yoki Windows Hello orqali kirish"
              >
                {loadingProvider === 'biometric' ? (
                  <Loader2 size={14} className="animate-spin text-indigo-600" />
                ) : (
                  <Fingerprint size={16} className="text-indigo-600" />
                )}
                <span>Biometrik Passkey</span>
              </button>

              <button
                id="btn-login-guest"
                type="button"
                disabled={loading}
                onClick={handleGuestLogin}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] tracking-wide transition-all border border-slate-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Ro'yxatdan o'tmasdan tezkor sinovdan o'tkazish"
              >
                <Sparkles size={14} className="text-amber-500" />
                <span>Mehmon</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">yoki email orqali</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-2xl animate-shake">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Message Display */}
          {infoMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl">
              <CheckCircle2 size={16} />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-1">{t('fullName')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="input-auth-name"
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm text-slate-900"
                    placeholder="Alisher Aliyev"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-1">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="input-auth-email"
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm text-slate-900"
                  placeholder="talaba@edu.uz"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{t('password')}</label>
                {isLogin && (
                  <span className="text-[11px] font-medium text-primary hover:underline cursor-pointer">
                    Unutdingizmi?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="input-auth-password"
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm text-slate-900"
                  placeholder="Kamida 6 ta belgi"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer disabled:opacity-50 mt-2 active:scale-98"
            >
              {loadingProvider === 'email' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? t('login') : t('register')}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="text-center pt-2">
            <button
              id="btn-auth-toggle-mode"
              onClick={() => { setIsLogin(!isLogin); setError(''); setInfoMessage(''); }}
              className="text-xs font-bold text-slate-500 hover:text-primary transition-colors cursor-pointer"
            >
              {isLogin ? (
                <>Hisobingiz yo'qmi? <span className="text-primary underline font-extrabold">Ro'yxatdan o'ting</span></>
              ) : (
                <>Hisobingiz bormi? <span className="text-primary underline font-extrabold">Tizimga kiring</span></>
              )}
            </button>
          </div>
        </div>

        {/* Security Trust Badges */}
        <div className="flex items-center justify-center gap-4 text-slate-400 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>FIPS 140-2 Shifrlash</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-primary" />
            <span>Cloud Firestore Sync</span>
          </div>
        </div>
      </div>

      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>
    </div>
  );
};
