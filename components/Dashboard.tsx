
import React from 'react';
import { MENU_GROUPS } from '../constants';
import { AppView } from '../types';

interface DashboardProps {
  setView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {MENU_GROUPS.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 shadow-xl flex items-center justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-primary opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"></div>
              <h2 className="text-lg font-black text-white z-10">{group.title}</h2>
              <div className="text-primary z-10">{group.icon}</div>
            </div>
            
            <div className="grid gap-2">
              {group.items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setView(item.view)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl text-right transition-all duration-200 hover:border-primary group flex items-center justify-between shadow-sm hover:shadow-md"
                >
                  <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-primary">{item.label}</span>
                  <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-primary text-xs">←</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modern Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'إجمالي المبيعات (ل.س)', val: '245,600,000', color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'المقبوضات اليومية', val: '189,200,000', color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'رصيد الصندوق ($)', val: '12,450.00', color: 'text-amber-500', bg: 'bg-amber-500/5' },
        ].map((st, i) => (
          <div key={i} className={`${st.bg} p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center gap-2`}>
            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{st.label}</span>
            <span className={`text-4xl font-mono font-black ${st.color}`}>{st.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
