
import React, { useState } from 'react';
import { Package, Trash2, History, Eye, EyeOff, FileDown, Box, LayoutList, Calculator, Edit2, ChevronDown } from 'lucide-react';
import { PeriodicInventory } from '../types';
import { exportToCSV } from '../utils/export';

interface PeriodicInventoryManagerProps {
  inventories: PeriodicInventory[];
  closingStockValue: number;
  closingStockItems: any[];
  onDelete: (id: string) => void;
  onEdit?: (inv: PeriodicInventory) => void;
  onPreview?: (inv: PeriodicInventory) => void;
}

const PeriodicInventoryManager: React.FC<PeriodicInventoryManagerProps> = ({ 
  inventories, 
  closingStockValue, 
  closingStockItems,
  onDelete,
  onEdit,
  onPreview
}) => {
  const [showClosingDetails, setShowClosingDetails] = useState(false);

  const handleExportClosing = () => {
    exportToCSV(closingStockItems, `بضاعة_آخر_المدة_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b dark:border-zinc-800 pb-6">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-zinc-900 rounded-2xl text-white shadow-xl">
                <LayoutList className="w-8 h-8"/>
             </div>
             <div>
                <h3 className="text-xl font-black text-readable">سجل جرد بضاعة أول وآخر المدة</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Inventory Records & Valuations</p>
             </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
             <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-6 py-3 rounded-2xl flex flex-col items-center shadow-inner">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">قيمة بضاعة آخر المدة الحالية</span>
                <span className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                   {closingStockValue.toLocaleString()}
                </span>
             </div>
             <button 
                onClick={() => setShowClosingDetails(!showClosingDetails)}
                className={`px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-3 transition-all shadow-xl border-4 ${showClosingDetails ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-emerald-600 text-white border-emerald-500 animate-pulse hover:animate-none'}`}
             >
                {showClosingDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                {showClosingDetails ? 'إخفاء تفاصيل الجرد الحالي' : 'عرض بضاعة آخر المدة الآن'}
             </button>
          </div>
       </div>

       {showClosingDetails ? (
         <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
               <h4 className="text-lg font-black flex items-center gap-2 text-emerald-700">
                  <Package className="w-5 h-5" /> بضاعة آخر المدة الحالية (محتويات المستودع المحدثة)
               </h4>
               <button 
                  onClick={handleExportClosing}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md hover:brightness-110"
               >
                  <FileDown className="w-4 h-4" /> تصدير القائمة Excel
               </button>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border-2 border-emerald-100 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900">
               <table className="w-full text-right border-collapse text-sm">
                  <thead>
                     <tr className="bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest h-12">
                        <th className="p-4 w-32 border-l border-emerald-600">كود الصنف</th>
                        <th className="p-4 border-l border-emerald-600">اسم المادة</th>
                        <th className="p-4 text-center border-l border-emerald-600">الكمية المتوفرة</th>
                        <th className="p-4 text-center border-l border-emerald-600">السعر التقديري</th>
                        <th className="p-4 text-center bg-emerald-900">إجمالي القيمة</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-zinc-800 font-bold text-readable">
                     {closingStockItems.length === 0 ? (
                        <tr><td colSpan={5} className="p-24 text-center italic text-zinc-400 font-black text-xl">المستودع فارغ حالياً، لا توجد بضاعة متبقية</td></tr>
                     ) : closingStockItems.map((it, idx) => (
                        <tr key={idx} className={`hover:bg-emerald-50 dark:hover:bg-zinc-800/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}>
                           <td className="p-4 font-mono text-zinc-500 border-l border-zinc-100 dark:border-zinc-800">#{it.code}</td>
                           <td className="p-4 text-zinc-900 dark:text-zinc-100 border-l border-zinc-100 dark:border-zinc-800">{it.name}</td>
                           <td className="p-4 text-center font-mono border-l border-zinc-100 dark:border-zinc-800">
                              <span className="text-zinc-800 dark:text-zinc-200 font-black">{it.quantity.toLocaleString()}</span>
                              <span className="text-[9px] text-zinc-400 mr-1 uppercase">{it.unit}</span>
                           </td>
                           <td className="p-4 text-center font-mono text-zinc-500 border-l border-zinc-100 dark:border-zinc-800">{it.price.toLocaleString()}</td>
                           <td className="p-4 text-center font-mono font-black text-lg bg-emerald-50/50 dark:bg-zinc-800/20">{it.total.toLocaleString()}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {inventories.map(inv => (
               <div key={inv.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2.5rem] space-y-4 hover:shadow-2xl transition-all relative overflow-hidden group border-b-4 border-b-zinc-900">
                  <div className="flex justify-between items-start relative z-10">
                     <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl shadow-sm">
                        <History className="w-6 h-6 text-zinc-800 dark:text-white" />
                     </div>
                     <div className="flex gap-1">
                        <button onClick={() => onPreview?.(inv)} className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-blue-600 shadow-sm border border-zinc-100 dark:border-zinc-700 transition-colors" title="معاينة"><Eye className="w-4 h-4"/></button>
                        <button onClick={() => onEdit?.(inv)} className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-amber-600 shadow-sm border border-zinc-100 dark:border-zinc-700 transition-colors" title="تعديل"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => onDelete(inv.id)} className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-rose-600 shadow-sm border border-zinc-100 dark:border-zinc-700 transition-colors" title="حذف"><Trash2 className="w-4 h-4"/></button>
                     </div>
                  </div>
                  <div>
                     <h4 className="font-black text-xl text-zinc-800 dark:text-zinc-100 leading-tight mb-1">{inv.notes}</h4>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black text-zinc-400">{inv.date}</span>
                        <div className="w-1 h-1 rounded-full bg-zinc-300"></div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{inv.type === 'OPENING' ? 'جرد أول المدة' : 'جرد إغلاق'}</span>
                     </div>
                  </div>
                  <div className="pt-4 border-t dark:border-zinc-800 flex justify-between items-center">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">قيمة المخزون الإجمالية</span>
                        <span className="text-2xl font-mono font-black text-zinc-900 dark:text-zinc-100">{inv.totalValue.toLocaleString()}</span>
                     </div>
                     <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl text-center">
                        <span className="text-[9px] font-black text-zinc-400 uppercase block mb-0.5">الأصناف</span>
                        <span className="font-black text-zinc-800 dark:text-white">{inv.items.length}</span>
                     </div>
                  </div>
               </div>
            ))}
            {inventories.length === 0 && (
               <div className="col-span-full py-32 text-center border-4 border-dashed border-zinc-100 dark:border-zinc-900 rounded-[3rem]">
                  <Box className="w-16 h-16 text-zinc-100 dark:text-zinc-800 mx-auto mb-4" />
                  <p className="text-zinc-400 font-black text-lg">لم يتم تسجيل أي جرد فعلي لبضاعة أول المدة بعد</p>
                  <p className="text-zinc-300 text-sm font-bold mt-2">ابدأ بإدخال الأرصدة الافتتاحية للمواد لتثبيت رأس مال البضاعة.</p>
               </div>
            )}
         </div>
       )}
    </div>
  );
};

export default PeriodicInventoryManager;
