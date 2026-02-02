
import React, { useState } from 'react';
import { Package, Trash2, History, Eye, EyeOff, FileDown, Box, LayoutList, Calculator } from 'lucide-react';
import { PeriodicInventory } from '../types';
import { exportToCSV } from '../utils/export';

interface PeriodicInventoryManagerProps {
  inventories: PeriodicInventory[];
  closingStockValue: number;
  closingStockItems: any[];
  onDelete: (id: string) => void;
}

const PeriodicInventoryManager: React.FC<PeriodicInventoryManagerProps> = ({ 
  inventories, 
  closingStockValue, 
  closingStockItems,
  onDelete 
}) => {
  const [showClosingDetails, setShowClosingDetails] = useState(false);

  const handleExportClosing = () => {
    exportToCSV(closingStockItems, `بضاعة_آخر_المدة_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-8 animate-in slide-in-from-bottom-4">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b dark:border-zinc-800 pb-6">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <Package className="w-8 h-8"/>
             </div>
             <div>
                <h3 className="text-2xl font-black text-readable">إدارة وتقييم الجرد الدوري</h3>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">مقارنة بضاعة أول المدة وآخر المدة</p>
             </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
             <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-6 py-3 rounded-2xl flex flex-col items-center">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">إجمالي قيمة بضاعة آخر المدة</span>
                <span className="text-2xl font-mono font-black text-emerald-600">
                   {closingStockValue.toLocaleString()}
                </span>
             </div>
             <button 
                onClick={() => setShowClosingDetails(!showClosingDetails)}
                className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg ${showClosingDetails ? 'bg-primary text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-readable'}`}
             >
                {showClosingDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                {showClosingDetails ? 'إخفاء تفاصيل آخر المدة' : 'عرض بنود آخر المدة'}
             </button>
          </div>
       </div>

       {showClosingDetails ? (
         <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
               <h4 className="text-lg font-black flex items-center gap-2 text-emerald-600">
                  <LayoutList className="w-5 h-5" /> كشف تفصيلي لبنود بضاعة آخر المدة (تقديري)
               </h4>
               <button 
                  onClick={handleExportClosing}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md hover:brightness-110"
               >
                  <FileDown className="w-4 h-4" /> تصدير Excel
               </button>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-inner bg-zinc-50/50 dark:bg-zinc-900/50">
               <table className="w-full text-right border-collapse text-sm">
                  <thead>
                     <tr className="bg-zinc-900 text-white font-black text-[10px] uppercase tracking-widest h-12">
                        <th className="p-4">كود الصنف</th>
                        <th className="p-4">اسم المادة</th>
                        <th className="p-4 text-center">الكمية المتوفرة</th>
                        <th className="p-4 text-center">السعر التقديري</th>
                        <th className="p-4 text-center bg-zinc-800">إجمالي القيمة الاستثمارية</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y font-bold text-readable">
                     {closingStockItems.length === 0 ? (
                        <tr><td colSpan={5} className="p-20 text-center italic text-zinc-400">لا يوجد مخزون متوفر حالياً للفترة المحددة</td></tr>
                     ) : closingStockItems.map((it, idx) => (
                        <tr key={idx} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                           <td className="p-4 font-mono text-zinc-500">#{it.code}</td>
                           <td className="p-4">{it.name}</td>
                           <td className="p-4 text-center font-mono">
                              <span className="text-emerald-600">{it.quantity.toLocaleString()}</span>
                              <span className="text-[9px] text-zinc-400 mr-1">{it.unit}</span>
                           </td>
                           <td className="p-4 text-center font-mono text-zinc-400">{it.price.toLocaleString()}</td>
                           <td className="p-4 text-center font-mono font-black text-lg bg-zinc-50/50 dark:bg-zinc-800/20">{it.total.toLocaleString()}</td>
                        </tr>
                     ))}
                  </tbody>
                  <tfoot>
                     <tr className="bg-zinc-900 text-white font-black">
                        <td colSpan={4} className="p-5 text-center text-xs uppercase tracking-[0.2em]">إجمالي قيمة بضاعة آخر المدة الحالية</td>
                        <td className="p-5 text-center font-mono text-2xl text-emerald-400">{closingStockValue.toLocaleString()}</td>
                     </tr>
                  </tfoot>
               </table>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
               <Calculator className="w-5 h-5 text-amber-500" />
               <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
                  ملاحظة: يتم حساب هذه البنود آلياً بناءً على رصيد أول المدة المسجل مضافاً إليه المشتريات ومطروحاً منه المبيعات والمنصرفات حتى تاريخ نهاية التقرير المختار.
               </p>
            </div>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {inventories.map(inv => (
               <div key={inv.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] space-y-4 hover:shadow-lg transition-all relative overflow-hidden group">
                  <div className="flex justify-between items-start relative z-10">
                     <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm">
                        <History className="w-6 h-6 text-primary" />
                     </div>
                     <button onClick={() => onDelete(inv.id)} className="text-rose-400 hover:text-rose-600 transition-colors"><Trash2 className="w-5 h-5"/></button>
                  </div>
                  <div>
                     <h4 className="font-black text-lg text-readable">{inv.notes}</h4>
                     <p className="text-xs font-mono text-zinc-400">{inv.date}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t dark:border-zinc-800">
                     <span className="text-xs font-bold text-zinc-500">عدد الأصناف: {inv.items.length}</span>
                     <span className="text-xl font-mono font-black text-primary">{inv.totalValue.toLocaleString()}</span>
                  </div>
               </div>
            ))}
            {inventories.length === 0 && (
               <div className="col-span-full py-20 text-center border-4 border-dashed border-zinc-100 dark:border-zinc-900 rounded-[3rem]">
                  <Package className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                  <p className="text-zinc-500 font-bold">لا يوجد سجلات جرد مسجلة. ابدأ بإضافة جرد أول المدة لتثبيت رأس مال البضاعة.</p>
               </div>
            )}
         </div>
       )}
    </div>
  );
};

export default PeriodicInventoryManager;
