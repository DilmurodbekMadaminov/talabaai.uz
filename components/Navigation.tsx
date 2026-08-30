
import React from 'react';
import { AppView } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { 
  BookOpen, FileText, Briefcase, Mic, Zap, LayoutGrid, 
  Users, Target, Video, Wand2, Globe2, LogOut, Settings, Smile, GraduationCap,
  Wallet, Trophy, ShieldAlert, Calculator, User, Lock
} from 'lucide-react';

interface NavigationProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isAdmin?: boolean;
  isPro?: boolean;
  isMobileToggle?: boolean;
  onLogout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onChangeView, isAdmin, isPro, isMobileToggle, onLogout }) => {
  const { t } = useLanguage();
  
  const topItems = [
    { id: AppView.HOME, label: t('dashboard'), icon: <LayoutGrid size={20} /> },
    { id: AppView.MATH, label: t('matematika'), icon: <Calculator size={20} /> },
    { id: AppView.FREELANCE_HUB, label: t('freelanceHub'), icon: <Briefcase size={20} /> },
    { id: AppView.VISUAL_LAB, label: t('visualLab'), icon: <Wand2 size={20} /> },
    { id: AppView.COACH, label: t('studyCoach'), icon: <Target size={20} /> },
    { id: AppView.MAPS, label: t('maps'), icon: <Globe2 size={20} /> },
    { id: AppView.LIVE_TUTOR, label: t('aiVoice'), icon: <Mic size={20} /> },
  ];

  const bottomItems = [
    { id: AppView.NOTES, label: t('notes'), icon: <FileText size={20} /> },
    { id: AppView.PROFILE, label: t('profileAndSettings'), icon: <User size={20} /> },
  ];

  return (
    <nav className={`${isMobileToggle ? 'relative w-full h-full' : 'fixed left-0 top-0 h-full w-20 lg:w-64 border-r border-slate-100 shadow-sm'} bg-white flex flex-col z-50 transition-all duration-300`}>
      {!isMobileToggle && (
        <div className="h-20 flex items-center justify-center lg:justify-start gap-3 px-4 lg:px-6 border-b border-slate-100/80 mb-2">
          <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-primary/25 hover:scale-105 transition-transform cursor-pointer">
             <Smile size={24} />
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-base font-black text-slate-900 tracking-tight leading-none">Student AI</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ekotizim</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 lg:px-4 py-2 space-y-1.5 custom-scrollbar">
        {isMobileToggle && (
          <div className="px-3 py-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Asosiy Bo'limlar
            </span>
          </div>
        )}

        {topItems.map((item) => (
          <NavButton 
            key={item.id} 
            active={currentView === item.id} 
            onClick={() => onChangeView(item.id)} 
            icon={item.icon} 
            label={item.label} 
            isMobileToggle={isMobileToggle}
          />
        ))}
        
        {isAdmin && (
          <NavButton 
            active={currentView === AppView.ADMIN} 
            onClick={() => onChangeView(AppView.ADMIN)} 
            icon={<ShieldAlert size={20} />} 
            label={t('adminPanel')} 
            variant="admin"
            isMobileToggle={isMobileToggle}
          />
        )}
        
        <div className={`my-3 border-t border-slate-100 mx-2 ${isMobileToggle ? 'block' : 'hidden lg:block'}`}></div>
        
        {isMobileToggle && (
          <div className="px-3 py-1 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Shaxsiy & Sozlamalar
            </span>
          </div>
        )}

        {bottomItems.map((item) => (
          <NavButton 
            key={item.id} 
            active={currentView === item.id} 
            onClick={() => onChangeView(item.id)} 
            icon={item.icon} 
            label={item.label} 
            isMobileToggle={isMobileToggle}
          />
        ))}
      </div>

      <div className="p-3 lg:p-4 space-y-2 border-t border-slate-100 bg-slate-50/50">
         <div className="px-1">
            <LanguageSelector />
         </div>
         <button 
           onClick={onLogout}
           className="w-full flex items-center justify-center lg:justify-start gap-3.5 px-3.5 py-3 rounded-2xl text-rose-500 font-black transition-all hover:bg-rose-50 active:scale-95 group cursor-pointer"
           title={t('logout')}
         >
            <LogOut size={20} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <span className={`${isMobileToggle ? 'block' : 'hidden lg:block'} text-[11px] uppercase tracking-widest`}>{t('logout')}</span>
         </button>
      </div>
    </nav>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, variant?: 'default' | 'admin', isMobileToggle?: boolean }> = ({ active, onClick, icon, label, variant = 'default', isMobileToggle }) => (
  <button
    onClick={onClick}
    title={label}
    className={`w-full min-h-[46px] flex items-center justify-center lg:justify-between px-3 lg:px-4 py-3 rounded-2xl transition-all font-black group whitespace-nowrap overflow-hidden relative active:scale-95 cursor-pointer ${
      active 
        ? variant === 'admin' 
          ? 'bg-rose-50 text-rose-600 shadow-xs border border-rose-200/60' 
          : 'bg-primary text-white shadow-md shadow-primary/20' 
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
    }`}
  >
    <div className="flex items-center gap-3.5 truncate">
      <div className={`flex-shrink-0 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
         {icon}
      </div>
      <span className={`${isMobileToggle ? 'block text-slate-800' : 'hidden lg:block'} ${active && !isMobileToggle ? 'text-white' : ''} text-xs uppercase tracking-wider font-extrabold truncate`}>{label}</span>
    </div>

    {/* Tooltip on md: icon-only sidebar */}
    {!isMobileToggle && (
      <div className="hidden md:group-hover:flex lg:hidden absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-black rounded-xl shadow-xl z-50 pointer-events-none whitespace-nowrap uppercase tracking-wider">
        {label}
      </div>
    )}
  </button>
);
