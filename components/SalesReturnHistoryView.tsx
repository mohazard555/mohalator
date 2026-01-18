
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Search, FileDown, Clock, Calendar } from 'lucide-react';
import { exportToCSV } from '../utils/export';

interface SalesReturnHistoryViewProps {
  onBack: () => void;
}

const SalesReturnHistoryView: React.FC<SalesReturnHistoryViewProps> = ({ onBack }) => {
  const [returns, setReturns] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const savedReturns = localStorage.getItem('sheno_sales_returns');
    if (savedReturns) setReturns(JSON.parse(savedReturns));
  }, []);

  const filtered = returns.filter(ret => {
    const matchSearch = ret.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       ret.invoiceNumber.includes(searchTerm);
    const matchDate = (!startDate || ret.date >= startDate) && (!endDate || ret.date <= endDate);
    return matchSearch && matchDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">سجل مرتجعات المبيعات</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(filtered, 'sales_returns_history')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
          <button onClick={() => window.print()} className="bg-zinc-100 dark:bg-zinc-800 text-readable px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border">
             <Printer className="w-5 h-5" /> طباعة السجل
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 items-center no-print shadow-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث برقم الفاتورة أو اسم الزبون..."
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 pr-12 outline-none font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700">
           <Calendar className="w-4 h-4 text-zinc-400" />
           <span className="text-[10px] font-black text-zinc-500 uppercase">من</span>
           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none" />
           <span className="text-[10px] font-black text-zinc-500 uppercase">إلى</span>
           <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-[10px]">
            <thead>
              <tr className="bg-rose-900 text-white font-black uppercase tracking-tighter border-b border-rose-800">
                <th className="p-3 border-l border-rose-800 text-center">تسلسل</th>
                <th className="p-3 border-l border-rose-800 text-center">رقم الفاتورة</th>
                <th className="p-3 border-l border-rose-800 text-center">تاريخ المرتجع</th>
                <th className="p-3 border-l border-rose-800 text-center">العميل</th>
                <th className="p-3 border-l border-rose-800 text-right w-64">الأصناف المرتجعة</th>
                <th className="p-3 border-l border-rose-800 text-center">العدد</th>
                <th className="p-3 border-l border-rose-800 text-center">إجمالي القيمة</th>
                <th className="p-3 border-l border-rose-800 text-right w-64">التفقيط</th>
                <th className="p-3 border-l border-rose-800 text-center">وقت</th>
                <th className="p-3 text-right">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="p-16 text-center italic text-zinc-400">لا يوجد سجلات مرتجعات مبيعات</td></tr>
              ) : (
                filtered.map((ret, idx) => (
                  <tr key={ret.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-400">{filtered.length - idx}</td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center text-rose-600 font-black">#{ret.invoiceNumber}</td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono">{ret.date}</td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-readable">{ret.customerName}</td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-col gap-1">
                        {ret.items.map((it: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                             {it.image && <img src={it.image} className="w-5 h-5 rounded-sm object-cover border" />}
                             <span className="truncate">{it.name} <span className="opacity-50 font-normal">({it.quantity})</span></span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono">
                      {ret.items.reduce((s: number,i: any) => s + i.quantity, 0)}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-black text-rose-600 font-mono text-xs">
                      {ret.totalReturnAmount.toLocaleString()}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-[9px] font-normal text-zinc-500 leading-tight">
                      {ret.totalAmountLiteral}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-[8px] text-zinc-400">
                      <div className="flex items-center justify-center gap-1"><Clock className="w-2.5 h-2.5"/> {ret.time || '--:--'}</div>
                    </td>
                    <td className="p-3 text-zinc-400 font-normal italic">
                      {ret.notes || '-'}
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

export default SalesReturnHistoryView;
