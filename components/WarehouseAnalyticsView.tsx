
import React, { useState, useEffect } from 'react';
import { ArrowRight, PieChart, TrendingUp, TrendingDown, Hourglass, Warehouse as WarehouseIcon, FileOutput, Calendar, Printer, Building2, MapPin, Phone } from 'lucide-react';
import { StockEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

interface WarehouseAnalyticsViewProps {
  onBack: () => void;
}

const WarehouseAnalyticsView: React.FC<WarehouseAnalyticsViewProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [reportType, setReportType] = useState<'MOST_USED' | 'LEAST_USED' | 'STAGNANT'>('MOST_USED');
  const [warehouseFilter, setWarehouseFilter] = useState('الكل');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sheno_stock_entries');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (saved) setEntries(JSON.parse(saved));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const getAnalytics = () => {
    const itemMap = new Map<string, { name: string, usage: number, lastMove: string, warehouse: string }>();
    
    entries.forEach(e => {
      const matchWarehouse = warehouseFilter === 'الكل' || e.warehouse === warehouseFilter;
      const matchDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
      
      if (!matchWarehouse || !matchDate) return;
      
      const current = itemMap.get(e.itemCode) || { name: e.itemName, usage: 0, lastMove: e.date, warehouse: e.warehouse };
      
      if (e.movementType === 'صرف') {
        current.usage += e.quantity;
      }
      
      if (new Date(e.date) > new Date(current.lastMove)) {
        current.lastMove = e.date;
      }
      
      itemMap.set(e.itemCode, current);
    });

    const data = Array.from(itemMap.entries()).map(([code, info]) => ({ code, ...info }));

    if (reportType === 'MOST_USED') return data.sort((a, b) => b.usage - a.usage);
    if (reportType === 'LEAST_USED') return data.filter(d => d.usage > 0).sort((a, b) => a.usage - b.usage);
    if (reportType === 'STAGNANT') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return data.filter(d => new Date(d.lastMove) < thirtyDaysAgo);
    }
    return data;
  };

  const getReportTitleAr = () => {
    if (reportType === 'MOST_USED') return 'تقرير المواد الأكثر استخداماً ومبيعاً';
    if (reportType === 'LEAST_USED') return 'تقرير المواد الأقل حركة واستخداماً';
    if (reportType === 'STAGNANT') return 'تقرير المواد الراكدة (التي لم تتحرك منذ فترة)';
    return 'تحليلات المخزون';
  };

  const results = getAnalytics();
  const warehouses = Array.from(new Set(entries.map(e => e.warehouse)));

  return (
    <div className="space-y-6">
      {/* Print Only Smart Header */}
      <div className="print-only print-header flex justify-between items-center bg-white p-6 rounded-t-xl text-zinc-900 mb-0 border-b-4 border-zinc-200">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg border border-zinc-100" />}
          <div>
            <h1 className="text-2xl font-black text-rose-900">{settings?.companyName}</h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{settings?.companyType}</p>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black underline decoration-zinc-100 underline-offset-8">{getReportTitleAr()}</h2>
          <div className="flex flex-col items-center gap-1">
             <div className="flex items-center gap-4 bg-zinc-50 px-4 py-1.5 rounded-full border border-zinc-100">
                <span className="text-[10px] font-black text-zinc-400">المستودع: <span className="text-rose-900">{warehouseFilter}</span></span>
                <div className="w-px h-3 bg-zinc-200"></div>
                <span className="text-[10px] font-black text-zinc-400">الفترة: <span className="text-rose-900">{startDate || 'البداية'} ← {endDate || 'اليوم'}</span></span>
             </div>
             <p className="text-[9px] font-bold text-zinc-400 flex items-center justify-center gap-1">
                <Calendar className="w-3 h-3"/> تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}
             </p>
          </div>
        </div>

        <div className="text-left text-xs font-bold text-zinc-500 space-y-1">
          <p className="flex items-center justify-end gap-1">{settings?.address} <MapPin className="w-3 h-3 opacity-30"/></p>
          <p className="flex items-center justify-end gap-1" dir="ltr">{settings?.phone} <Phone className="w-3 h-3 opacity-30"/></p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">تحليلات المستودع الذكية</h2>
        </div>
        <div className="flex gap-2">
           <button onClick={() => exportToCSV(results, 'warehouse_analytics')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-zinc-700">
              <FileOutput className="w-5 h-5" /> تصدير XLSX
           </button>
           <button onClick={() => window.print()} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
              <Printer className="w-5 h-5" /> طباعة التحليل
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-6 no-print shadow-sm">
         <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 font-black flex items-center gap-1 uppercase tracking-widest"><WarehouseIcon className="w-3 h-3 text-primary"/> المستودع المستهدف</label>
            <select 
              value={warehouseFilter} 
              onChange={e => setWarehouseFilter(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-2xl outline-none font-bold text-sm min-w-[220px] focus:border-primary transition-all"
            >
               <option value="الكل">جميع المستودعات</option>
               {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
         </div>
         <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 font-black flex items-center gap-1 uppercase tracking-widest"><Calendar className="w-3 h-3 text-primary"/> النطاق الزمني للتحليل</label>
            <div className="flex items-center gap-3">
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-2xl outline-none text-xs font-mono font-bold" />
               <span className="text-zinc-400">←</span>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-2xl outline-none text-xs font-mono font-bold" />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <button 
          onClick={() => setReportType('MOST_USED')}
          className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-3 shadow-lg ${reportType === 'MOST_USED' ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}
        >
          <div className={`p-4 rounded-3xl ${reportType === 'MOST_USED' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
            <TrendingUp className="w-8 h-8" />
          </div>
          <span className="font-black text-lg">المواد الأكثر استخداماً</span>
          <p className="text-[10px] text-zinc-400 font-bold leading-relaxed">الأصناف الذهبية التي تحقق أعلى معدلات صرف ومبيع خلال الفترة.</p>
        </button>
        
        <button 
          onClick={() => setReportType('LEAST_USED')}
          className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-3 shadow-lg ${reportType === 'LEAST_USED' ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}
        >
          <div className={`p-4 rounded-3xl ${reportType === 'LEAST_USED' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
            <TrendingDown className="w-8 h-8" />
          </div>
          <span className="font-black text-lg">المواد الأقل استخداماً</span>
          <p className="text-[10px] text-zinc-400 font-bold leading-relaxed">أصناف ذات حركة منخفضة قد تتطلب مراجعة أو خطط ترويجية.</p>
        </button>

        <button 
          onClick={() => setReportType('STAGNANT')}
          className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-3 shadow-lg ${reportType === 'STAGNANT' ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}
        >
          <div className={`p-4 rounded-3xl ${reportType === 'STAGNANT' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
            <Hourglass className="w-8 h-8" />
          </div>
          <span className="font-black text-lg">المواد الراكدة</span>
          <p className="text-[10px] text-zinc-400 font-bold leading-relaxed">أصناف متوقفة تماماً عن الحركة منذ أكثر من 30 يوماً.</p>
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl print:border-zinc-200 print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest border-b border-zinc-700 h-14 print:bg-zinc-100 print:text-black print:border-zinc-300">
                <th className="p-4 border-l border-zinc-700 print:border-zinc-300">كود المادة</th>
                <th className="p-4 border-l border-zinc-700 print:border-zinc-300">اسم المادة / الصنف</th>
                <th className="p-4 border-l border-zinc-700 print:border-zinc-300">المستودع</th>
                <th className="p-4 text-center border-l border-zinc-700 print:border-zinc-300">إجمالي الاستهلاك</th>
                <th className="p-4 text-center border-l border-zinc-700 print:border-zinc-300">آخر حركة مسجلة</th>
                <th className="p-4 text-center">حالة التحليل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold print:text-zinc-900 print:divide-zinc-300">
              {results.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center italic text-zinc-300 font-black text-lg">لا توجد بيانات متوفرة تتوافق مع هذه الفلاتر</td></tr>
              ) : results.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors h-14">
                  <td className="p-4 font-mono text-primary font-black border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-200">{item.code}</td>
                  <td className="p-4 text-readable border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-200">{item.name}</td>
                  <td className="p-4 text-xs text-zinc-500 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-200">
                     <div className="flex items-center gap-2">
                        <WarehouseIcon className="w-3.5 h-3.5 text-zinc-300" /> {item.warehouse}
                     </div>
                  </td>
                  <td className="p-4 text-center font-mono text-2xl font-black bg-zinc-50/50 dark:bg-zinc-800/50 text-rose-700 dark:text-rose-400 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-200 print:bg-transparent">
                    {item.usage.toLocaleString()}
                  </td>
                  <td className="p-4 text-center font-mono text-xs text-zinc-400 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-200">{item.lastMove}</td>
                  <td className="p-4 text-center">
                     {reportType === 'STAGNANT' ? (
                       <span className="bg-rose-500/10 text-rose-600 px-4 py-1.5 rounded-full text-[9px] font-black border border-rose-200 print:border-none print:p-0">بضاعة راكدة</span>
                     ) : (
                       <span className="bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-full text-[9px] font-black border border-emerald-200 print:border-none print:p-0">بضاعة نشطة</span>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Print Only Footer */}
        <div className="print-only mt-10 p-10 border-t border-zinc-200 flex justify-between items-end text-[10px] font-black text-zinc-400">
           <div className="flex flex-col gap-1">
              <span>SAMLATOR SECURED ANALYTICS LOG V4.1</span>
              <span>تاريخ الطباعة: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="text-center">
              <div className="w-48 border-b-2 border-zinc-200 mb-2 mx-auto"></div>
              <span>اعتماد مدير المستودع</span>
           </div>
        </div>
      </div>
      
      <div className="text-center py-10 no-print">
         <div className="flex items-center justify-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-zinc-400" />
            <span className="text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-[0.3em] text-[10px]">{settings?.companyName} - قسم تحليلات البيانات المستودعية</span>
         </div>
         <p className="text-zinc-400 text-[9px] font-bold italic">نظام شينو لإدارة الأعمال © 2025 - جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
};

export default WarehouseAnalyticsView;
