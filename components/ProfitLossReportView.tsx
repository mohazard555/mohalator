
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Archive, RefreshCcw, TrendingUp, TrendingDown, DollarSign, FileSpreadsheet, ImageIcon, Calendar, Building2 } from 'lucide-react';
import { CashEntry, AppSettings } from '../types';
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
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));

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
    if (!reportRef.current || isExportingImage) return;
    setIsExportingImage(true);
    
    // إظهار العناصر المخفية للطباعة مؤقتاً لالتقاطها في الصورة
    const printOnlyElements = reportRef.current.querySelectorAll('.print-only');
    printOnlyElements.forEach((el: any) => {
      el.style.display = 'flex';
      el.style.visibility = 'visible';
    });

    try {
      await ImageExportService.exportAsPng(
        reportRef.current,
        `ميزان_المراجعة_${selectedYear}_${new Date().getTime()}`
      );
    } finally {
      // إعادة العناصر لحالتها الأصلية
      printOnlyElements.forEach((el: any) => {
        el.style.display = '';
        el.style.visibility = '';
      });
      setIsExportingImage(false);
    }
  };

  const totalRev = monthlyData.reduce((s, c) => s + c.revenue, 0);
  const totalExp = monthlyData.reduce((s, c) => s + c.expenses, 0);

  return (
    <div className="space-y-6" dir="rtl">
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

      {/* Control Bar - Deep Slate Blue for comfort */}
      <div className="bg-[#0f172a] p-5 rounded-[2rem] border border-slate-800 flex justify-between items-center no-print shadow-2xl overflow-hidden relative">
         <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
         <div className="flex items-center gap-6 relative z-10">
            <div className="flex flex-col gap-1">
               <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mr-1">السنة المالية للتقرير</span>
               <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    value={selectedYear} 
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-white px-6 py-2.5 rounded-xl font-mono font-black text-center outline-none focus:border-primary transition-all shadow-inner w-32"
                  />
                  <RefreshCcw className="w-5 h-5 text-slate-600 cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedYear(new Date().getFullYear())} />
               </div>
            </div>
         </div>
         <div className="text-left relative z-10">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Accounting Intelligence Report</p>
            <p className="text-xs font-bold text-slate-400 italic">SAMLATOR SECURED SYSTEM v4.1</p>
         </div>
      </div>

      {/* Report Area Container with Ref for Image Export */}
      <div ref={reportRef} className="space-y-8 bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] export-fix print:p-0 shadow-xl border border-zinc-100 dark:border-zinc-900">
        
        {/* Official Header (Matches standard accounting style) */}
        <div className="print-only flex justify-between items-start mb-6 border-b-4 border-rose-900 pb-6 bg-white text-zinc-900">
          <div className="flex items-center gap-4">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="w-20 h-20 object-contain bg-white rounded-xl p-1 shadow-sm border" alt="Logo" />
            ) : (
               <div className="w-16 h-16 bg-rose-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">SH</div>
            )}
            <div>
              <h1 className="text-3xl font-black text-rose-900 leading-none">{settings?.companyName || 'SAMLATOR SYSTEM'}</h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{settings?.companyType}</p>
            </div>
          </div>
          <div className="text-center pt-2">
            <h2 className="text-4xl font-black text-zinc-900 underline decoration-rose-900/20 underline-offset-8">ميزان المراجعة والأرباح</h2>
            <p className="text-lg mt-4 font-bold text-rose-800">للعام المالي: {selectedYear}</p>
          </div>
          <div className="text-left space-y-1 pt-2">
             <div className="flex items-center justify-end gap-2 text-zinc-500">
                <span className="text-xs font-bold">{settings?.address || 'سوريا'}</span>
             </div>
             <div className="text-[10px] font-black text-zinc-400 uppercase pt-2 flex items-center gap-2">
                <Calendar className="w-3 h-3"/> {new Date().toLocaleDateString('ar-SA')}
             </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-500/5 border-2 border-emerald-500/10 p-8 rounded-3xl flex flex-col items-center text-center group hover:bg-emerald-500/10 transition-all">
            <TrendingUp className="w-10 h-10 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إجمالي الإيرادات (السنوية)</span>
            <span className="text-4xl font-mono font-black text-emerald-600">{totalRev.toLocaleString()}</span>
          </div>
          <div className="bg-rose-500/5 border-2 border-rose-500/10 p-8 rounded-3xl flex flex-col items-center text-center group hover:bg-rose-500/10 transition-all">
            <TrendingDown className="w-10 h-10 text-rose-500 mb-3 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إجمالي المصاريف (السنوية)</span>
            <span className="text-4xl font-mono font-black text-rose-600">{totalExp.toLocaleString()}</span>
          </div>
          <div className={`p-8 rounded-3xl flex flex-col items-center text-center border-2 transition-all shadow-lg ${totalRev - totalExp >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
            <DollarSign className={`w-10 h-10 mb-3 ${totalRev - totalExp >= 0 ? 'text-blue-500' : 'text-amber-500'}`} />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">صافي الربح / الخسارة</span>
            <span className={`text-4xl font-mono font-black ${totalRev - totalExp >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
              {(totalRev - totalExp).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl print:border-zinc-300 print:shadow-none print:rounded-none">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center no-print">
            <h3 className="font-black text-readable flex items-center gap-2"><Building2 className="w-5 h-5 text-primary"/> تفصيل الأداء المالي لكل شهر</h3>
          </div>
          <div className="p-6 hidden print:block bg-zinc-50 border-b border-zinc-200">
             <h3 className="text-xl font-black text-black">كشف توزيع الأرباح الشهري المعتمد - عام {selectedYear}</h3>
          </div>
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 print:bg-zinc-100 print:text-black">
                <th className="p-4 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300">الشهر</th>
                <th className="p-4 text-center border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300">المقبوضات (إيراد)</th>
                <th className="p-4 text-center border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300">المدفوعات (مصاريف)</th>
                <th className="p-4 text-center border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300 bg-zinc-50/50 dark:bg-zinc-800/20">صافي الربح الشهري</th>
                <th className="p-4 text-center">حالة الربحية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-bold print:text-black">
              {monthlyData.map((m, i) => (
                <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors h-14">
                  <td className="p-4 text-readable border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-200">{m.month}</td>
                  <td className="p-4 text-center font-mono text-emerald-600 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-200">{m.revenue.toLocaleString()}</td>
                  <td className="p-4 text-center font-mono text-rose-600 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-200">{m.expenses.toLocaleString()}</td>
                  <td className={`p-4 text-center font-mono text-xl border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-200 ${m.profit >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {m.profit.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    {m.profit > 0 ? (
                      <span className="text-[9px] font-black uppercase px-4 py-1 bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20 print:border-none print:p-0">ربح محقق</span>
                    ) : m.profit < 0 ? (
                      <span className="text-[9px] font-black uppercase px-4 py-1 bg-amber-500/10 text-amber-600 rounded-full border border-amber-500/20 print:border-none print:p-0">عجز مالي</span>
                    ) : (
                      <span className="text-[9px] font-black uppercase px-4 py-1 bg-zinc-100 text-zinc-400 rounded-full border border-zinc-200 print:border-none print:p-0">نقطة تعادل</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Official Print Footer */}
        <div className="print-only mt-10 pt-10 border-t border-zinc-200 flex justify-between items-end text-[10px] font-black text-zinc-400 bg-white">
           <div className="flex flex-col gap-1">
              <span>SAMLATOR SYSTEM | SECURED FINANCIAL LOG TERMINAL</span>
              <span>تاريخ استخراج هذا التقرير: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="text-center">
              <div className="w-48 border-b-2 border-zinc-200 mb-2 mx-auto"></div>
              <span>توقيع مدير الحسابات / والختم الرسمي</span>
           </div>
           <div className="text-left italic opacity-50">
              {settings?.companyName} Accounting Terminal v4.1
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossReportView;
