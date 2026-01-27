
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
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [aggregates, setAggregates] = useState<DayAggregate[]>([]);
  const [rangeTotals, setRangeTotals] = useState<DayAggregate | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    const saved = localStorage.getItem('sheno_cash_journal');
    if (saved) {
      try {
        const entries: CashEntry[] = JSON.parse(saved);
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

        const sorted = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
        setAggregates(sorted);
      } catch (e) {
        console.error("Failed to parse journal data");
      }
    }
  }, []);

  useEffect(() => {
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
            <ArrowRight className="w-6 h-6 text-primary" />
          </button>
          <h2 className="text-2xl font-black text-readable">إجمالي أرصدة الصندوق اليومية</h2>
        </div>
        <button onClick={() => window.print()} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 hover:brightness-110 transition-all shadow-lg">
          <Printer className="w-5 h-5" /> طباعة التقرير
        </button>
      </div>

      {/* Header for print only */}
      <div className="print-only mb-6 border-b-4 border-primary pb-6 flex justify-between items-center bg-white text-black p-4 rounded-xl">
          <div className="flex items-center gap-4">
            {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain" alt="Logo" />}
            <div>
              <h1 className="text-2xl font-black text-primary leading-none">{settings?.companyName}</h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{settings?.companyType}</p>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black underline underline-offset-8 decoration-primary/30">تقرير أرصدة الصندوق اليومية</h2>
            <p className="text-sm mt-3 font-bold">الفترة: <span className="text-primary">{startDate}</span> إلى <span className="text-primary">{endDate}</span></p>
          </div>
          <div className="text-left text-xs font-bold text-zinc-500">
            <p>{settings?.address}</p>
            <p>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>
      </div>

      <div className="bg-primary border border-primary/20 rounded-2xl overflow-hidden shadow-2xl text-white no-print">
        <div className="flex flex-col md:flex-row border-b border-white/10">
          <div className="p-4 bg-white flex flex-col items-center justify-center min-w-[180px] border-l-2 border-primary">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-14 w-auto object-contain mb-1" />
            ) : (
              <div className="text-zinc-900 font-black text-3xl tracking-tighter">SHENO</div>
            )}
            <div className="text-zinc-400 text-[9px] tracking-[0.3em] font-black uppercase">
              {settings?.companyName || 'Sheno Accounting'}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-white/10">
            <div className="flex flex-col h-full">
              <div className="bg-white/10 p-2 text-center text-[10px] font-black uppercase tracking-widest border-b border-white/10 flex items-center justify-center gap-2">
                <Calendar className="w-3 h-3" /> فلترة التاريخ (من - إلى)
              </div>
              <div className="flex-1 p-3 flex flex-col items-center justify-center gap-2 bg-white/5">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-[10px] font-bold opacity-60 w-6">من</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-zinc-900/50 border border-white/20 rounded-lg px-2 py-1 text-sm font-mono outline-none flex-1 focus:border-white" />
                </div>
                <div className="flex items-center gap-2 w-full">
                  <span className="text-[10px] font-bold opacity-60 w-6">إلى</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-zinc-900/50 border border-white/20 rounded-lg px-2 py-1 text-sm font-mono outline-none flex-1 focus:border-white" />
                </div>
              </div>
            </div>

            <div className="flex flex-col h-full">
              <div className="bg-white/10 p-2 text-center text-[10px] font-black uppercase tracking-widest border-b border-white/10">إجمالي المقبوضات</div>
              <div className="flex-1 p-3 flex flex-col items-center justify-center gap-1">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold opacity-60">{settings?.currency}</span>
                  <div className="text-2xl font-mono font-black">{rangeTotals?.receivedSYP.toLocaleString() || '0'}</div>
                </div>
                <div className="w-full h-px bg-white/10 my-1"></div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold opacity-60">$ دولار</span>
                  <div className="text-xl font-mono font-black text-emerald-400">{rangeTotals?.receivedUSD.toLocaleString() || '0'}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col h-full">
              <div className="bg-white/10 p-2 text-center text-[10px] font-black uppercase tracking-widest border-b border-white/10">إجمالي المدفوعات</div>
              <div className="flex-1 p-3 flex flex-col items-center justify-center gap-1">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold opacity-60">{settings?.currency}</span>
                  <div className="text-2xl font-mono font-black">{rangeTotals?.paidSYP.toLocaleString() || '0'}</div>
                </div>
                <div className="w-full h-px bg-white/10 my-1"></div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold opacity-60">$ دولار</span>
                  <div className="text-xl font-mono font-black text-rose-300">{rangeTotals?.paidUSD.toLocaleString() || '0'}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col h-full bg-white/5">
              <div className="bg-white/20 p-2 text-center text-[10px] font-black uppercase tracking-widest border-b border-white/10">صافي رصيد الصندوق</div>
              <div className="flex-1 p-3 flex flex-col items-center justify-center gap-1">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold opacity-60">{settings?.currency}</span>
                  <div className={`text-2xl font-mono font-black ${rangeTotals && rangeTotals.balanceSYP < 0 ? 'text-zinc-100 bg-rose-600 px-3 py-0.5 rounded-full' : 'text-white'}`}>
                    {rangeTotals?.balanceSYP.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="w-full h-px bg-white/10 my-1"></div>
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

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl print:border-zinc-300 print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white text-[10px] font-black uppercase tracking-widest border-b border-primary/20 print:bg-zinc-50 print:text-black">
                <th className="p-4 border-l border-white/10">التاريخ</th>
                <th className="p-4 border-l border-white/10 text-center">المقبوضات ({settings?.currencySymbol})</th>
                <th className="p-4 border-l border-white/10 text-center">المدفوعات ({settings?.currencySymbol})</th>
                <th className="p-4 border-l border-white/10 text-center font-black">رصيد {settings?.currencySymbol}</th>
                <th className="p-4 border-l border-white/10 text-center">المقبوضات ($)</th>
                <th className="p-4 border-l border-white/10 text-center">المدفوعات ($)</th>
                <th className="p-4 text-center font-black bg-white/5">رصيد الدولار ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-bold print:text-black print:divide-zinc-300">
              {aggregates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-zinc-400 italic font-bold">لا يوجد حركات مسجلة حالياً.</td>
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
    </div>
  );
};

export default DailyBalancesView;
