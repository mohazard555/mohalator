
import React, { useState, useEffect } from 'react';
import { ArrowRight, PieChart, TrendingUp, TrendingDown, Hourglass, Warehouse as WarehouseIcon, FileOutput, Calendar } from 'lucide-react';
import { StockEntry } from '../types';
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

  useEffect(() => {
    const saved = localStorage.getItem('sheno_stock_entries');
    if (saved) setEntries(JSON.parse(saved));
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

  const results = getAnalytics();
  const warehouses = Array.from(new Set(entries.map(e => e.warehouse)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">تحليلات المستودع الذكية</h2>
        </div>
        <div className="flex gap-2">
           <button onClick={() => exportToCSV(results, 'warehouse_analytics')} className="bg-zinc-800 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg">
              <FileOutput className="w-5 h-5" /> تصدير XLSX
           </button>
           <button onClick={() => window.print()} className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-6 py-2 rounded-xl font-bold">طباعة التقرير</button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-6 no-print shadow-sm">
         <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 font-bold flex items-center gap-1"><WarehouseIcon className="w-3 h-3"/> المستودع</label>
            <select 
              value={warehouseFilter} 
              onChange={e => setWarehouseFilter(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-xl outline-none font-bold text-sm min-w-[200px]"
            >
               <option value="الكل">جميع المستودعات</option>
               {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
         </div>
         <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 font-bold flex items-center gap-1"><Calendar className="w-3 h-3"/> النطاق الزمني</label>
            <div className="flex items-center gap-2">
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded-xl outline-none text-xs" />
               <span className="text-zinc-400">←</span>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded-xl outline-none text-xs" />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <button 
          onClick={() => setReportType('MOST_USED')}
          className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${reportType === 'MOST_USED' ? 'border-primary bg-primary/5' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}
        >
          <TrendingUp className={`w-8 h-8 ${reportType === 'MOST_USED' ? 'text-primary' : 'text-zinc-400'}`} />
          <span className="font-bold">المواد الأكثر استخداماً</span>
        </button>
        <button 
          onClick={() => setReportType('LEAST_USED')}
          className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${reportType === 'LEAST_USED' ? 'border-primary bg-primary/5' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}
        >
          <TrendingDown className={`w-8 h-8 ${reportType === 'LEAST_USED' ? 'text-primary' : 'text-zinc-400'}`} />
          <span className="font-bold">المواد الأقل استخداماً</span>
        </button>
        <button 
          onClick={() => setReportType('STAGNANT')}
          className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${reportType === 'STAGNANT' ? 'border-primary bg-primary/5' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}
        >
          <Hourglass className={`w-8 h-8 ${reportType === 'STAGNANT' ? 'text-primary' : 'text-zinc-400'}`} />
          <span className="font-bold">المواد الراكدة</span>
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b border-zinc-200 dark:border-zinc-800">
              <th className="p-4">كود المادة</th>
              <th className="p-4">اسم المادة</th>
              <th className="p-4">المستودع</th>
              <th className="p-4 text-center">إجمالي الاستهلاك</th>
              <th className="p-4 text-center">آخر حركة</th>
              <th className="p-4 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
            {results.map((item, idx) => (
              <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="p-4 font-mono text-primary">{item.code}</td>
                <td className="p-4">{item.name}</td>
                <td className="p-4 text-sm text-zinc-500 flex items-center gap-2">
                   <WarehouseIcon className="w-4 h-4" /> {item.warehouse}
                </td>
                <td className="p-4 text-center font-mono text-lg">{item.usage.toLocaleString()}</td>
                <td className="p-4 text-center font-mono text-xs text-zinc-400">{item.lastMove}</td>
                <td className="p-4 text-center">
                   {reportType === 'STAGNANT' ? (
                     <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-[10px] font-black border border-rose-500/20">راكدة</span>
                   ) : (
                     <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/20">نشطة</span>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WarehouseAnalyticsView;
