
import React, { useState } from 'react';
import { Lock, User, Info, AlertCircle, KeyRound } from 'lucide-react';
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
    <div className={`min-h-screen flex items-center justify-center p-6 ${settings.darkMode ? 'bg-zinc-950' : 'bg-zinc-100'}`} dir="rtl">
      <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl space-y-8 ${settings.darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 animate-bounce-slow">
            {settings.logoUrl ? <img src={settings.logoUrl} className="w-10 h-10 object-contain" /> : <KeyRound className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-black text-zinc-800 dark:text-white">{settings.companyName}</h1>
          <p className="text-zinc-500 text-sm font-bold">يرجى تسجيل الدخول للوصول إلى النظام</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mr-1">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 pr-12 outline-none focus:border-primary transition-all font-bold text-zinc-800 dark:text-zinc-100"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mr-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 pr-12 outline-none focus:border-primary transition-all font-bold text-zinc-800 dark:text-zinc-100"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-500/10 p-3 rounded-xl animate-shake">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-primary hover:brightness-110 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 text-lg"
          >
            تسجيل الدخول
          </button>
        </form>

        <div className="pt-4 text-center">
          <button 
            onClick={() => setShowHint(!showHint)} 
            className="text-zinc-500 hover:text-primary text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>هل نسيت كلمة السر؟</span>
          </button>
          
          {showHint && (
            <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-top-2">
              <p className="text-zinc-600 dark:text-zinc-300 text-xs font-bold italic leading-relaxed">
                تلميح كلمة السر: <span className="text-primary">{settings.passwordHint || 'لا يوجد تلميح متاح'}</span>
              </p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
      `}</style>
    </div>
  );
};

export default LoginView;
