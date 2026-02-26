
import React from 'react';
import { MinusSquare, PlusSquare, Box, Wallet, Scale, AlertTriangle, CheckCircle2, FileSpreadsheet, UserCheck, ShieldCheck } from 'lucide-react';
import { exportToCSV } from '../utils/export';

interface BalanceSheetReportProps {
  fin: any;
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
  renderDetailTable: (data: any[]) => React.ReactNode;
  displayLevel: number;
}

const BalanceSheetReport: React.FC<BalanceSheetReportProps> = ({ fin, expandedSections, toggleSection, renderDetailTable, displayLevel }) => {
  
  const totalAssets = fin.closingStockValue + fin.cashInHand + fin.receivables + fin.fixedAssets;
  const totalEquity = fin.equityOpening + fin.netProfit;
  const totalLiabilitiesAndEquity = totalEquity + fin.payables;
  const balanceDiff = Math.abs(totalAssets - totalLiabilitiesAndEquity);
  const isBalanced = balanceDiff < 1;

  const handleExportExcel = () => {
    const data = [
      { "الجانب": "الأصول", "البند": "مخزون آخر المدة", "القيمة": fin.closingStockValue },
      { "الجانب": "الأصول", "البند": "النقدية (الصندوق والمصرف)", "القيمة": fin.cashInHand },
      { "الجانب": "الأصول", "البند": "الذمم المدينة (الزبائن)", "القيمة": fin.receivables },
      { "الجانب": "الأصول", "البند": "الأصول الثابتة", "القيمة": fin.fixedAssets },
      { "الجانب": "الأصول", "البند": "إجمالي الأصول", "القيمة": totalAssets },
      { "الجانب": "الخصوم", "البند": "الذمم الدائنة (الموردين)", "القيمة": fin.payables },
      { "الجانب": "حقوق الملكية", "البند": "رأس المال", "القيمة": fin.equityOpening },
      { "الجانب": "حقوق الملكية", "البند": "الأرباح المحققة", "القيمة": fin.netProfit },
      { "الجانب": "حقوق الملكية", "البند": "إجمالي حقوق الملكية", "القيمة": totalEquity },
      { "الجانب": "المطاليب الكلية", "البند": "الخصوم + حقوق الملكية", "القيمة": totalLiabilitiesAndEquity }
    ];
    exportToCSV(data, 'الميزانية_العمومية');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <style>{`
        @media print {
          .bg-zinc-900, .bg-zinc-800 {
            background-color: white !important;
            color: #0f172a !important;
            border: 1px solid #e2e8f0 !important;
          }
          .bg-zinc-400 {
            background-color: white !important;
            color: #0f172a !important;
            border: 1px solid #e2e8f0 !important;
          }
          .text-white {
            color: #0f172a !important;
          }
          .border-primary {
            border-color: #3b82f6 !important;
          }
          .bg-emerald-500 {
            background-color: white !important;
            color: #065f46 !important;
            border: 1px solid #d1fae5 !important;
          }
          .divide-y > * + * {
            border-color: #f1f5f9 !important;
          }
          .shadow-lg, .shadow-2xl {
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className="flex justify-end no-print">
         <button 
           onClick={handleExportExcel}
           className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md hover:brightness-110"
         >
            <FileSpreadsheet className="w-4 h-4" /> تصدير الميزانية Excel
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-zinc-900 dark:text-zinc-100">
         {/* جانب الأصول */}
         <div className="space-y-4">
             <h4 className="bg-zinc-900 text-white p-3 rounded-xl font-black text-center text-xs uppercase tracking-widest">الأصـــــول (الموجودات)</h4>
             <div className={`divide-y border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm ${displayLevel === 1 ? 'hidden' : ''}`}>
                <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                   <div className="flex justify-between items-center cursor-pointer group" onClick={() => toggleSection('bs_closing')}>
                      <span className="font-bold text-sm flex items-center gap-2">
                         {expandedSections.has('bs_closing') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         <Box className="w-4 h-4 text-amber-500 opacity-40 group-hover:opacity-100"/>
                         مخزون آخر المدة
                      </span>
                      <span className="font-mono font-black text-lg">{fin.closingStockValue.toLocaleString()}</span>
                   </div>
                   {displayLevel >= 3 && expandedSections.has('bs_closing') && renderDetailTable(fin.closingStockItems.map((it:any) => ({ name: it.name, balance: it.total })))}
                </div>
                
                <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                   <div className="flex justify-between items-center cursor-pointer group" onClick={() => toggleSection('bs_cash')}>
                      <span className="font-bold text-sm flex items-center gap-2">
                         {expandedSections.has('bs_cash') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         <Wallet className="w-4 h-4 text-emerald-500 opacity-40 group-hover:opacity-100"/>
                         النقدية (الصندوق والمصرف)
                      </span>
                      <span className="font-mono font-black text-lg">{fin.cashInHand.toLocaleString()}</span>
                   </div>
                   {displayLevel >= 3 && expandedSections.has('bs_cash') && renderDetailTable([
                     { name: 'الصندوق الرئيسي', balance: fin.cashBalance },
                     { name: 'حساب المصرف البنكي', balance: fin.bankBalance }
                   ])}
                </div>

                <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                   <div className="flex justify-between items-center cursor-pointer group" onClick={() => toggleSection('bs_receivables')}>
                      <span className="font-bold text-sm flex items-center gap-2">
                         {expandedSections.has('bs_receivables') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         الذمم المدينة (الزبائن)
                      </span>
                      <span className="font-mono font-black text-lg">{fin.receivables.toLocaleString()}</span>
                   </div>
                   {displayLevel >= 3 && expandedSections.has('bs_receivables') && renderDetailTable(fin.receivablesList)}
                </div>

                <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                   <div className="flex justify-between items-center cursor-pointer group" onClick={() => toggleSection('bs_fixed')}>
                      <span className="font-bold text-sm flex items-center gap-2">
                         {expandedSections.has('bs_fixed') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         الأصول الثابتة
                      </span>
                      <span className="font-mono font-black text-lg">{fin.fixedAssets.toLocaleString()}</span>
                   </div>
                   {displayLevel >= 3 && expandedSections.has('bs_fixed') && renderDetailTable(fin.fixedAssetsList)}
                </div>
             </div>
             <div className="flex justify-between p-5 bg-zinc-900 text-white rounded-2xl font-black text-xl shadow-lg border-b-4 border-primary">
                <span>إجمالي الأصول</span>
                <span className="font-mono">{totalAssets.toLocaleString()}</span>
             </div>
         </div>

         {/* جانب الخصوم وحقوق الملكية */}
         <div className="space-y-4">
             <h4 className="bg-zinc-400 text-zinc-900 p-3 rounded-xl font-black text-center text-xs uppercase tracking-widest">الخصوم وحقوق الملكية (المطاليب)</h4>
             <div className={`border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm divide-y dark:divide-zinc-800 ${displayLevel === 1 ? 'hidden' : ''}`}>
                
                {/* قسم الخصوم */}
                <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                   <div className="flex justify-between items-center cursor-pointer group" onClick={() => toggleSection('bs_payables')}>
                      <span className="font-bold text-sm flex items-center gap-2">
                         {expandedSections.has('bs_payables') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         الذمم الدائنة (الموردين)
                      </span>
                      <span className="font-mono font-black text-lg">{fin.payables.toLocaleString()}</span>
                   </div>
                   {displayLevel >= 3 && expandedSections.has('bs_payables') && renderDetailTable(fin.payablesList)}
                </div>

                {/* قسم حقوق الملكية */}
                <div className="p-4 bg-zinc-50/30 dark:bg-zinc-800/20">
                   <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-4 h-4 text-emerald-600"/>
                      <span className="font-black text-xs text-zinc-400 uppercase tracking-widest">حقوق الملكية (Equity)</span>
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center cursor-pointer group" onClick={() => toggleSection('bs_equity')}>
                         <span className="font-bold text-sm flex items-center gap-2">
                            {expandedSections.has('bs_equity') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                            رأس المال (المساهمات)
                         </span>
                         <span className="font-mono font-black">{fin.equityOpening.toLocaleString()}</span>
                      </div>
                      {displayLevel >= 3 && expandedSections.has('bs_equity') && renderDetailTable(fin.equityList)}
                      
                      <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
                         <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-emerald-600"/>
                            <span className="font-bold text-sm text-emerald-700">صافي الربح المحقق (المحتجز)</span>
                         </div>
                         <span className="font-mono font-black text-emerald-700">{fin.netProfit.toLocaleString()}</span>
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="flex justify-between p-5 bg-zinc-800 text-white rounded-2xl font-black text-xl shadow-lg border-b-4 border-emerald-500">
                <span>إجمالي الخصوم وحقوق الملكية</span>
                <span className="font-mono">{totalLiabilitiesAndEquity.toLocaleString()}</span>
             </div>
         </div>
      </div>

      {/* شريط فحص توازن الميزانية */}
      <div className={`p-6 rounded-[2rem] border-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl transition-all ${isBalanced ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
         <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl shadow-lg ${isBalanced ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
               <Scale className="w-8 h-8" />
            </div>
            <div>
               <h3 className={`text-xl font-black ${isBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isBalanced ? 'الميزانية متوازنة بدقة' : 'تنبيه: الميزانية غير متوازنة'}
               </h3>
               <p className="text-xs font-bold text-zinc-500">فحص المطابقة: الأصول = الخصوم + حقوق الملكية</p>
            </div>
         </div>

         <div className="flex items-center gap-8">
            {!isBalanced && (
               <div className="text-center">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">فرق التوازن</span>
                  <div className="flex items-center gap-2 text-rose-600 font-mono font-black text-2xl">
                     <AlertTriangle className="w-5 h-5" />
                     {balanceDiff.toLocaleString()}
                  </div>
               </div>
            )}
            {isBalanced && (
               <div className="flex items-center gap-2 text-emerald-600 font-black">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>لا يوجد فروقات محاسبية</span>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default BalanceSheetReport;
