
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Search, FileDown, Calendar, RotateCcw, Package, FileText, ShoppingBag, MapPin, Phone, Edit2 } from 'lucide-react';
import { exportToCSV } from '../utils/export';
import { AppSettings } from '../types';

interface PurchaseReturnHistoryViewProps {
  onBack: () => void;
  onEdit: (ret: any) => void;
}

const PurchaseReturnHistoryView: React.FC<PurchaseReturnHistoryViewProps> = ({ onBack, onEdit }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [returns, setReturns] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sheno_purchase_returns');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (saved) setReturns(JSON.parse(saved));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const filtered = returns.filter(ret => {
    const matchSearch = (ret.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (ret.invoiceNumber || '').includes(searchTerm);
    const matchDate = (!startDate || ret.date >= startDate) && (!endDate || ret.date <= endDate);
    return matchSearch && matchDate;
  });

  const totalReturnAmount = filtered.reduce((s, c) => s + (c.totalReturnAmount || 0), 0);
  const totalItemsCount = filtered.reduce((sum, ret) => sum + ret.items.reduce((s: number, i: any) => s + i.quantity, 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors shadow-sm">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">سجل مرتجعات المشتريات</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(filtered, 'purchase_returns_history')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
          <button onClick={() => window.print()} className="bg-amber-600 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
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

      <div ref={reportRef} className="bg-white dark:bg-zinc-950 p-4 md:p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl export-fix print:border-amber-600 print:rounded-none">
        
        {/* ترويسة احترافية للطباعة فقط */}
        <div className="hidden print:flex flex-row justify-between items-start mb-8 border-b-4 border-amber-600 pb-6 bg-white text-zinc-900">
          <div className="flex items-center gap-4">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="w-20 h-20 object-contain bg-white rounded-xl p-1" alt="Logo" />
            ) : (
               <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">SH</div>
            )}
            <div>
              <h1 className="text-3xl font-black text-amber-700 leading-none">{settings?.companyName || 'Finexa System'}</h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{settings?.companyType}</p>
            </div>
          </div>
          <div className="text-center pt-2">
            <h2 className="text-3xl font-black text-zinc-900 underline decoration-amber-600/20 underline-offset-8">سجل مرتجع المشتريات والتوريد</h2>
            <div className="flex flex-col items-center gap-1 mt-4">
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">فترة التقرير المحددة</span>
               <div className="bg-zinc-50 border border-zinc-200 px-6 py-1 rounded-full flex items-center gap-3">
                  <span className="font-mono font-black text-xs">{startDate || 'بداية السجلات'}</span>
                  <span className="text-zinc-300 font-bold">←</span>
                  <span className="font-mono font-black text-xs">{endDate || 'اليوم الحاضر'}</span>
               </div>
            </div>
          </div>
          <div className="text-left space-y-1 pt-2">
             <div className="flex items-center justify-end gap-2 text-zinc-500 text-xs font-bold">
                <span>{settings?.address}</span>
                <MapPin className="w-3 h-3 text-amber-600" />
             </div>
             <div className="flex items-center justify-end gap-2 text-zinc-500 text-xs font-bold" dir="ltr">
                <Phone className="w-3 h-3 text-amber-600" />
                <span>{settings?.phone}</span>
             </div>
             <div className="text-[9px] font-black text-zinc-400 uppercase pt-4 flex items-center justify-end gap-2">
                <span>تاريخ الاستخراج:</span>
                <span>{new Date().toLocaleDateString('ar-SA')}</span>
             </div>
          </div>
        </div>

        {/* ملخص الإجماليات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:mb-6">
           <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-3xl flex flex-col items-center text-center shadow-sm print:bg-transparent">
              <Package className="w-8 h-8 text-amber-600 mb-2 no-print" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إجمالي كمية المواد المرتجعة</span>
              <span className="text-3xl font-mono font-black text-amber-700">{totalItemsCount.toLocaleString()}</span>
           </div>
           <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-3xl flex flex-col items-center text-center shadow-sm print:bg-transparent">
              <ShoppingBag className="w-8 h-8 text-emerald-600 mb-2 no-print" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إجمالي القيمة المستردة</span>
              <span className="text-3xl font-mono font-black text-emerald-700">
                {totalReturnAmount.toLocaleString()} 
                <span className="text-sm font-bold mr-2 text-zinc-400">{settings?.currencySymbol}</span>
              </span>
           </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm print:border-zinc-300 print:rounded-none">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-amber-600 text-white font-black uppercase tracking-widest border-b border-amber-700 h-14 print:bg-zinc-100 print:text-black print:border-zinc-300">
                  <th className="p-4 border-l border-amber-700 w-28 text-center print:border-zinc-300">تاريخ المرتجع</th>
                  <th className="p-4 border-l border-amber-700 w-24 text-center print:border-zinc-300">الفاتورة الأصل</th>
                  <th className="p-4 border-l border-amber-700 print:border-zinc-300">المورد</th>
                  <th className="p-4 border-l border-amber-700 print:border-zinc-300">المواد المعادة (الكمية / الوحدة)</th>
                  <th className="p-4 text-center w-40 font-black text-base bg-amber-700/10 print:bg-zinc-50">المبلغ المسترد</th>
                  <th className="p-4 text-center w-20 no-print">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold print:text-zinc-900">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-32 text-center italic text-zinc-300 font-black text-2xl uppercase tracking-tighter">لا يوجد سجلات مرتجعات مشتريات تطابق البحث</td></tr>
                ) : filtered.map(ret => (
                  <tr key={ret.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors h-14 print:hover:bg-white border-b print:border-zinc-100">
                    <td className="p-4 font-mono text-zinc-400 text-center border-l border-zinc-100 print:border-zinc-100">{ret.date}</td>
                    <td className="p-4 text-amber-700 font-black text-center font-mono border-l border-zinc-100 print:border-zinc-100">#{ret.invoiceNumber}</td>
                    <td className="p-4 text-readable border-l border-zinc-100 print:border-zinc-100">{ret.supplierName}</td>
                    <td className="p-4 border-l border-zinc-100 print:border-zinc-100">
                       <div className="flex flex-col gap-1">
                          {ret.items.map((it: any, i: number) => (
                             <div key={i} className="text-xs text-zinc-500 font-normal flex items-center gap-2">
                                <Package className="w-3 h-3 text-zinc-300" />
                                <span className="font-bold text-readable">{it.name}</span>
                                <span className="bg-zinc-50 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-700">{it.quantity} {it.unit}</span>
                             </div>
                          ))}
                       </div>
                    </td>
                    <td className="p-4 text-center font-black text-emerald-600 font-mono text-xl bg-emerald-50/10 print:bg-transparent">
                      {ret.totalReturnAmount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center no-print">
                      <button onClick={() => onEdit(ret)} className="p-2 text-zinc-400 hover:text-amber-500 transition-colors bg-zinc-50 dark:bg-zinc-800 rounded-lg opacity-0 group-hover:opacity-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* تذييل الطباعة الاحترافي */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-8 border-t border-zinc-200 text-[10px] font-black text-zinc-400">
           <div className="flex flex-col gap-1">
              <span>SAMLATOR SYSTEM | SECURED FINANCIAL LOG TERMINAL</span>
              <span>تاريخ استخراج هذا الكشف: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="text-center">
              <div className="w-64 border-b-2 border-zinc-200 mb-2 mx-auto"></div>
              <span>توقيع أمين المستودع / الختم الرسمي</span>
           </div>
           <div className="text-left italic opacity-50">
              {settings?.companyName} Accounting Terminal v4.1
           </div>
        </div>
      </div>

      <div className="flex justify-between items-center no-print px-6 py-8 text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">
         <span>{settings?.companyName} Accounting Terminal v4.1</span>
         <span>SECURED DATA ENCRYPTION | SYRIA 2026</span>
      </div>
    </div>
  );
};

export default PurchaseReturnHistoryView;
