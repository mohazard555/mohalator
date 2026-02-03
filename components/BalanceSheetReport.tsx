
import React from 'react';
import { MinusSquare, PlusSquare, Box, Wallet } from 'lucide-react';

interface BalanceSheetReportProps {
  fin: any;
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
  renderDetailTable: (data: any[]) => React.ReactNode;
}

const BalanceSheetReport: React.FC<BalanceSheetReportProps> = ({ fin, expandedSections, toggleSection, renderDetailTable }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-zinc-900 dark:text-zinc-100 animate-in fade-in duration-500">
       <div className="space-y-4">
           <h4 className="bg-zinc-900 text-white p-3 rounded-xl font-black text-center text-xs uppercase tracking-widest">الأصـــــول (الموجودات)</h4>
           <div className="divide-y border rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900">
              <div className="p-4">
                 <div className="flex justify-between items-center cursor-pointer group" onClick={() => toggleSection('bs_closing')}>
                    <span className="font-bold text-sm flex items-center gap-2">
                       {expandedSections.has('bs_closing') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                       <Box className="w-4 h-4 text-amber-500 opacity-40 group-hover:opacity-100"/>
                       بضاعة آخر المدة (مخزون)
                    </span>
                    <span className="font-mono font-black">{fin.closingStockValue.toLocaleString()}</span>
                 </div>
                 {expandedSections.has('bs_closing') && renderDetailTable(fin.closingStockItems.map((it:any) => ({ name: `${it.name} (${it.quantity} ${it.unit})`, balance: it.total })))}
              </div>
              <div className="p-4">
                 <div className="flex justify-between items-center cursor-pointer group" onClick={() => toggleSection('bs_cash')}>
                    <span className="font-bold text-sm flex items-center gap-2">
                       {expandedSections.has('bs_cash') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                       <Wallet className="w-4 h-4 text-emerald-500 opacity-40 group-hover:opacity-100"/>
                       النقدية (الصندوق)
                    </span>
                    <span className="font-mono font-black">{fin.cashInHand.toLocaleString()}</span>
                 </div>
                 {expandedSections.has('bs_cash') && renderDetailTable(fin.receivablesList.length > 0 ? fin.receivablesList : [{name: 'رصيد الصندوق العام', balance: fin.cashInHand}])}
              </div>
              <div className="p-4">
                 <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('bs_receivables')}>
                    <span className="font-bold text-sm flex items-center gap-2">
                       {expandedSections.has('bs_receivables') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                       الذمم المدينة (الزبائن)
                    </span>
                    <span className="font-mono font-black">{fin.receivables.toLocaleString()}</span>
                 </div>
                 {expandedSections.has('bs_receivables') && renderDetailTable(fin.receivablesList)}
              </div>
              <div className="p-4">
                 <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('bs_fixed')}>
                    <span className="font-bold text-sm flex items-center gap-2">
                       {expandedSections.has('bs_fixed') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                       الأصول الثابتة
                    </span>
                    <span className="font-mono font-black">{fin.fixedAssets.toLocaleString()}</span>
                 </div>
                 {expandedSections.has('bs_fixed') && renderDetailTable(fin.fixedAssetsList)}
              </div>
           </div>
           <div className="flex justify-between p-5 bg-primary/10 rounded-2xl font-black text-lg text-primary border border-primary/20">
              <span>إجمالي الموجودات</span>
              <span className="font-mono">{(fin.closingStockValue + fin.cashInHand + fin.receivables + fin.fixedAssets).toLocaleString()}</span>
           </div>
       </div>

       <div className="space-y-4">
           <h4 className="bg-zinc-400 text-zinc-900 p-3 rounded-xl font-black text-center text-xs uppercase tracking-widest">الخصوم وحقوق الملكية (المطاليب)</h4>
           <div className="divide-y border rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900">
              <div className="p-4">
                 <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('bs_equity')}>
                    <span className="font-bold text-sm flex items-center gap-2">
                       {expandedSections.has('bs_equity') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                       رأس المال وحقوق الملكية
                    </span>
                    <span className="font-mono font-black">{fin.equityOpening.toLocaleString()}</span>
                 </div>
                 {expandedSections.has('bs_equity') && renderDetailTable(fin.equityList)}
              </div>
              <div className="p-4">
                 <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">الأرباح المحققة (حتى التاريخ)</span>
                    <span className="font-mono font-black text-emerald-600">+{fin.netProfit.toLocaleString()}</span>
                 </div>
              </div>
              <div className="p-4">
                 <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('bs_payables')}>
                    <span className="font-bold text-sm flex items-center gap-2">
                       {expandedSections.has('bs_payables') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                       الذمم الدائنة (الموردين)
                    </span>
                    <span className="font-mono font-black">{fin.payables.toLocaleString()}</span>
                 </div>
                 {expandedSections.has('bs_payables') && renderDetailTable(fin.payablesList)}
              </div>
           </div>
           <div className="flex justify-between p-5 bg-zinc-900 rounded-2xl font-black text-lg text-white shadow-xl">
              <span>إجمالي المطالبات</span>
              <span className="font-mono">{(fin.equityOpening + fin.netProfit + fin.payables).toLocaleString()}</span>
           </div>
       </div>
    </div>
  );
};

export default BalanceSheetReport;
