import React, { useState, useEffect } from 'react';
import { 
  Target, Calendar, TrendingUp, Sparkles, BookOpen, Clock, 
  CheckCircle2, Loader2, Rocket, ArrowRight, MessageSquare, 
  Flame, Zap, Award, Play, Pause, RotateCcw, Plus, Trash2, 
  Filter, Copy, Check, Brain, Lightbulb, Compass, ShieldCheck,
  Send, RefreshCw, BarChart2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../context/LanguageContext';
import { 
  generateStructuredStudyPlan, 
  chatWithStudyCoach, 
  StructuredStudyPlan 
} from '../services/geminiService';

interface TaskItem {
  id: string;
  task: string;
  subject: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  day: string;
  done: boolean;
}

interface ChatMsg {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

export const StudyCoach: React.FC<{ user: any }> = ({ user }) => {
  const { t, language } = useLanguage();
  const userEmail = user?.email || 'default_student';
  const STORAGE_KEY = `student_ai_study_coach_${userEmail}`;

  // Active Tab: 'planner' | 'chat' | 'pomodoro' | 'analytics'
  const [activeTab, setActiveTab] = useState<'planner' | 'chat' | 'pomodoro' | 'analytics'>('planner');

  // Goal & Plan State
  const [goal, setGoal] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Matematika va Fizika');
  const [prepDuration, setPrepDuration] = useState('3 kun');
  const [dailyHours, setDailyHours] = useState('2-3 soat');
  
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [aiPlan, setAiPlan] = useState<StructuredStudyPlan | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 't1', task: "Fizika: Kvant mexanikasi va atom tushunchalarini takrorlash", subject: "Fizika", time: "45 min", priority: "high", day: "1-Kun", done: true },
    { id: 't2', task: "Matematika: Differensial tenglamalar bo'yicha 15 ta test yechish", subject: "Matematika", time: "30 min", priority: "high", day: "1-Kun", done: false },
    { id: 't3', task: "IELTS Writing: Task 2 bo'yicha namunaviy esse va lug'at yodlash", subject: "Ingliz tili", time: "60 min", priority: "medium", day: "2-Kun", done: false },
    { id: 't4', task: "Dasturlash: Python va Algoritmlar bo'yicha 3 ta masala", subject: "Dasturlash", time: "40 min", priority: "medium", day: "2-Kun", done: false },
  ]);

  // Task Filter
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Umumiy');

  // Stats & XP
  const [streakDays, setStreakDays] = useState(7);
  const [earnedXP, setEarnedXP] = useState(1450);
  const [copiedAdvice, setCopiedAdvice] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      id: 'c1',
      sender: 'coach',
      text: `Salom, ${user?.name ? user.name.split(' ')[0] : 'Talaba'}! Men sizning shaxsiy AI Murabbiyingizman. Bugungi o'quv rejangiz, imtihon tayyorgarligi yoki vaqtni to'g'ri taqsimlash bo'yicha qanday maslahat kerak?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputChat, setInputChat] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  // Pomodoro State
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedPomodoroTask, setSelectedPomodoroTask] = useState<string>('');
  const [completedSessions, setCompletedSessions] = useState(3);

  // Load persisted state on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.aiPlan) setAiPlan(parsed.aiPlan);
        if (parsed.streakDays !== undefined) setStreakDays(parsed.streakDays);
        if (parsed.earnedXP !== undefined) setEarnedXP(parsed.earnedXP);
        if (parsed.completedSessions !== undefined) setCompletedSessions(parsed.completedSessions);
        if (parsed.goal) setGoal(parsed.goal);
        if (parsed.chatMessages && parsed.chatMessages.length > 0) setChatMessages(parsed.chatMessages);
      }
    } catch (e) {
      console.warn("Failed to load study coach state:", e);
    }
  }, [STORAGE_KEY]);

  // Save state on change
  useEffect(() => {
    try {
      const dataToSave = {
        tasks,
        aiPlan,
        streakDays,
        earnedXP,
        completedSessions,
        goal,
        chatMessages
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn("Failed to save study coach state:", e);
    }
  }, [tasks, aiPlan, streakDays, earnedXP, completedSessions, goal, chatMessages, STORAGE_KEY]);

  // Pomodoro Notification banner state
  const [pomodoroToast, setPomodoroToast] = useState<string | null>(null);

  // Pomodoro Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Session finished
      setCompletedSessions(prev => prev + 1);
      setEarnedXP(prev => prev + 50);
      setPomodoroToast("🎉 Fokus seans tugadi! +50 XP jamg'arildi. Endi biroz dam oling.");
      setTimeout(() => setPomodoroToast(null), 5000);
      
      if (pomodoroMode === 'work') {
        setPomodoroMode('shortBreak');
        setTimeLeft(5 * 60);
      } else {
        setPomodoroMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeft, pomodoroMode]);

  // Switch Pomodoro Mode
  const changePomodoroMode = (mode: 'work' | 'shortBreak' | 'longBreak') => {
    setIsTimerRunning(false);
    setPomodoroMode(mode);
    if (mode === 'work') setTimeLeft(25 * 60);
    if (mode === 'shortBreak') setTimeLeft(5 * 60);
    if (mode === 'longBreak') setTimeLeft(15 * 60);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate Plan Handler
  const handleGeneratePlan = async () => {
    if (!goal.trim()) return;
    setIsGeneratingPlan(true);
    try {
      const plan = await generateStructuredStudyPlan(goal, selectedSubject, prepDuration, dailyHours, language);
      setAiPlan(plan);
      
      // Merge generated tasks into existing task list
      if (plan.tasks && plan.tasks.length > 0) {
        setTasks(prev => [...plan.tasks, ...prev.filter(t => !t.done)]);
      }
      setEarnedXP(prev => prev + 100);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Toggle Task Completion
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextDone = !t.done;
        if (nextDone) setEarnedXP(xp => xp + 20);
        return { ...t, done: nextDone };
      }
      return t;
    }));
  };

  // Delete Task
  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Add Manual Task
  const handleAddManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: TaskItem = {
      id: `custom_${Date.now()}`,
      task: newTaskText.trim(),
      subject: newTaskSubject || 'Umumiy',
      time: '30 min',
      priority: 'medium',
      day: 'Bugun',
      done: false
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');
  };

  // Chat Send Handler
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || inputChat;
    if (!textToSend.trim() || isChatSending) return;

    const userMsg: ChatMsg = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!presetText) setInputChat('');
    setIsChatSending(true);

    try {
      const history = chatMessages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const aiReplyText = await chatWithStudyCoach(textToSend, history, language);
      
      const coachMsg: ChatMsg = {
        id: `c_${Date.now()}`,
        sender: 'coach',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, coachMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatSending(false);
    }
  };

  const copyAdviceToClipboard = () => {
    if (!aiPlan?.advice) return;
    navigator.clipboard.writeText(aiPlan.advice);
    setCopiedAdvice(true);
    setTimeout(() => setCopiedAdvice(false), 2000);
  };

  const completedCount = tasks.filter(t => t.done).length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'pending') return !t.done;
    if (taskFilter === 'completed') return t.done;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20 px-2 sm:px-4">
      
      {/* Top Banner & Profile Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-emerald-300 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">
              <Sparkles size={14} className="text-emerald-400 animate-pulse" /> AI Academic Assistant
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">AI Murabbiy (Study Coach)</h1>
            <p className="text-slate-300 font-medium text-sm sm:text-base max-w-xl">
              Salom, <span className="text-white font-bold">{user?.name || 'Talaba'}</span>! O'qish unumdorligini oshiring, maqsadlaringizga mos reja tuzing va har bir qadamni natijaga aylantiring.
            </p>
          </div>

          {/* KPI Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                <Flame size={20} />
              </div>
              <div>
                <span className="block text-lg font-black leading-none">{streakDays} Kun</span>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Uzluksiz Streak</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-black">
                <Zap size={20} />
              </div>
              <div>
                <span className="block text-lg font-black leading-none">{earnedXP} XP</span>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Aktivlik Ochkosi</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="block text-lg font-black leading-none">{completionPercentage}%</span>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Natija</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 overflow-x-auto border border-slate-200">
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'planner'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Target size={16} className={activeTab === 'planner' ? 'text-primary' : ''} />
          {t('plannerTab')}
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'chat'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare size={16} className={activeTab === 'chat' ? 'text-primary' : ''} />
          {t('chatTab')}
        </button>

        <button
          onClick={() => setActiveTab('pomodoro')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'pomodoro'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock size={16} className={activeTab === 'pomodoro' ? 'text-primary' : ''} />
          {t('pomodoroTab')}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'analytics'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart2 size={16} className={activeTab === 'analytics' ? 'text-primary' : ''} />
          {t('analyticsTab')}
        </button>
      </div>

      {/* TAB 1: O'quv Rejalashtirgich */}
      {activeTab === 'planner' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Goal & Custom Options Input */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Rocket size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Maqsadingizni kiriting</h3>
                <p className="text-xs text-slate-500 font-medium">AI tizimi siz uchun shaxsiy reja va bajariladigan vazifalar paketini tuzib beradi.</p>
              </div>
            </div>

            {/* Quick Goal Preset Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                "3 kunda Fizikadan imtihonga tayyorlanish",
                "IELTS 7.5 Olish bo'yicha 1 haftalik reja",
                "Matematikadan differensial tenglamalarni o'rganish",
                "Python va Sun'iy Intellekt bo'yicha 1 oylik dastur"
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setGoal(preset)}
                  className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-all font-medium flex items-center gap-1.5"
                >
                  <Lightbulb size={12} className="text-amber-500" />
                  {preset}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Masalan: 3 kunda Fizikadan imtihonga tayyorlanish"
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-base font-medium transition-all"
              />

              {/* Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fan / Yo'nalish</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm outline-none focus:bg-white focus:border-primary"
                  >
                    <option value="Matematika va Fizika">Matematika va Fizika</option>
                    <option value="Ingliz tili / IELTS">Ingliz tili / IELTS</option>
                    <option value="Dasturlash / IT">Dasturlash / IT</option>
                    <option value="Kimyo va Biologiya">Kimyo va Biologiya</option>
                    <option value="Tarix va Huquq">Tarix va Huquq</option>
                    <option value="Oliy Matematika">Oliy Matematika</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tayyorgarlik Muddati</label>
                  <select
                    value={prepDuration}
                    onChange={(e) => setPrepDuration(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm outline-none focus:bg-white focus:border-primary"
                  >
                    <option value="3 kun">3 Kun (Intensiv)</option>
                    <option value="1 hafta">1 Hafta</option>
                    <option value="2 hafta">2 Hafta</option>
                    <option value="1 oy">1 Oy (Chuqurlashtirilgan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kunlik Vaqt</label>
                  <select
                    value={dailyHours}
                    onChange={(e) => setDailyHours(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm outline-none focus:bg-white focus:border-primary"
                  >
                    <option value="1-2 soat">1-2 soat</option>
                    <option value="2-3 soat">2-3 soat</option>
                    <option value="4+ soat">4+ soat (Maksimal)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan || !goal.trim()}
                className="w-full bg-slate-900 hover:bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/20 disabled:opacity-50"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    AI Reja va Vazifalar Generatsiya Qilinmoqda...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    AI Bilan Strategik Reja va Vazifalarni Yaratish (+100 XP)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Plan Output Display */}
          {aiPlan && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-6 sm:p-8 rounded-[2rem] space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <Compass size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-indigo-950">AI Murabbiyning Strategik Rejasi</h4>
                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Tizim tomonidan tahlil qilingan metodik maslahat</p>
                  </div>
                </div>

                <button
                  onClick={copyAdviceToClipboard}
                  className="bg-white hover:bg-indigo-100 text-indigo-800 px-3 py-2 rounded-xl text-xs font-bold border border-indigo-200 transition-all flex items-center gap-1.5"
                >
                  {copiedAdvice ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedAdvice ? "Nusxalandi" : "Nusxalash"}
                </button>
              </div>

              <div className="prose prose-indigo prose-sm max-w-none text-indigo-950 leading-relaxed bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-indigo-100">
                <ReactMarkdown>{aiPlan.advice}</ReactMarkdown>
              </div>

              {/* Milestones list */}
              {aiPlan.milestones && aiPlan.milestones.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                    <ShieldCheck size={16} /> Rejaning Asosiy Bosqichlari (Milestones):
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {aiPlan.milestones.map((m, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-indigo-100 space-y-1">
                        <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {m.timeFrame}
                        </span>
                        <h6 className="font-bold text-sm text-slate-900">{m.title}</h6>
                        <p className="text-xs text-slate-500 leading-snug">{m.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Task Management Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <CheckCircle2 size={22} className="text-primary" />
                    Bajariladigan Vazifalar Ro'yxati
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {completedCount} / {tasks.length} vazifa bajarildi ({completionPercentage}%)
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setTaskFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${taskFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    Barchasi ({tasks.length})
                  </button>
                  <button
                    onClick={() => setTaskFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${taskFilter === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    Bajarilmagan
                  </button>
                  <button
                    onClick={() => setTaskFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${taskFilter === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    Bajarilgan ({completedCount})
                  </button>
                </div>
              </div>

              {/* Add Manual Task Bar */}
              <form onSubmit={handleAddManualTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Yangi vazifa nomi..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white font-medium text-sm outline-none focus:border-primary"
                />
                <input
                  type="text"
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  placeholder="Fan"
                  className="w-28 px-3 py-3 rounded-xl border border-slate-200 bg-white font-medium text-sm outline-none focus:border-primary hidden sm:block"
                />
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-primary text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <Plus size={16} /> Qo'shish
                </button>
              </form>

              {/* Tasks List */}
              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium text-sm">Ushbu bo'limda vazifalar topilmadi.</p>
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 group ${
                        task.done
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 hover:border-primary/30 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                            task.done
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                          }`}
                        >
                          {task.done ? <CheckCircle2 size={20} /> : <BookOpen size={20} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <h4 className={`font-bold text-sm transition-all ${task.done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.task}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{task.subject}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {task.time}</span>
                            <span>{task.day}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-slate-300 hover:text-red-500 p-2 transition-colors rounded-lg hover:bg-red-50"
                          title="O'chirish"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Sidebar info / Focus Quick Action */}
            <div className="space-y-6">
              
              {/* Quick Pomodoro Launch Widget */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-[2rem] shadow-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base">Fokus Seansi</h4>
                    <p className="text-xs text-slate-400 font-medium">Diqqatni bir joyga jamlang</p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center space-y-2">
                  <span className="text-3xl font-black tracking-widest text-emerald-400">25:00</span>
                  <p className="text-xs text-slate-300">Har bir bajarilgan seans uchun +50 XP olishingiz mumkin.</p>
                </div>

                <button
                  onClick={() => setActiveTab('pomodoro')}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Play size={16} /> Fokus Xonasiga O'tish
                </button>
              </div>

              {/* Achievements & Badges Card */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Award size={18} className="text-amber-500" /> Erishilgan Yutuqlar
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                      🎯
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">Birinchi Reja</h5>
                      <p className="text-[11px] text-slate-500">AI reja yaratildi</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-black">
                      ⚡
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">7-Kunlik Streak</h5>
                      <p className="text-[11px] text-slate-500">7 kun uzluksiz ta'lim</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                      🎓
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">Fokus Ustasi</h5>
                      <p className="text-[11px] text-slate-500">{completedSessions} ta Pomodoro seansi</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 2: AI Coach Consultation Chat */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
          
          {/* Chat Header */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center">
                <Brain size={20} />
              </div>
              <div>
                <h3 className="font-black text-base">AI Murabbiy Bilan Maslahat Xonasi</h3>
                <p className="text-xs text-slate-400 font-medium">24/7 Shaxsiy akademik va motivatsion maslahatchi</p>
              </div>
            </div>

            <button
              onClick={() => setChatMessages([])}
              className="text-xs text-slate-400 hover:text-white p-2 transition-colors flex items-center gap-1"
              title="Suhbatni tozalash"
            >
              <RefreshCw size={14} /> Tozalash
            </button>
          </div>

          {/* Quick Consultation Presets */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 pl-2">Tezkor Maslahat:</span>
            {[
              "O'qish unumdorligini oshirish bo'yicha 3 ta maslahat",
              "Imtihon oldi xavotirini yo'qotish usullari",
              "Feynman va Pomodoro texnikasini qanday qo'llash kerak?",
              "Kunlik vaqtni to'g'ri taqsimlash (Time Blocking)"
            ].map((preset, i) => (
              <button
                key={i}
                onClick={() => handleSendChatMessage(preset)}
                className="text-xs bg-white hover:bg-primary/5 text-slate-700 hover:text-primary px-3 py-1.5 rounded-lg border border-slate-200 transition-all font-medium whitespace-nowrap flex-shrink-0"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <Brain size={40} className="text-slate-300" />
                <p className="font-bold text-sm text-slate-600">Suhbatni boshlang!</p>
                <p className="text-xs max-w-sm">O'quv rejalaringiz, imtihon tayyorgarligi yoki vaqtni to'g'ri boshqarish bo'yicha ixtiyoriy savol bering.</p>
              </div>
            ) : (
              chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl space-y-1 ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-60">
                      <span>{msg.sender === 'user' ? 'Siz' : 'AI Murabbiy'}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div className="prose prose-sm max-w-none leading-relaxed text-current">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            )}

            {isChatSending && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-none flex items-center gap-2 text-slate-500 font-medium text-xs">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  AI Murabbiy javob yozmoqda...
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                placeholder="AI Murabbiyga savol yoki maslahat so'rovi yuboring..."
                className="flex-1 px-5 py-3.5 rounded-xl border border-slate-200 bg-white font-medium text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!inputChat.trim() || isChatSending}
                className="bg-slate-900 hover:bg-primary text-white px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={16} /> Yuborish
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 3: Pomodoro Focus Mode */}
      {activeTab === 'pomodoro' && (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
          
          {pomodoroToast && (
            <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg text-center font-bold text-sm animate-bounce">
              {pomodoroToast}
            </div>
          )}

          <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-200 shadow-sm text-center space-y-8">
            
            {/* Mode Switcher */}
            <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl gap-2 border border-slate-200">
              <button
                onClick={() => changePomodoroMode('work')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  pomodoroMode === 'work' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🧠 Fokus (25 min)
              </button>
              <button
                onClick={() => changePomodoroMode('shortBreak')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  pomodoroMode === 'shortBreak' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ☕ Kichik Tanaffus (5 min)
              </button>
              <button
                onClick={() => changePomodoroMode('longBreak')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  pomodoroMode === 'longBreak' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🛋️ Katta Tanaffus (15 min)
              </button>
            </div>

            {/* Select Active Task */}
            <div className="max-w-md mx-auto space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Hozirgi bajarilayotgan vazifa:</label>
              <select
                value={selectedPomodoroTask}
                onChange={(e) => setSelectedPomodoroTask(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm outline-none focus:bg-white focus:border-primary text-center"
              >
                <option value="">-- Vazifani tanlang --</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.task}>
                    {t.done ? '✓ ' : ''}{t.task} ({t.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* Huge Timer Circle */}
            <div className="py-6 flex justify-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-8 border-slate-100 flex flex-col items-center justify-center shadow-inner bg-gradient-to-br from-slate-50 to-indigo-50/30">
                <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tighter font-mono">
                  {formatTimer(timeLeft)}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                  {pomodoroMode === 'work' ? 'Fokus Vaqti' : 'Tanaffus Vaqti'}
                </span>
              </div>
            </div>

            {/* Play / Pause / Reset Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all flex items-center gap-3 ${
                  isTimerRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-primary'
                }`}
              >
                {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
                {isTimerRunning ? 'Pauza' : 'Boshlash'}
              </button>

              <button
                onClick={() => changePomodoroMode(pomodoroMode)}
                className="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                title="Qayta boshlash"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            {/* Seans Stat */}
            <div className="pt-4 border-t border-slate-100 flex justify-center gap-8 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Bajarilgan seanslar: <strong className="text-slate-900">{completedSessions}</strong></span>
              <span>Jamg'arilgan XP: <strong className="text-emerald-600">+{completedSessions * 50} XP</strong></span>
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: Weekly Analytics & Progress */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Weekly Activity Chart Card */}
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-6 relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black">Haftalik O'quv Statistikasi</h3>
                    <p className="text-xs text-slate-400 font-medium">Har kuni o'rtacha 2.5 soat faol ta'lim olindi</p>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">
                    +18% samaradorlik
                  </span>
                </div>

                <div className="h-48 flex items-end gap-3 pt-6">
                  {[
                    { day: 'Dush', h: 40, label: '45 min' },
                    { day: 'Sesh', h: 65, label: '75 min' },
                    { day: 'Chor', h: 85, label: '110 min' },
                    { day: 'Pay', h: 50, label: '60 min' },
                    { day: 'Jum', h: 95, label: '120 min' },
                    { day: 'Shan', h: 70, label: '90 min' },
                    { day: 'Yak', h: 80, label: '100 min' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div
                        className="w-full bg-primary/80 hover:bg-primary rounded-t-xl transition-all relative group cursor-pointer"
                        style={{ height: `${item.h}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-black px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow">
                          {item.label}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Subject Mastery Breakdown */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900">Fanlar Bo'yicha Bajarilish</h3>
              
              <div className="space-y-4">
                {[
                  { name: 'Fizika', percent: 85, color: 'bg-blue-500' },
                  { name: 'Matematika', percent: 70, color: 'bg-purple-500' },
                  { name: 'Ingliz tili / IELTS', percent: 90, color: 'bg-emerald-500' },
                  { name: 'Dasturlash / IT', percent: 60, color: 'bg-amber-500' },
                ].map((s, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-900">{s.name}</span>
                      <span className="text-slate-500">{s.percent}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${s.color} rounded-full transition-all duration-500`}
                        style={{ width: `${s.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed font-medium">
                💡 <strong>AI Murabbiy maslahati:</strong> Dasturlash va Oliy Matematika bo'yicha ko'proq amaliy masalalar yechish tavsiya etiladi.
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
