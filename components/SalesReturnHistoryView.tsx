
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Search, FileDown, Clock, Calendar, Package } from 'lucide-react';
import { exportToCSV } from '../utils/export';
import { AppSettings } from '../types';

interface SalesReturnHistoryViewProps {
  onBack: () => void;
}

const SalesReturnHistoryView: React.FC<SalesReturnHistoryViewProps> = ({ onBack }) => {
  const [returns, setReturns] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const savedReturns = localStorage.getItem('sheno_sales_returns');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedReturns) setReturns(JSON.parse(savedReturns));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const filtered = returns.filter(ret => {
    const matchSearch = ret.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       ret.invoiceNumber.includes(searchTerm);
    const matchDate = (!startDate || ret.date >= startDate) && (!endDate || ret.date <= endDate);
    return matchSearch && matchDate;
  });

  const totalFilteredPieces = filtered.reduce((sum, ret) => sum + ret.items.reduce((s: number, i: any) => s + i.quantity, 0), 0);
  const totalFilteredAmount = filtered.reduce((sum, ret) => sum + (ret.totalReturnAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* الترويسة الخاصة بالطباعة فقط */}
      <div className="print-only print-header flex justify-between items-center bg-rose-900 p-6 rounded-t-xl text-white mb-0 border-b-0">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
          <div>
            <h1 className="text-2xl font-black">{settings?.companyName}</h1>
            <p className="text-xs opacity-80">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black underline decoration-white/30 underline-offset-8">سجل مرتجعات المبيعات المفلتر</h2>
          <div className="flex flex-col gap-1 justify-center mt-2">
            <div className="flex gap-4 justify-center">
              <p className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded text-white">إجمالي قطع المرتجع: {totalFilteredPieces.toLocaleString()}</p>
              <p className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded text-white">إجمالي قيمة المرتجع: {totalFilteredAmount.toLocaleString()} {settings?.currencySymbol}</p>
            </div>
          </div>
          <p className="text-[9px] mt-2 opacity-80 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3"/> تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}
          </p>
        </div>
        <div className="text-left text-xs font-bold space-y-1">
          <p>{settings?.address}</p>
          <p>{startDate || 'البداية'} ← {endDate || 'اليوم'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">سجل مرتجعات المبيعات والتحليل</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(filtered, 'sales_returns_history')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
          <button onClick={() => window.print()} className="bg-rose-100 text-rose-700 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-rose-200 transition-all hover:bg-rose-200">
             <Printer className="w-5 h-5" /> طباعة السجل المفلتر
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 items-center no-print shadow-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث برقم الفاتورة أو اسم الزبون..."
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 pr-12 outline-none font-bold text-readable focus:border-rose-900"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700">
           <Calendar className="w-4 h-4 text-zinc-400" />
           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">من</span>
           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-readable" />
           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إلى</span>
           <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-readable" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl print:border-rose-900 print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-[10px]">
            <thead>
              <tr className="bg-rose-900 text-white font-black uppercase tracking-tighter border-b border-rose-950 h-14 print:bg-rose-900 print:text-white">
                <th className="p-3 border-l border-rose-800 text-center w-12">تسلسل</th>
                <th className="p-3 border-l border-rose-800 text-center w-16">رقم الفاتورة</th>
                <th className="p-3 border-l border-rose-800 text-center w-20">تاريخ المرتجع</th>
                <th className="p-3 border-l border-rose-800 text-center">العميل</th>
                <th className="p-3 border-l border-rose-800 text-right w-64">الأصناف المرتجعة</th>
                <th className="p-3 border-l border-rose-800 text-center w-12">العدد</th>
                <th className="p-3 border-l border-rose-800 text-center w-24">إجمالي القيمة</th>
                <th className="p-3 border-l border-rose-800 text-right w-64">التفقيط</th>
                <th className="p-3 border-l border-rose-800 text-center w-16">وقت</th>
                <th className="p-3 text-right">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold print:divide-zinc-300">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="p-16 text-center italic text-zinc-400 font-bold">لا يوجد سجلات مرتجعات مبيعات تطابق الفلترة</td></tr>
              ) : (
                <>
                  {filtered.map((ret, idx) => (
                    <tr key={ret.id} className="hover:bg-rose-50 dark:hover:bg-zinc-800/30 transition-colors h-12">
                      <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-400">{filtered.length - idx}</td>
                      <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center text-rose-700 font-black">#{ret.invoiceNumber}</td>
                      <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono">{ret.date}</td>
                      <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-readable truncate max-w-[120px]">{ret.customerName}</td>
                      <td className="p-3 border-l border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-col gap-1 max-h-16 overflow-y-auto">
                          {ret.items.map((it: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-[9px]">
                               {it.image && <img src={it.image} className="w-5 h-5 rounded-sm object-cover border" />}
                               <span className="truncate">• {it.name} <span className="opacity-50 font-normal">({it.quantity})</span></span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono font-black text-rose-700">
                        {ret.items.reduce((s: number,i: any) => s + i.quantity, 0)}
                      </td>
                      <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-black text-rose-600 font-mono text-xs bg-rose-50/30 dark:bg-rose-950/10 print:bg-transparent">
                        {ret.totalReturnAmount.toLocaleString()}
                      </td>
                      <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-[9px] font-normal text-zinc-500 leading-tight">
                        {ret.totalAmountLiteral}
                      </td>
                      <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-[8px] text-zinc-400">
                        <div className="flex items-center justify-center gap-1"><Clock className="w-2.5 h-2.5"/> {ret.time || '--:--'}</div>
                      </td>
                      <td className="p-3 text-zinc-400 font-normal italic truncate max-w-[100px]">
                        {ret.notes || '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-50 dark:bg-zinc-800 h-14 border-t-2 border-rose-900">
                    <td colSpan={5} className="p-3 text-center font-black uppercase tracking-[0.2em] text-zinc-500">إجمالي المرتجعات المفلترة</td>
                    <td className="p-3 text-center font-mono font-black text-rose-700 text-sm">{totalFilteredPieces.toLocaleString()}</td>
                    <td className="p-3 text-center font-mono font-black text-rose-700 text-sm bg-rose-100/50 dark:bg-rose-900/30">
                      {totalFilteredAmount.toLocaleString()} {settings?.currencySymbol}
                    </td>
                    <td colSpan={3} className="p-3"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReturnHistoryView;
