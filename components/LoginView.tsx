
import React, { useState } from 'react';
import { Lock, User, Info, AlertCircle, KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';
import { AppSettings } from '../types';

interface LoginViewProps {
  settings: AppSettings;
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ settings, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === settings.username && password === (settings.password || '')) {
      onLogin();
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden ${settings.darkMode ? 'bg-zinc-950' : 'bg-zinc-100'}`} dir="rtl">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary opacity-[0.03] blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary opacity-[0.03] blur-[120px] rounded-full"></div>

      <div className={`w-full max-w-lg p-10 rounded-[40px] border shadow-2xl relative z-10 transition-all ${settings.darkMode ? 'bg-zinc-900/80 border-zinc-800 backdrop-blur-xl' : 'bg-white/90 border-zinc-200 backdrop-blur-xl'}`}>
        <div className="text-center space-y-4 mb-10">
          <div className="mx-auto w-24 h-24 bg-primary rounded-[30px] flex items-center justify-center text-white shadow-2xl shadow-primary/30 relative group overflow-hidden">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} className="w-16 h-16 object-contain" alt="Logo" />
            ) : (
              <KeyRound className="w-12 h-12 group-hover:scale-110 transition-transform duration-500" />
            )}
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-zinc-800 dark:text-white uppercase">{settings.companyName}</h1>
            <p className="text-zinc-500 font-bold text-sm tracking-wide flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              منطقة الدخول الآمن للنظام
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mr-4">Username / اسم المستخدم</label>
            <div className="relative group">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl group-focus-within:bg-primary group-focus-within:text-white transition-colors duration-300">
                <User className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم هنا..."
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-primary/30 dark:focus:border-primary/50 rounded-2xl py-4 pr-16 pl-4 outline-none transition-all font-bold text-zinc-800 dark:text-zinc-100 shadow-inner"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mr-4">Password / كلمة المرور</label>
            <div className="relative group">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl group-focus-within:bg-primary group-focus-within:text-white transition-colors duration-300">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-primary/30 dark:focus:border-primary/50 rounded-2xl py-4 pr-16 pl-4 outline-none transition-all font-bold text-zinc-800 dark:text-zinc-100 shadow-inner"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 text-rose-500 text-xs font-black bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 animate-shake">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-3xl shadow-[0_20px_40px_-10px_rgba(225,29,72,0.4)] transition-all active:scale-[0.98] text-xl flex items-center justify-center gap-3"
          >
            تـسـجـيـل الـدخـول
            <ArrowLeft className="w-6 h-6" />
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <button 
            onClick={() => setShowHint(!showHint)} 
            className="text-zinc-400 hover:text-primary text-xs font-black flex items-center justify-center gap-2 mx-auto transition-colors py-2 px-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <Info className="w-4 h-4" />
            <span>هل نسيت بيانات الدخول؟</span>
          </button>
          
          {showHint && (
            <div className="mt-4 p-5 bg-primary/5 rounded-3xl border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="text-zinc-600 dark:text-zinc-300 text-xs font-bold leading-relaxed space-y-2">
                <p className="text-primary uppercase tracking-widest font-black text-[10px]">Security Hint / تلميح الأمان</p>
                <p className="italic text-sm">"{settings.passwordHint || 'لا يوجد تلميح متاح حالياً، تواصل مع المسؤول.'}"</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding for Login Screen */}
      <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-40">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">{settings.companyName} SECURE ACCESS</span>
        <span className="text-[9px] font-bold text-zinc-500">BY: MOHANNAD AHMAD - SYRIA</span>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
};

export default LoginView;
