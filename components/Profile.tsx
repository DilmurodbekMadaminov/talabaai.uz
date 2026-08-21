
import React, { useState, useEffect, useRef } from 'react';
import { User, CreditCard, Settings, Shield, HelpCircle, LogOut, Star, Package, ChevronRight, Zap, Target, BookOpen, Clock, Activity, Bell, Lock, Plus, Trash2, CheckCircle2, ShieldCheck, Loader2, Crown, Camera, Upload, Image as ImageIcon, Hash, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ProSubscriptionModal } from './ProSubscriptionModal';
import { getAbsoluteApiUrl } from '../services/apiConfig';
import { dbService } from '../services/dbService';

interface ProfileProps {
  onLogout: () => void;
  user: { id?: number; name: string; email: string; avatar?: string; photoURL?: string; isAdmin?: boolean } | null;
  defaultTab?: 'overview' | 'settings';
}

export const Profile: React.FC<ProfileProps> = ({ onLogout, user, defaultTab = 'overview' }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>(defaultTab);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [subStatus, setSubStatus] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | undefined>(user?.avatar || user?.photoURL);
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user?.avatar || user?.photoURL) {
      setCurrentAvatar(user.avatar || user.photoURL);
    }
  }, [user?.avatar, user?.photoURL]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.email) return;

    if (file.size > 8 * 1024 * 1024) {
      setAvatarMsg({ type: 'error', text: "Rasm hajmi 8MB dan oshmasligi kerak!" });
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;

        const img = new Image();
        img.src = dataUrl;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 320;
          const MAX_HEIGHT = 320;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

          setCurrentAvatar(compressedDataUrl);

          const res = await dbService.updateUserAvatar(user.email, compressedDataUrl);
          if (res && res.user) {
            dbService.setSession(res.user);
            window.dispatchEvent(new Event('user_session_updated'));
            setAvatarMsg({ type: 'success', text: "Profil rasmi muvaffaqiyatli yangilandi!" });
          } else {
            setAvatarMsg({ type: 'error', text: "Rasm saqlashda xatolik yuz berdi" });
          }
          setIsUploadingAvatar(false);
        };
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      setAvatarMsg({ type: 'error', text: err.message || "Xatolik yuz berdi" });
      setIsUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      loadSubscriptionStatus();
    }
  }, [user?.email]);

  const loadSubscriptionStatus = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(getAbsoluteApiUrl(`/api/subscription/status?email=${encodeURIComponent(user.email)}`));
      if (res.ok) {
        const data = await res.json();
        setSubStatus(data);
      }
    } catch (e) {
      console.error("Subscription status fetch error:", e);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="bg-surface rounded-[2rem] p-8 border border-border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          <div className="relative group">
            <div 
              onClick={handleAvatarClick}
              className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-primary/20 font-black text-4xl rotate-3 overflow-hidden border-4 border-white cursor-pointer hover:rotate-0 transition-all hover:scale-105"
              title="Profil rasmini o'zgartirish uchun bosing"
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt={user?.name || 'Talaba'} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name ? getInitials(user.name) : 'ST'}</span>
              )}

              {/* Upload Hover Overlay */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-xs">
                {isUploadingAvatar ? (
                  <Loader2 size={24} className="animate-spin text-white" />
                ) : (
                  <>
                    <Camera size={22} className="text-white drop-shadow-md" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-white">O'zgartirish</span>
                  </>
                )}
              </div>
            </div>

            {/* Camera badge button */}
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform hover:scale-110 cursor-pointer"
              title="Rasm yuklash"
            >
              {isUploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            accept="image/*" 
            className="hidden" 
          />

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-3xl font-black text-text-primary tracking-tight">{user?.name || 'Talaba'}</h1>
            </div>
            <p className="text-text-secondary font-medium mb-3">{user?.email}</p>

            {avatarMsg && (
              <div className={`mb-3 inline-block px-3 py-1.5 rounded-xl text-xs font-bold ${avatarMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {avatarMsg.text}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm">
                <Hash size={13} className="text-blue-400" /> ID: #{user?.id || 1}
              </span>
              {subStatus?.isPro ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
                  <Crown size={14} className="fill-amber-500" /> PRO Tarif (Faol)
                </span>
              ) : (
                <button
                  onClick={() => setIsProModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-400 shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  <Crown size={14} className="fill-white" /> PRO-ga O'tish (33 000 so'm)
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                <Target size={14} /> Lvl 12
              </span>
              {user?.isAdmin && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-100">
                  <Shield size={14} /> Admin
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setActiveTab('overview')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Profil & Statistika</button>
             <button onClick={() => setActiveTab('settings')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Sozlamalar & Xavfsizlik</button>
          </div>
        </div>
      </div>

      {/* Pro Banner if not pro */}
      {!subStatus?.isPro && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <span className="inline-block px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-400/30">
              Cheksiz AI Imkoniyatlar
            </span>
            <h3 className="text-xl md:text-2xl font-black tracking-tight">Student AI PRO — Maxsus Imkoniyatlar</h3>
            <p className="text-slate-300 text-xs font-medium max-w-xl">
              Cheksiz AI testlar, konspektlar, audio tutor va matematika imtihon yechimlari. Oyiga bor yog'i 33 000 so'm.
            </p>
          </div>
          <button
            onClick={() => setIsProModalOpen(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <Crown size={16} className="fill-slate-950" /> PRO Tarifga O'tish
          </button>
        </div>
      )}

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Column */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <StatCard icon={<Zap className="text-amber-500" />} label="AI Tokens" value="1.2M" sub="This month" trend="+15%" />
               <StatCard icon={<BookOpen className="text-blue-500" />} label="Study Hours" value="124h" sub="Total time" trend="+2h" />
               <StatCard icon={<Activity className="text-green-500" />} label="Projects" value="18" sub="Completed" trend="+3" />
               <StatCard icon={<Clock className="text-purple-500" />} label="Streak" value="14 Days" sub="Active days" trend="🔥" />
            </div>
            
            <div className="bg-surface rounded-[2rem] p-8 border border-border shadow-sm space-y-6">
               <h3 className="text-sm font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                 <Activity size={18} className="text-primary" /> Recent Activity
               </h3>
               <div className="space-y-4">
                 <ActivityItem title="Generated essay about Quantum Physics" time="2 hours ago" type="ai" />
                 <ActivityItem title="Completed React fundamentals quiz" time="5 hours ago" type="quiz" />
                 <ActivityItem title="Earned 'Early Adopter' badge" time="1 day ago" type="achievement" />
                 <ActivityItem title="Submitted freelance proposal" time="2 days ago" type="work" />
               </div>
            </div>
          </div>
          
          {/* Menu Column */}
          <div className="space-y-6">
             <div className="bg-surface rounded-[2rem] border border-border shadow-sm overflow-hidden p-2">
               <MenuItem icon={<Settings size={20} />} label="Profil & Xavfsizlik Sozlamalari" onClick={() => setActiveTab('settings')} />
               <MenuItem icon={<Package size={20} />} label={t('myOrders')} />
               <MenuItem icon={<Sparkles size={20} />} label="PRO Obuna & Promokod" onClick={() => setIsProModalOpen(true)} />
               <MenuItem icon={<HelpCircle size={20} />} label={t('help')} />
             </div>
             
             <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
                   <LogOut size={24} />
                </div>
                <div>
                   <h4 className="text-sm font-black text-red-900">Tizimdan Chiqish</h4>
                   <p className="text-[10px] font-medium text-red-500/80 mt-1">Hisobingizdan chiqishni xohlaysizmi?</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-colors shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  Chiqishni Tasdiqlash
                </button>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-[2rem] p-8 border border-border shadow-sm space-y-8">
           <h3 className="text-xl font-black text-text-primary tracking-tighter">Profil va Hisob Sozlamalari</h3>
           
           <div className="space-y-6 max-w-2xl">
              {/* Profile Picture Upload Section */}
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profil Rasmi (Avatar)</h4>
                 <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-md flex items-center justify-center shrink-0">
                       {currentAvatar ? (
                          <img src={currentAvatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                       ) : (
                          <span className="font-black text-2xl text-slate-600">{user?.name ? getInitials(user.name) : 'ST'}</span>
                       )}
                    </div>
                    <div className="space-y-2 flex-1 text-center sm:text-left">
                       <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <button
                             type="button"
                             onClick={handleAvatarClick}
                             disabled={isUploadingAvatar}
                             className="px-4 py-2 bg-primary hover:bg-blue-600 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                          >
                             {isUploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                             <span>Yangi Rasm Yuklash</span>
                          </button>
                          {currentAvatar && (
                             <button
                                type="button"
                                onClick={async () => {
                                   if (!user?.email) return;
                                   setIsUploadingAvatar(true);
                                   setCurrentAvatar(undefined);
                                   const res = await dbService.updateUserAvatar(user.email, '');
                                   if (res && res.user) {
                                      dbService.setSession(res.user);
                                      window.dispatchEvent(new Event('user_session_updated'));
                                      setAvatarMsg({ type: 'success', text: "Profil rasmi olib tashlandi" });
                                   }
                                   setIsUploadingAvatar(false);
                                }}
                                disabled={isUploadingAvatar}
                                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                             >
                                <Trash2 size={14} />
                                <span>O'chirish</span>
                             </button>
                          )}
                       </div>
                       <p className="text-[11px] text-slate-500 font-medium">
                          Kompyuter yoki telefondan rasm tanlang (JPG, PNG, WEBP). Rasm avtomatik ravishda optimallashtiriladi.
                       </p>
                    </div>
                 </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profil Ma'lumotlari</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-700">To'liq Ism Sharif</label>
                       <input type="text" defaultValue={user?.name} className="w-full bg-background border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-700">Email Manzili</label>
                       <input type="email" defaultValue={user?.email} className="w-full bg-background border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none" disabled />
                    </div>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gemini/OpenAI/DeepSeek API Kalitlar</h4>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-700">Gemini API Kaliti (Barcha asosiy xizmatlar uchun)</label>
                       <input 
                         type="password" 
                         defaultValue={localStorage.getItem('GEMINI_API_KEY') || ''} 
                         onChange={(e) => localStorage.setItem('GEMINI_API_KEY', e.target.value)}
                         placeholder="AI Studio API kalitingiz bu yerga"
                         className="w-full bg-background border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none" 
                       />
                       <p className="text-[10px] text-slate-400 font-medium">Bu kalit qurilmangizning o'zida saqlanadi (localStorage).</p>
                    </div>
                 </div>
              </div>

              {/* Biometric Security (WebAuthn / Passkeys) section removed */}

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Afzalliklar & Sozlamalar</h4>
                 
                 <div className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-surface rounded-xl shadow-sm flex items-center justify-center text-slate-600"><Bell size={18} /></div>
                       <div>
                          <p className="text-sm font-bold text-text-primary">Bildirishnomalar</p>
                          <p className="text-xs text-text-secondary font-medium">Email va bildirishnoma ogohlantirishlari</p>
                       </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-surface rounded-xl shadow-sm flex items-center justify-center text-slate-600"><Lock size={18} /></div>
                       <div>
                          <p className="text-sm font-bold text-text-primary">Ikki bosqichli xavfsizlik (2FA)</p>
                          <p className="text-xs text-text-secondary font-medium">Biometrik va apparat kalitlari</p>
                       </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                 </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                 <button className="px-8 py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                    Saqlash
                 </button>
              </div>
           </div>
        </div>
      )}

      <ProSubscriptionModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        user={user}
        onSuccess={() => {
          loadSubscriptionStatus();
        }}
      />
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, sub: string, trend: string }> = ({ icon, label, value, sub, trend }) => (
  <div className="bg-surface p-6 rounded-[2rem] border border-border shadow-sm hover:border-primary/30 transition-all cursor-default">
     <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center">{icon}</div>
        <span className="text-[10px] font-black text-green-500 bg-green-50 px-2.5 py-1 rounded-lg">{trend}</span>
     </div>
     <h4 className="text-2xl font-black text-text-primary tracking-tighter mb-1">{value}</h4>
     <p className="text-xs font-bold text-slate-600">{label}</p>
     <p className="text-[10px] font-medium text-slate-400 mt-1">{sub}</p>
  </div>
);

const ActivityItem: React.FC<{ title: string, time: string, type: 'ai' | 'quiz' | 'achievement' | 'work' }> = ({ title, time, type }) => {
  const icons = {
    ai: <Zap size={16} className="text-blue-500" />,
    quiz: <BookOpen size={16} className="text-purple-500" />,
    achievement: <Target size={16} className="text-amber-500" />,
    work: <Activity size={16} className="text-green-500" />
  };
  const bgColors = {
    ai: 'bg-blue-50',
    quiz: 'bg-purple-50',
    achievement: 'bg-amber-50',
    work: 'bg-green-50'
  };

  return (
    <div className="flex items-center gap-4 group cursor-pointer">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgColors[type]}`}>
         {icons[type]}
      </div>
      <div className="flex-1 min-w-0 border-b border-slate-50 py-3 group-last:border-0 border-dashed">
         <p className="text-sm font-bold text-text-primary truncate">{title}</p>
         <p className="text-[10px] font-medium text-slate-400">{time}</p>
      </div>
    </div>
  );
};

const MenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 rounded-xl border-b border-slate-50 last:border-0 hover:bg-background transition-colors text-left group cursor-pointer"
  >
    <div className="flex items-center gap-4 text-text-secondary group-hover:text-primary transition-colors">
      <div className="w-8 h-8 rounded-lg bg-surface shadow-sm flex items-center justify-center border border-border group-hover:border-primary/20">
         {icon}
      </div>
      <span className="font-bold text-slate-700 text-sm group-hover:text-primary">{label}</span>
    </div>
    <ChevronRight size={16} className="text-slate-300" />
  </button>
);
