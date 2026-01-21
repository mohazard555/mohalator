
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Search, FileDown, Calendar, Truck, Package } from 'lucide-react';
import { PurchaseInvoice, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

interface PurchaseHistoryViewProps {
  onBack: () => void;
}

const PurchaseHistoryView: React.FC<PurchaseHistoryViewProps> = ({ onBack }) => {
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('sheno_purchases');
    if (saved) setPurchases(JSON.parse(saved));
  }, []);

  const filtered = purchases.filter(p => {
    const matchSearch = p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       p.invoiceNumber.includes(searchTerm);
    const matchDate = (!startDate || p.date >= startDate) && (!endDate || p.date <= endDate);
    return matchSearch && matchDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">سجل المشتريات والتوريد</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(filtered, 'purchase_history')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
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
            placeholder="بحث باسم المورد أو رقم الفاتورة..."
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 pr-12 outline-none font-bold text-readable"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700">
           <Calendar className="w-4 h-4 text-zinc-400" />
           <span className="text-[10px] font-black text-zinc-500 uppercase">من</span>
           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-readable" />
           <span className="text-[10px] font-black text-zinc-500 uppercase">إلى</span>
           <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-readable" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest border-b border-zinc-700 h-12">
                <th className="p-4 border-l border-zinc-800 text-center w-24">رقم الفاتورة</th>
                <th className="p-4 border-l border-zinc-800 text-center w-32">التاريخ</th>
                <th className="p-4 border-l border-zinc-800">المورد</th>
                <th className="p-4 border-l border-zinc-800">تفاصيل المواد (كمية / وحدة)</th>
                <th className="p-4 border-l border-zinc-800 text-center w-40">إجمالي المبلغ</th>
                <th className="p-4 text-center w-40">المدفوع نقداً</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center italic text-zinc-400">لا يوجد سجلات مشتريات تطابق البحث</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 text-amber-600 font-black text-center font-mono">#{p.invoiceNumber}</td>
                  <td className="p-4 font-mono text-zinc-400 text-center">{p.date}</td>
                  <td className="p-4 text-readable">{p.supplierName}</td>
                  <td className="p-4">
                     <div className="flex flex-col gap-1">
                        {p.items.map((it, i) => (
                           <div key={i} className="text-xs text-zinc-500 font-normal flex items-center gap-2">
                              <Package className="w-3 h-3 text-zinc-300" />
                              <span className="font-bold text-readable">{it.name}</span>
                              <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-600">{it.quantity} {it.unit}</span>
                           </div>
                        ))}
                     </div>
                  </td>
                  <td className="p-4 text-center font-black text-rose-600 font-mono text-lg">{p.totalAmount.toLocaleString()}</td>
                  <td className="p-4 text-center font-black text-emerald-600 font-mono text-lg">{p.paidAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistoryView;
