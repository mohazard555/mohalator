
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Archive, RefreshCcw, TrendingUp, TrendingDown, DollarSign, FileSpreadsheet, ImageIcon } from 'lucide-react';
import { CashEntry } from '../types';
import { exportToCSV } from '../utils/export';
import { ImageExportService } from '../utils/ImageExportService';

interface ProfitLossReportViewProps {
  onBack: () => void;
}

interface MonthlyStats {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

const ProfitLossReportView: React.FC<ProfitLossReportViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [isExportingImage, setIsExportingImage] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sheno_cash_journal');
    if (saved) {
      const entries: CashEntry[] = JSON.parse(saved);
      const yearEntries = entries.filter(e => e.date.startsWith(selectedYear.toString()));
      
      const months = Array.from({ length: 12 }, (_, i) => {
        const monthNum = (i + 1).toString().padStart(2, '0');
        const monthEntries = yearEntries.filter(e => e.date.split('-')[1] === monthNum);
        
        const rev = monthEntries.reduce((s, c) => s + (c.receivedSYP || 0), 0);
        const exp = monthEntries.reduce((s, c) => s + (c.paidSYP || 0), 0);
        
        return {
          month: new Intl.DateTimeFormat('ar-SA', { month: 'long' }).format(new Date(selectedYear, i)),
          revenue: rev,
          expenses: exp,
          profit: rev - exp
        };
      });
      setMonthlyData(months);
    }
  }, [selectedYear]);

  const handleArchiveYear = () => {
    if (window.confirm(`هل أنت متأكد من أرشفة أرصدة سنة ${selectedYear} والبدء بسنة مالية جديدة؟ سيتم نقل كافة البيانات إلى قسم الأرشيف.`)) {
      const fullData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sheno_') && key !== 'sheno_archives' && key !== 'sheno_settings') {
          fullData[key] = JSON.parse(localStorage.getItem(key) || '{}');
        }
      }

      const archiveEntry = {
        id: crypto.randomUUID(),
        archiveDate: new Date().toISOString(),
        title: `إغلاق سنة مالية ${selectedYear}`,
        periodStart: `${selectedYear}-01-01`,
        periodEnd: `${selectedYear}-12-31`,
        data: JSON.stringify(fullData)
      };

      const savedArchives = JSON.parse(localStorage.getItem('sheno_archives') || '[]');
      localStorage.setItem('sheno_archives', JSON.stringify([archiveEntry, ...savedArchives]));
      
      localStorage.removeItem('sheno_cash_journal');
      localStorage.removeItem('sheno_sales_invoices');
      localStorage.removeItem('sheno_stock_entries');
      
      alert('تمت أرشفة السنة المالية بنجاح وبدء دورة مالية جديدة.');
      window.location.reload();
    }
  };

  const handleExportExcel = () => {
    const data = monthlyData.map(m => ({
      'الشهر': m.month,
      'الإيرادات (مقبوضات)': m.revenue,
      'المصاريف (مدفوعات)': m.expenses,
      'صافي الربح/الخسارة': m.profit,
      'الحالة': m.profit > 0 ? 'ربح' : m.profit < 0 ? 'خسارة' : 'تعادل'
    }));

    exportToCSV(data, `ميزان_مراجعة_أرباح_${selectedYear}`);
  };

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    setIsExportingImage(true);
    try {
      await ImageExportService.exportAsPng(
        reportRef.current,
        `تقرير_الأرباح_السنوي_${selectedYear}`
      );
    } finally {
      setIsExportingImage(false);
    }
  };

  const totalRev = monthlyData.reduce((s, c) => s + c.revenue, 0);
  const totalExp = monthlyData.reduce((s, c) => s + c.expenses, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">ميزان المراجعة والأرباح الشهرية</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
            <FileSpreadsheet className="w-5 h-5" /> تصدير Excel
          </button>
          <button 
            onClick={handleExportImage} 
            disabled={isExportingImage}
            className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isExportingImage ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ImageIcon className="w-5 h-5" />}
            حفظ كصورة
          </button>
          <button onClick={handleArchiveYear} className="bg-rose-900 hover:brightness-110 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
            <Archive className="w-5 h-5" /> أرشفة وإغلاق السنة
          </button>
          <button onClick={() => window.print()} className="bg-zinc-100 dark:bg-zinc-800 text-readable px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-zinc-200 dark:border-zinc-700">
            <Printer className="w-5 h-5" /> طباعة
          </button>
        </div>
      </div>

      {/* Report Area Container with Ref for Image Export */}
      <div ref={reportRef} className="space-y-8 bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] export-fix print:p-0">
        
        <div className="print-only mb-6 border-b-4 border-zinc-200 pb-6 flex justify-between items-center text-black">
          <h1 className="text-3xl font-black">تقرير ميزان المراجعة والأرباح</h1>
          <div className="text-left font-bold">
            <p className="text-xl">العام المالي: {selectedYear}</p>
            <p className="text-xs text-zinc-400">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-3xl flex flex-col items-center text-center">
            <TrendingUp className="w-10 h-10 text-emerald-500 mb-2" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إجمالي الإيرادات (السنوية)</span>
            <span className="text-3xl font-mono font-black text-emerald-600">{totalRev.toLocaleString()}</span>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-3xl flex flex-col items-center text-center">
            <TrendingDown className="w-10 h-10 text-rose-500 mb-2" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إجمالي المصاريف (السنوية)</span>
            <span className="text-3xl font-mono font-black text-rose-600">{totalExp.toLocaleString()}</span>
          </div>
          <div className={`p-8 rounded-3xl flex flex-col items-center text-center border ${totalRev - totalExp >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
            <DollarSign className={`w-10 h-10 mb-2 ${totalRev - totalExp >= 0 ? 'text-blue-500' : 'text-amber-500'}`} />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">صافي الربح / الخسارة</span>
            <span className={`text-3xl font-mono font-black ${totalRev - totalExp >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
              {(totalRev - totalExp).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl print:border-zinc-300 print:shadow-none">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center no-print">
            <h3 className="font-black text-readable">توزيع الأرباح حسب الأشهر لعام {selectedYear}</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-zinc-400">تغيير السنة:</span>
              <input 
                type="number" 
                value={selectedYear} 
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-4 py-1.5 rounded-xl font-mono font-bold outline-none w-32 text-center"
              />
            </div>
          </div>
          <div className="p-6 hidden print:block bg-zinc-50 border-b border-zinc-200">
             <h3 className="text-xl font-black text-black">كشف توزيع الأرباح الشهري - عام {selectedYear}</h3>
          </div>
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 print:bg-zinc-100 print:text-black">
                <th className="p-4">الشهر</th>
                <th className="p-4 text-center">المقبوضات (إيراد)</th>
                <th className="p-4 text-center">المدفوعات (مصاريف)</th>
                <th className="p-4 text-center">صافي الربح الشهري</th>
                <th className="p-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-bold print:text-black">
              {monthlyData.map((m, i) => (
                <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 text-readable">{m.month}</td>
                  <td className="p-4 text-center font-mono text-emerald-600">{m.revenue.toLocaleString()}</td>
                  <td className="p-4 text-center font-mono text-rose-600">{m.expenses.toLocaleString()}</td>
                  <td className={`p-4 text-center font-mono text-lg ${m.profit >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {m.profit.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    {m.profit > 0 ? (
                      <span className="text-[9px] font-black uppercase px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20 print:border-none print:p-0 print:text-blue-700">ربح</span>
                    ) : m.profit < 0 ? (
                      <span className="text-[9px] font-black uppercase px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 print:border-none print:p-0 print:text-amber-700">خسارة</span>
                    ) : (
                      <span className="text-[9px] font-black uppercase px-2 py-1 bg-zinc-500/10 text-zinc-500 rounded-full border border-zinc-500/20 print:border-none print:p-0">متعادل</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="print-only mt-10 pt-6 border-t border-zinc-200 flex justify-between items-end text-[10px] font-black text-zinc-400">
           <div className="flex flex-col">
              <span>SAMLATOR SYSTEM | FINANCIAL LOGS TERMINAL</span>
              <span>تاريخ الطباعة: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="text-center">
              <div className="w-32 border-b-2 border-zinc-200 mb-1 mx-auto"></div>
              <span>توقيع مدير الحسابات</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossReportView;
