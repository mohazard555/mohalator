
import React from 'react';
import { TrendingUp, TrendingDown, FileSpreadsheet, MinusSquare, PlusSquare, DollarSign } from 'lucide-react';
import { exportToCSV } from '../utils/export';

interface IncomeStatementReportProps {
  fin: any;
  settings: any;
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
}

const IncomeStatementReport: React.FC<IncomeStatementReportProps> = ({ fin, settings, expandedSections, toggleSection }) => {
  
  const handleExportExcel = () => {
    const expenses = fin.expenseCats.map((c: any) => ({ "النوع": "مصروف", "القسم": c.name, "الإجمالي": c.total }));
    const revenues = fin.revenueCats.map((c: any) => ({ "النوع": "إيراد", "القسم": c.name, "الإجمالي": c.total }));
    const data = [
      { "النوع": "متاجرة", "القسم": "مجمل الربح/الخسارة", "الإجمالي": fin.grossProfit },
      ...expenses,
      ...revenues,
      { "النوع": "النتيجة النهائية", "القسم": "صافي الربح أو الخسارة", "الإجمالي": fin.netProfit }
    ];
    exportToCSV(data, 'قائمة_الأرباح_والخسائر');
  };

  const renderJournalItemsTable = (items: any[]) => (
    <div className="mt-3 overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl animate-in slide-in-from-top-2 duration-300 bg-white dark:bg-zinc-950 no-print">
      <table className="w-full text-right text-[10px]">
        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b dark:border-zinc-800">
          <tr className="text-zinc-500 font-black">
            <th className="p-2 border-l dark:border-zinc-800 w-20">التاريخ</th>
            <th className="p-2 border-l dark:border-zinc-800">البيان</th>
            <th className="p-2 text-center">المبلغ</th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
          {items.map((it, idx) => (
            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="p-2 border-l dark:border-zinc-800 font-mono text-zinc-400">{it.date}</td>
              <td className="p-2 border-l dark:border-zinc-800 font-bold">{it.statement}</td>
              <td className="p-2 text-center font-mono font-black">{(it.receivedSYP || it.paidSYP || it.receivedUSD || it.paidUSD).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8 text-zinc-900 dark:text-zinc-100 animate-in slide-in-from-bottom-4">
       <div className="flex justify-end no-print">
          <button 
            onClick={handleExportExcel}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md hover:brightness-110"
          >
             <FileSpreadsheet className="w-4 h-4" /> تصدير قائمة الأرباح Excel
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* قسم الإيرادات */}
          <div className="space-y-4">
             <h4 className="bg-emerald-600 text-white p-3 rounded-xl font-black text-center text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4"/> الإيرادات والمداخيل التشغيلية
             </h4>
             <div className="border-2 border-emerald-50 dark:border-emerald-900/20 rounded-2xl overflow-hidden divide-y divide-emerald-50 dark:divide-emerald-900/20 bg-emerald-50/10">
                <div className="flex justify-between p-4 bg-white dark:bg-zinc-900 font-black text-sm border-b-2 border-emerald-100 dark:border-emerald-800">
                   <span>مجمل الربح (من حساب المتاجرة)</span>
                   <span className="font-mono text-emerald-600">{fin.grossProfit > 0 ? fin.grossProfit.toLocaleString() : '0'}</span>
                </div>
                {fin.revenueCats.map((cat: any) => (
                   <div key={cat.id} className="p-4 bg-emerald-50/10 hover:bg-emerald-50/20 transition-all text-sm">
                      <div className="flex justify-between items-center font-bold cursor-pointer" onClick={() => toggleSection(`rev_${cat.id}`)}>
                         <span className="text-zinc-500 flex items-center gap-2">
                            {expandedSections.has(`rev_${cat.id}`) ? <MinusSquare className="w-4 h-4 text-emerald-600"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                            {cat.name}
                         </span>
                         <span className="font-mono text-emerald-600">+{cat.total.toLocaleString()}</span>
                      </div>
                      {expandedSections.has(`rev_${cat.id}`) && renderJournalItemsTable(cat.items)}
                   </div>
                ))}
             </div>
          </div>

          {/* قسم المصاريف */}
          <div className="space-y-4">
             <h4 className="bg-rose-700 text-white p-3 rounded-xl font-black text-center text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                <TrendingDown className="w-4 h-4"/> المصاريف والأعباء التشغيلية
             </h4>
             <div className="border-2 border-rose-50 dark:border-rose-900/20 rounded-2xl overflow-hidden divide-y divide-rose-50 dark:divide-rose-900/20 bg-rose-50/10">
                {fin.grossProfit < 0 && (
                   <div className="flex justify-between p-4 bg-white dark:bg-zinc-900 font-black text-sm border-b-2 border-rose-100 dark:border-rose-800">
                      <span>العجز التجاري (من حساب المتاجرة)</span>
                      <span className="font-mono text-rose-600">{Math.abs(fin.grossProfit).toLocaleString()}</span>
                   </div>
                )}
                {fin.expenseCats.map((cat: any) => (
                   <div key={cat.id} className="p-4 bg-rose-50/10 hover:bg-rose-50/20 transition-all text-sm">
                      <div className="flex justify-between items-center font-bold cursor-pointer" onClick={() => toggleSection(`exp_${cat.id}`)}>
                         <span className="text-zinc-500 flex items-center gap-2">
                            {expandedSections.has(`exp_${cat.id}`) ? <MinusSquare className="w-4 h-4 text-rose-700"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                            {cat.name}
                         </span>
                         <span className="font-mono text-rose-600">-{cat.total.toLocaleString()}</span>
                      </div>
                      {expandedSections.has(`exp_${cat.id}`) && renderJournalItemsTable(cat.items)}
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* النتيجة النهائية */}
       <div className="mt-12 p-10 rounded-[4rem] bg-zinc-900 text-white shadow-2xl flex flex-col items-center gap-4 border-4 border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[150px] rounded-full"></div>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] z-10">NET INCOME / LOSS | صافي الربح أو الخسارة</span>
          <div className={`text-8xl font-mono font-black z-10 transition-transform group-hover:scale-105 duration-500 ${fin.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
             {fin.netProfit.toLocaleString()}
          </div>
          <div className="flex items-center gap-4 bg-white/5 px-8 py-3 rounded-full border border-white/10 z-10 shadow-inner">
             {fin.netProfit >= 0 ? (
               <span className="text-emerald-400 font-black text-lg flex items-center gap-2">
                  <TrendingUp className="w-6 h-6"/> ربح صافي محقق
               </span>
             ) : (
               <span className="text-rose-400 font-black text-lg flex items-center gap-2">
                  <TrendingDown className="w-6 h-6"/> عجز مالي (خسارة)
               </span>
             )}
          </div>
          
          <p className="z-10 text-[10px] text-zinc-500 font-bold max-w-md text-center mt-4 leading-relaxed italic">
             هذه النتيجة تمثل ما تبقى للمنشأة بعد خصم كافة تكاليف البضاعة المباعة والمصاريف الإدارية والتشغيلية من إجمالي الإيرادات خلال الفترة المحددة.
          </p>
       </div>
    </div>
  );
};

export default IncomeStatementReport;
