
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Calendar, ArrowLeft, Search } from 'lucide-react';
import { CashEntry, AppSettings } from '../types';

interface DailyBalancesViewProps {
  onBack: () => void;
}

interface DayAggregate {
  date: string;
  receivedSYP: number;
  paidSYP: number;
  receivedUSD: number;
  paidUSD: number;
  balanceSYP: number;
  balanceUSD: number;
}

const DailyBalancesView: React.FC<DailyBalancesViewProps> = ({ onBack }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [aggregates, setAggregates] = useState<DayAggregate[]>([]);
  const [rangeTotals, setRangeTotals] = useState<DayAggregate | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    // Load Settings for Logo and Currency
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    const saved = localStorage.getItem('sheno_cash_journal');
    if (saved) {
      try {
        const entries: CashEntry[] = JSON.parse(saved);
        
        // Group and aggregate by date
        const grouped = entries.reduce((acc: Record<string, DayAggregate>, entry: CashEntry) => {
          const date = entry.date;
          if (!acc[date]) {
            acc[date] = { date, receivedSYP: 0, paidSYP: 0, receivedUSD: 0, paidUSD: 0, balanceSYP: 0, balanceUSD: 0 };
          }
          acc[date].receivedSYP += (entry.receivedSYP || 0);
          acc[date].paidSYP += (entry.paidSYP || 0);
          acc[date].receivedUSD += (entry.receivedUSD || 0);
          acc[date].paidUSD += (entry.paidUSD || 0);
          acc[date].balanceSYP += ((entry.receivedSYP || 0) - (entry.paidSYP || 0));
          acc[date].balanceUSD += ((entry.receivedUSD || 0) - (entry.paidUSD || 0));
          return acc;
        }, {} as Record<string, DayAggregate>);

        // Sort by date descending
        const sorted = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
        setAggregates(sorted);
      } catch (e) {
        console.error("Failed to parse journal data");
      }
    }
  }, []);

  useEffect(() => {
    // Calculate totals for the selected range
    const filtered = aggregates.filter(a => a.date >= startDate && a.date <= endDate);
    if (filtered.length > 0) {
      const totals = filtered.reduce((acc, curr) => ({
        date: 'range',
        receivedSYP: acc.receivedSYP + curr.receivedSYP,
        paidSYP: acc.paidSYP + curr.paidSYP,
        receivedUSD: acc.receivedUSD + curr.receivedUSD,
        paidUSD: acc.paidUSD + curr.paidUSD,
        balanceSYP: acc.balanceSYP + curr.balanceSYP,
        balanceUSD: acc.balanceUSD + curr.balanceUSD
      }), { date: 'range', receivedSYP: 0, paidSYP: 0, receivedUSD: 0, paidUSD: 0, balanceSYP: 0, balanceUSD: 0 });
      setRangeTotals(totals);
    } else {
      setRangeTotals(null);
    }
  }, [startDate, endDate, aggregates]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">إجمالي أرصدة الصندوق اليومية</h2>
        </div>
        <button onClick={() => window.print()} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 hover:bg-zinc-700 transition-all shadow-lg">
          <Printer className="w-5 h-5" /> طباعة التقرير
        </button>
      </div>

      {/* Stats Summary Area - Enhanced with Range Filter and Detail */}
      <div className="bg-rose-900 border border-rose-800 rounded-2xl overflow-hidden shadow-2xl text-white">
        <div className="flex flex-col md:flex-row border-b border-rose-800">
          {/* Dynamic Logo Section */}
          <div className="p-4 bg-white flex flex-col items-center justify-center min-w-[180px] border-l-2 border-rose-800">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-14 w-auto object-contain mb-1" />
            ) : (
              <div className="text-zinc-900 font-black text-3xl tracking-tighter">SHENO</div>
            )}
            <div className="text-zinc-400 text-[9px] tracking-[0.3em] font-black uppercase">
              {settings?.companyName || 'Sheno Accounting'}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-rose-800">
            {/* Column 1: Date Range Selection */}
            <div className="flex flex-col h-full">
              <div className="bg-rose-800/60 p-2 text-center text-[10px] font-black uppercase tracking-widest border-b border-rose-800 flex items-center justify-center gap-2">
                <Calendar className="w-3 h-3" /> فلترة التاريخ (من - إلى)
              </div>
              <div className="flex-1 p-3 flex flex-col items-center justify-center gap-2 bg-rose-900/30">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-[10px] font-bold opacity-60 w-6">من</span>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-rose-950/50 border border-rose-700/50 rounded-lg px-2 py-1 text-sm font-mono outline-none flex-1 focus:border-white transition-all" 
                  />
                </div>
                <div className="flex items-center gap-2 w-full">
                  <span className="text-[10px] font-bold opacity-60 w-6">إلى</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-rose-950/50 border border-rose-700/50 rounded-lg px-2 py-1 text-sm font-mono outline-none flex-1 focus:border-white transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Detailed Receipts */}
            <div className="flex flex-col h-full">
              <div className="bg-rose-800/60 p-2 text-center text-[10px] font-black uppercase tracking-widest border-b border-rose-800">إجمالي المقبوضات</div>
              <div className="flex-1 p-3 flex flex-col items-center justify-center gap-1">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold opacity-60">{settings?.currency || 'ل.س'}</span>
                  <div className="text-2xl font-mono font-black">{rangeTotals?.receivedSYP.toLocaleString() || '0'}</div>
                </div>
                <div className="w-full h-px bg-rose-800/50 my-1"></div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold opacity-60">$ دولار</span>
                  <div className="text-xl font-mono font-black text-emerald-400">{rangeTotals?.receivedUSD.toLocaleString() || '0'}</div>
                </div>
              </div>
            </div>

            {/* Column 3: Detailed Payments */}
            <div className="flex flex-col h-full">
              <div className="bg-rose-800/60 p-2 text-center text-[10px] font-black uppercase tracking-widest border-b border-rose-800">إجمالي المدفوعات</div>
              <div className="flex-1 p-3 flex flex-col items-center justify-center gap-1">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold opacity-60">{settings?.currency || 'ل.س'}</span>
                  <div className="text-2xl font-mono font-black">{rangeTotals?.paidSYP.toLocaleString() || '0'}</div>
                </div>
                <div className="w-full h-px bg-rose-800/50 my-1"></div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold opacity-60">$ دولار</span>
                  <div className="text-xl font-mono font-black text-rose-300">{rangeTotals?.paidUSD.toLocaleString() || '0'}</div>
                </div>
              </div>
            </div>

            {/* Column 4: Detailed Net Balance */}
            <div className="flex flex-col h-full bg-rose-950/20">
              <div className="bg-rose-800/80 p-2 text-center text-[10px] font-black uppercase tracking-widest border-b border-rose-800">صافي رصيد الصندوق</div>
              <div className="flex-1 p-3 flex flex-col items-center justify-center gap-1">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold opacity-60">{settings?.currency || 'ل.س'}</span>
                  <div className={`text-2xl font-mono font-black ${rangeTotals && rangeTotals.balanceSYP < 0 ? 'text-zinc-100 bg-rose-600 px-3 py-0.5 rounded-full' : 'text-white'}`}>
                    {rangeTotals?.balanceSYP.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="w-full h-px bg-rose-800/50 my-1"></div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold opacity-60">$ دولار</span>
                  <div className={`text-xl font-mono font-black ${rangeTotals && rangeTotals.balanceUSD < 0 ? 'text-rose-300' : 'text-emerald-400'}`}>
                    {rangeTotals?.balanceUSD.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-rose-900 text-white text-[10px] font-black uppercase tracking-widest border-b border-rose-800">
                <th className="p-4 border-l border-rose-800/30">التاريخ</th>
                <th className="p-4 border-l border-rose-800/30 text-center">المقبوضات ({settings?.currency || 'ل.س'})</th>
                <th className="p-4 border-l border-rose-800/30 text-center">المدفوعات ({settings?.currency || 'ل.س'})</th>
                <th className="p-4 border-l border-rose-800/30 text-center font-black">رصيد {settings?.currency || 'ل.س'}</th>
                <th className="p-4 border-l border-rose-800/30 text-center">المقبوضات ($)</th>
                <th className="p-4 border-l border-rose-800/30 text-center">المدفوعات ($)</th>
                <th className="p-4 text-center font-black bg-rose-950/20">رصيد الدولار ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-bold">
              {aggregates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-zinc-400 italic font-bold">لا يوجد حركات مسجلة حالياً في النظام.</td>
                </tr>
              ) : (
                aggregates
                  .filter(a => a.date >= startDate && a.date <= endDate)
                  .map((day, idx) => (
                  <tr key={idx} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-zinc-50/50 dark:bg-zinc-800/10'}`}>
                    <td className="p-4 font-mono font-black text-zinc-500">{day.date}</td>
                    <td className="p-4 text-center font-mono text-zinc-800 dark:text-zinc-200">{day.receivedSYP.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono text-zinc-800 dark:text-zinc-200">{day.paidSYP.toLocaleString()}</td>
                    <td className={`p-4 text-center font-mono font-black ${day.balanceSYP < 0 ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/10' : 'text-readable'}`}>
                      {day.balanceSYP.toLocaleString()}
                    </td>
                    <td className="p-4 text-center font-mono text-emerald-600">{day.receivedUSD.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono text-rose-500">{day.paidUSD.toLocaleString()}</td>
                    <td className={`p-4 text-center font-mono font-black bg-zinc-50 dark:bg-zinc-800/50 ${day.balanceUSD < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {day.balanceUSD.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info Area */}
      <div className="flex flex-col md:flex-row justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-widest px-4 gap-4 no-print">
        <div className="flex items-center gap-2">
          <ArrowLeft className="w-3 h-3" /> المجموع الكلي: {aggregates.filter(a => a.date >= startDate && a.date <= endDate).length} أيام مختارة
        </div>
        <div className="flex flex-wrap gap-6 justify-center">
          <div className="flex gap-2 items-center">
            <span className="opacity-60">إجمالي المقبوضات:</span>
            <span className="text-zinc-600 dark:text-zinc-300 font-mono font-black">{rangeTotals?.receivedSYP.toLocaleString()} ل.س</span>
            <span className="text-emerald-500 font-mono font-black">/ {rangeTotals?.receivedUSD.toLocaleString()} $</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="opacity-60">إجمالي المدفوعات:</span>
            <span className="text-zinc-600 dark:text-zinc-300 font-mono font-black">{rangeTotals?.paidSYP.toLocaleString()} ل.س</span>
            <span className="text-rose-500 font-mono font-black">/ {rangeTotals?.paidUSD.toLocaleString()} $</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyBalancesView;
