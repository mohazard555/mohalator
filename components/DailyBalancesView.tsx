
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Printer, Calendar, ArrowLeft } from 'lucide-react';
import { CashEntry } from '../types';

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
  const [searchDate, setSearchDate] = useState('');
  const [aggregates, setAggregates] = useState<DayAggregate[]>([]);
  const [selectedDayTotals, setSelectedDayTotals] = useState<DayAggregate | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sheno_cash_journal');
    if (saved) {
      try {
        const entries: CashEntry[] = JSON.parse(saved);
        
        // Group and aggregate by date
        // Fix: Explicitly typing reduce callback to avoid property access on unknown
        const grouped = entries.reduce((acc: Record<string, DayAggregate>, entry: CashEntry) => {
          const date = entry.date;
          if (!acc[date]) {
            acc[date] = { date, receivedSYP: 0, paidSYP: 0, receivedUSD: 0, paidUSD: 0, balanceSYP: 0, balanceUSD: 0 };
          }
          acc[date].receivedSYP += entry.receivedSYP;
          acc[date].paidSYP += entry.paidSYP;
          acc[date].receivedUSD += entry.receivedUSD;
          acc[date].paidUSD += entry.paidUSD;
          acc[date].balanceSYP += (entry.receivedSYP - entry.paidSYP);
          acc[date].balanceUSD += (entry.receivedUSD - entry.paidUSD);
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
    if (searchDate) {
      const match = aggregates.find(a => a.date === searchDate);
      setSelectedDayTotals(match || null);
    } else {
      setSelectedDayTotals(null);
    }
  }, [searchDate, aggregates]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">إجمالي أرصدة الصندوق اليومية</h2>
        </div>
        <button className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-700">
          <Printer className="w-5 h-5" /> طباعة التقرير
        </button>
      </div>

      {/* Stats Summary Area - Matching the red header style in the photo */}
      <div className="bg-rose-900 border border-rose-800 rounded-lg overflow-hidden shadow-xl text-white">
        <div className="flex flex-col md:flex-row border-b border-rose-800">
          {/* Logo Section */}
          <div className="p-4 bg-white flex flex-col items-center justify-center min-w-[150px]">
            <div className="text-zinc-900 font-black text-2xl tracking-tighter">SHENO</div>
            <div className="text-zinc-700 text-[8px] tracking-[0.2em] font-bold">SHENO FOR PRINT</div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-rose-800">
            {/* Column 1: Date Input */}
            <div className="flex flex-col h-full">
              <div className="bg-rose-800/50 p-2 text-center text-sm font-bold border-b border-rose-800">ادخل التاريخ</div>
              <div className="flex-1 p-2 flex items-center justify-center">
                <input 
                  type="date" 
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="bg-transparent border-none text-white text-lg font-mono outline-none text-center" 
                />
              </div>
            </div>

            {/* Column 2: Total Receipts */}
            <div className="flex flex-col h-full">
              <div className="bg-rose-800/50 p-2 text-center text-sm font-bold border-b border-rose-800">المقبوضات</div>
              <div className="flex-1 p-2 flex flex-col items-center justify-center">
                <div className="text-xl font-mono font-bold">{selectedDayTotals?.receivedSYP.toLocaleString() || '0'}</div>
                <div className="text-xs text-rose-200 mt-1">المقبوضات $ : <span className="font-mono">{selectedDayTotals?.receivedUSD.toLocaleString() || '0'}</span></div>
              </div>
            </div>

            {/* Column 3: Total Payments */}
            <div className="flex flex-col h-full">
              <div className="bg-rose-800/50 p-2 text-center text-sm font-bold border-b border-rose-800">المدفوعات</div>
              <div className="flex-1 p-2 flex flex-col items-center justify-center">
                <div className="text-xl font-mono font-bold">{selectedDayTotals?.paidSYP.toLocaleString() || '0'}</div>
                <div className="text-xs text-rose-200 mt-1">المدفوعات $ : <span className="font-mono">{selectedDayTotals?.paidUSD.toLocaleString() || '0'}</span></div>
              </div>
            </div>

            {/* Column 4: Final Balance */}
            <div className="flex flex-col h-full">
              <div className="bg-rose-800/50 p-2 text-center text-sm font-bold border-b border-rose-800">رصيد الخزينة اليومي</div>
              <div className="flex-1 p-2 flex flex-col items-center justify-center">
                <div className={`text-xl font-mono font-bold ${selectedDayTotals && selectedDayTotals.balanceSYP < 0 ? 'text-zinc-900 bg-white px-2 rounded' : ''}`}>
                  {selectedDayTotals?.balanceSYP.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-rose-200 mt-1">رصيد الخزينة اليومي $ : <span className="font-mono">{selectedDayTotals?.balanceUSD.toLocaleString() || '0'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Table */}
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-rose-800 text-white text-xs">
                <th className="p-3 border border-rose-700">التاريخ</th>
                <th className="p-3 border border-rose-700">المقبوضات</th>
                <th className="p-3 border border-rose-700">المدفوعات</th>
                <th className="p-3 border border-rose-700">المقبوضات $</th>
                <th className="p-3 border border-rose-700">المدفوعات $</th>
                <th className="p-3 border border-rose-700">رصيد الخزينة السوري</th>
                <th className="p-3 border border-rose-700">رصيد الخزينة $</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {aggregates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-zinc-500">لا يوجد حركات مسجلة حالياً في دفتر اليومية.</td>
                </tr>
              ) : (
                aggregates
                  .filter(a => !searchDate || a.date === searchDate)
                  .map((day, idx) => (
                  <tr key={idx} className={`hover:bg-rose-900/10 transition-colors ${idx % 2 === 0 ? 'bg-zinc-800' : 'bg-zinc-800/50'}`}>
                    <td className="p-3 font-mono font-bold text-zinc-300">{day.date}</td>
                    <td className="p-3 font-mono text-zinc-100">{day.receivedSYP.toLocaleString()}</td>
                    <td className="p-3 font-mono text-zinc-100">{day.paidSYP.toLocaleString()}</td>
                    <td className="p-3 font-mono text-zinc-100">{day.receivedUSD.toLocaleString()}</td>
                    <td className="p-3 font-mono text-zinc-100">{day.paidUSD.toLocaleString()}</td>
                    <td className={`p-3 font-mono font-bold ${day.balanceSYP < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                      {day.balanceSYP.toLocaleString()}
                    </td>
                    <td className={`p-3 font-mono font-bold ${day.balanceUSD < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {day.balanceUSD.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-xs text-zinc-500 px-2">
        <div>المجموع الكلي للصفحة: {aggregates.length} أيام</div>
        <div className="flex gap-4">
          <span>مجموع المقبوضات ل.س: {aggregates.reduce((s,c) => s + c.receivedSYP, 0).toLocaleString()}</span>
          <span>مجموع المدفوعات ل.س: {aggregates.reduce((s,c) => s + c.paidSYP, 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default DailyBalancesView;
