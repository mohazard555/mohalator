
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Search, Printer, Filter, Calendar as CalendarIcon, LayoutPanelLeft, Calendar, RotateCcw, FileDown, FileSpreadsheet } from 'lucide-react';
import { StockEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

declare var html2pdf: any;

interface DetailedItemMovementViewProps {
  onBack: () => void;
}

const DetailedItemMovementView: React.FC<DetailedItemMovementViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [moveType, setMoveType] = useState('الكل');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sheno_stock_entries');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  const filtered = entries.filter(e => {
    const matchItem = !itemSearch || e.itemName.includes(itemSearch) || e.itemCode.includes(itemSearch);
    const matchType = moveType === 'الكل' || e.movementType === moveType;
    const matchDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
    return matchItem && matchType && matchDate;
  });

  const totals = filtered.reduce((acc, curr) => {
    if (curr.movementType === 'إدخال') acc.in += curr.quantity;
    if (curr.movementType === 'صرف') acc.out += curr.quantity;
    if (curr.movementType === 'مرتجع') acc.ret += curr.quantity;
    return acc;
  }, { in: 0, out: 0, ret: 0 });

  const handleExportPDF = async () => {
    if (!reportRef.current || isProcessing) return;
    setIsProcessing(true);
    const element = reportRef.current;
    const opt = {
      margin: 0,
      filename: `حركة_مادة_${itemSearch || 'تفصيلي'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 4, 
        useCORS: true, 
        letterRendering: false,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    try {
      await html2pdf().set(opt).from(element).save();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filtered.map(e => ({
      'التاريخ': e.date,
      'المادة': e.itemName,
      'الكود': e.itemCode,
      'الوحدة': e.unit,
      'السعر': e.price,
      'الحركة': e.movementType,
      'الكمية': e.quantity,
      'المستودع': e.warehouse,
      'البيان': e.statement
    }));
    exportToCSV(dataToExport, `حركة_مادة_${itemSearch || 'تفصيلي'}`);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <style>{`
        .consistent-row td {
          font-family: 'Cairo', sans-serif !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          vertical-align: middle;
        }
      `}</style>

      <div className="bg-zinc-900 border-b border-zinc-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl rounded-3xl no-print">
         <div className="bg-primary px-8 py-3 rounded-lg text-white font-black text-xl shadow-lg border border-white/10 uppercase tracking-tight">
           تقرير حركة مادة مفصلة
         </div>
         
         <div className="flex-1 flex flex-col items-center">
            <span className="bg-primary/40 px-4 py-1 rounded-t-lg text-white font-bold text-[10px] uppercase tracking-widest border-x border-t border-primary/50">ادخل اسم المادة أو الكود</span>
            <div className="relative w-full max-w-2xl group">
               <input 
                 type="text" 
                 value={itemSearch} 
                 onChange={e => setItemSearch(e.target.value)}
                 className="bg-white text-zinc-900 border-2 border-primary text-center font-black text-2xl w-full py-3 rounded-xl outline-none shadow-sm transition-all focus:ring-4 focus:ring-primary/20"
                 placeholder="البحث في الحركات..."
               />
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 w-6 h-6" />
            </div>
         </div>

         <button onClick={onBack} className="bg-primary text-white px-8 py-3 rounded-xl font-black shadow-lg flex items-center gap-3 border border-white/10 hover:brightness-110 active:scale-95 transition-all">
            خروج <LayoutPanelLeft className="w-5 h-5" />
         </button>
      </div>

      <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 flex flex-wrap items-center justify-between gap-8 shadow-xl no-print">
         <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
               <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">نوع الحركة</span>
               <select value={moveType} onChange={e => setMoveType(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white p-3 rounded-2xl font-black text-sm outline-none focus:border-primary transition-colors min-w-[200px] appearance-none text-center">
                  <option value="الكل">جميع الحركات</option>
                  <option value="إدخال">إدخال فقط</option>
                  <option value="صرف">صرف فقط</option>
                  <option value="مرتجع">مرتجع فقط</option>
               </select>
            </div>

            <div className="flex items-center gap-3">
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">من تاريخ</span>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white p-3 rounded-2xl text-xs font-mono outline-none focus:border-primary" />
               </div>
               <span className="text-zinc-700 mt-5">←</span>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">إلى تاريخ</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white p-3 rounded-2xl text-xs font-mono outline-none focus:border-primary" />
               </div>
            </div>
         </div>

         <div className="flex flex-wrap gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/20 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[120px] shadow-inner">
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">إجمالي الإدخال</span>
               <span className="font-mono font-black text-xl text-emerald-400">{totals.in.toLocaleString()}</span>
            </div>
            <div className="bg-rose-500/5 border border-rose-500/20 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[120px] shadow-inner">
               <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mb-1">إجمالي الصرف</span>
               <span className="font-mono font-black text-xl text-rose-400">{totals.out.toLocaleString()}</span>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[120px] shadow-inner">
               <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">إجمالي المرتجع</span>
               <span className="font-mono font-black text-xl text-amber-400">{totals.ret.toLocaleString()}</span>
            </div>
         </div>
      </div>

      <div ref={reportRef} className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-2xl print:border-primary print:rounded-none">
         {/* Print Only Header (Inside Ref) */}
         <div className="hidden print:flex flex-row justify-between items-center p-8 bg-zinc-50 border-b-2 border-primary">
            <div className="flex items-center gap-4">
               {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain" alt="Logo" />}
               <div>
                  <h1 className="text-2xl font-black text-zinc-900">{settings?.companyName}</h1>
                  <p className="text-xs text-zinc-500">{settings?.companyType}</p>
               </div>
            </div>
            <div className="text-center">
               <h2 className="text-3xl font-black text-primary underline underline-offset-8">كشف حركة مادة تفصيلي</h2>
               <p className="text-sm mt-3 font-bold">الفترة: <span className="text-primary">{startDate || 'البداية'}</span> إلى <span className="text-primary">{endDate || 'اليوم'}</span></p>
            </div>
            <div className="text-left text-xs font-bold text-zinc-500">
               <p>{settings?.address}</p>
               <p>{new Date().toLocaleDateString('ar-SA')}</p>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
               <thead>
                  <tr className="bg-primary text-white font-black h-14 text-center border-b border-primary/50">
                     <th className="p-2 border-l border-zinc-200 w-32 text-center">التاريخ</th>
                     <th className="p-2 border-l border-zinc-200">الصنف / المادة</th>
                     <th className="p-2 border-l border-zinc-200 w-20 text-center">الوحدة</th>
                     <th className="p-2 border-l border-zinc-200 w-28 text-center">السعر</th>
                     <th className="p-2 border-l border-zinc-200 w-32 text-center">نوع الحركة</th>
                     <th className="p-2 border-l border-zinc-200 w-24 text-center font-black">الكمية</th>
                     <th className="p-2 border-l border-zinc-200 w-40 text-center">المستودع</th>
                     <th className="p-2 text-right pr-6">البيان / الملاحظات</th>
                  </tr>
               </thead>
               <tbody className="bg-white text-zinc-900 divide-y divide-zinc-200">
                  {filtered.length === 0 ? (
                    Array.from({ length: 12 }).map((_, i) => (
                      <tr key={i} className="h-12"><td colSpan={8} className="border-x border-zinc-100"></td></tr>
                    ))
                  ) : (
                    filtered.map(e => (
                      <tr key={e.id} className="h-14 hover:bg-zinc-50 transition-colors consistent-row">
                         <td className="p-2 font-mono text-zinc-400 border-l border-zinc-100 text-center">{e.date}</td>
                         <td className="p-2 text-right pr-6 border-l border-zinc-100 font-black">{e.itemName}</td>
                         <td className="p-2 text-zinc-500 border-l border-zinc-100 text-center">{e.unit}</td>
                         <td className="p-2 font-mono text-zinc-600 border-l border-zinc-100 text-center">{e.price.toLocaleString()}</td>
                         <td className="p-2 border-l border-zinc-100 text-center">
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${
                              e.movementType === 'إدخال' ? 'bg-emerald-500/10 text-emerald-600' : 
                              e.movementType === 'صرف' ? 'bg-rose-500/10 text-rose-600' : 
                              'bg-amber-500/10 text-amber-600'
                            }`}>
                               {e.movementType}
                            </span>
                         </td>
                         <td className="p-2 font-mono text-xl text-primary border-l border-zinc-100 bg-primary/5 text-center">{e.quantity.toLocaleString()}</td>
                         <td className="p-2 text-zinc-400 border-l border-zinc-100 text-center">{e.warehouse}</td>
                         <td className="p-2 text-right pr-6 text-zinc-500 font-normal italic">{e.statement || '-'}</td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
      
      <div className="flex justify-center no-print pt-6 pb-12 gap-4">
         <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 hover:brightness-110 active:scale-95 transition-all">
            <FileSpreadsheet className="w-6 h-6" /> تصدير Excel
         </button>
         <button onClick={handleExportPDF} disabled={isProcessing} className={`bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 transition-all ${isProcessing ? 'opacity-50' : 'hover:brightness-110 active:scale-95'}`}>
            <FileDown className="w-6 h-6" /> {isProcessing ? 'جاري التحويل...' : 'تصدير نسخة PDF'}
         </button>
         <button onClick={() => window.print()} className="bg-zinc-800 text-white px-10 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 hover:bg-zinc-700 active:scale-95 transition-all">
            <Printer className="w-6 h-6" /> طباعة فورية
         </button>
      </div>
    </div>
  );
};

export default DetailedItemMovementView;
