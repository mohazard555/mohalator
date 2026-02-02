import React from 'react';
/* Added Calculator to the imports from lucide-react to fix 'Cannot find name' error */
import { MinusSquare, PlusSquare, FileSpreadsheet, ChevronDown, List, Calculator } from 'lucide-react';
import { exportToCSV } from '../utils/export';

interface TradingAccountReportProps {
  fin: any;
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
}

const TradingAccountReport: React.FC<TradingAccountReportProps> = ({ fin, expandedSections, toggleSection }) => {
  
  const handleExportExcel = () => {
    const data = [
      { "الجانب": "مدين (منه)", "البيان": "بضاعة أول المدة", "القيمة": fin.openingStockValue },
      { "الجانب": "مدين (منه)", "البيان": "إجمالي المشتريات", "القيمة": fin.totalPurchases },
      { "الجانب": "دائن (له)", "البيان": "إجمالي المبيعات", "القيمة": fin.totalSales },
      { "الجانب": "دائن (له)", "البيان": "بضاعة آخر المدة", "القيمة": fin.closingStockValue },
      { "الجانب": "النتيجة", "البيان": "تكلفة البضاعة المباعة (COGS)", "القيمة": fin.cogs },
      { "الجانب": "النتيجة", "البيان": "مجمل الربح/الخسارة", "القيمة": fin.grossProfit }
    ];
    exportToCSV(data, 'حساب_المتاجرة');
  };

  const renderItemsTable = (items: any[], type: 'STOCK' | 'INVOICE') => (
    <div className="mt-3 overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl animate-in slide-in-from-top-2 duration-300 bg-white dark:bg-zinc-950 no-print">
      <table className="w-full text-right text-[10px]">
        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b dark:border-zinc-800">
          <tr className="text-zinc-500 font-black">
            <th className="p-2 border-l dark:border-zinc-800">المادة</th>
            <th className="p-2 text-center border-l dark:border-zinc-800">الكمية</th>
            <th className="p-2 text-center border-l dark:border-zinc-800">السعر</th>
            {type === 'INVOICE' && <th className="p-2 text-center border-l dark:border-zinc-800">الطرف / الفاتورة</th>}
            <th className="p-2 text-center">الإجمالي</th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
          {items.map((it, idx) => (
            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="p-2 border-l dark:border-zinc-800 font-bold">{it.name || it.itemName}</td>
              <td className="p-2 text-center font-mono">{it.quantity.toLocaleString()}</td>
              <td className="p-2 text-center font-mono">{it.price.toLocaleString()}</td>
              {type === 'INVOICE' && (
                <td className="p-2 text-center text-[8px] border-l dark:border-zinc-800 italic">
                   {it.customer || it.supplier} (#{it.invoice})
                </td>
              )}
              <td className="p-2 text-center font-mono font-black">{(it.total || (it.quantity * it.price)).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8 text-zinc-900 dark:text-zinc-100 animate-in fade-in duration-500">
       <div className="flex justify-end no-print">
          <button 
            onClick={handleExportExcel}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md hover:brightness-110"
          >
             <FileSpreadsheet className="w-4 h-4" /> تصدير ميزان المتاجرة Excel
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-2 border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
          {/* الجانب المدين */}
          <div className="border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col">
             <div className="bg-zinc-100 dark:bg-zinc-900 p-4 font-black text-center text-xs border-b dark:border-zinc-800 uppercase tracking-widest">الجانب المدين (منه)</div>
             <div className="flex-1 divide-y dark:divide-zinc-800">
                <div className="p-5">
                   <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('tr_opening')}>
                      <span className="font-black text-sm flex items-center gap-2">
                         {expandedSections.has('tr_opening') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         بضاعة أول المدة
                      </span>
                      <span className="font-mono font-black text-lg">{fin.openingStockValue.toLocaleString()}</span>
                   </div>
                   {expandedSections.has('tr_opening') && renderItemsTable(fin.openingStockItems, 'STOCK')}
                </div>

                <div className="p-5">
                   <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('tr_purchases')}>
                      <span className="font-black text-sm flex items-center gap-2">
                         {expandedSections.has('tr_purchases') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         إجمالي المشتريات
                      </span>
                      <span className="font-mono font-black text-lg">{fin.totalPurchases.toLocaleString()}</span>
                   </div>
                   {expandedSections.has('tr_purchases') && renderItemsTable(fin.purchaseItems, 'INVOICE')}
                </div>

                {fin.grossProfit > 0 && (
                   <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border-t-2 border-emerald-500/20 flex justify-between items-center">
                      <span className="font-black text-emerald-700 text-lg">مجمل الربح التجاري</span>
                      <span className="font-mono font-black text-2xl text-emerald-700">{fin.grossProfit.toLocaleString()}</span>
                   </div>
                )}
             </div>
          </div>

          {/* الجانب الدائن */}
          <div className="flex flex-col">
             <div className="bg-zinc-800 text-white p-4 font-black text-center text-xs border-b border-zinc-700 uppercase tracking-widest">الجانب الدائن (له)</div>
             <div className="flex-1 divide-y dark:divide-zinc-800">
                <div className="p-5">
                   <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('tr_sales')}>
                      <span className="font-black text-sm flex items-center gap-2">
                         {expandedSections.has('tr_sales') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         إجمالي المبيعات
                      </span>
                      <span className="font-mono font-black text-lg">{fin.totalSales.toLocaleString()}</span>
                   </div>
                   {expandedSections.has('tr_sales') && renderItemsTable(fin.saleItems, 'INVOICE')}
                </div>

                <div className="p-5">
                   <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('tr_closing')}>
                      <span className="font-black text-sm flex items-center gap-2">
                         {expandedSections.has('tr_closing') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         بضاعة آخر المدة
                      </span>
                      <span className="font-mono font-black text-lg">{fin.closingStockValue.toLocaleString()}</span>
                   </div>
                   {expandedSections.has('tr_closing') && renderItemsTable(fin.closingStockItems, 'STOCK')}
                </div>

                {fin.grossProfit < 0 && (
                   <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border-t-2 border-rose-500/20 flex justify-between items-center">
                      <span className="font-black text-rose-700 text-lg">مجمل الخسارة التجارية</span>
                      <span className="font-mono font-black text-2xl text-rose-700">{Math.abs(fin.grossProfit).toLocaleString()}</span>
                   </div>
                )}
             </div>
          </div>
       </div>

       {/* تحليل إضافي */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center group">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"><List className="w-5 h-5 text-zinc-500"/></div>
                <div>
                   <h4 className="font-black text-sm text-readable">تكلفة البضاعة المباعة (COGS)</h4>
                   <p className="text-[10px] text-zinc-400 font-bold">بضاعة أول المدة + مشتريات - آخر المدة</p>
                </div>
             </div>
             <div className="text-right">
                <div className="text-2xl font-mono font-black text-rose-600">{fin.cogs.toLocaleString()}</div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">القيمة الشرائية للمباع</span>
             </div>
          </div>

          <div className="p-6 bg-primary/5 rounded-3xl border border-primary/20 flex justify-between items-center shadow-sm">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-primary text-white rounded-2xl shadow-lg"><Calculator className="w-5 h-5"/></div>
                <div>
                   <h4 className="font-black text-sm text-primary">نسبة مجمل الربح</h4>
                   <p className="text-[10px] text-zinc-400 font-bold">مقارنة الربح مع إجمالي المبيعات</p>
                </div>
             </div>
             <div className="text-right">
                <div className="text-3xl font-mono font-black text-primary">
                   {((fin.grossProfit / (fin.totalSales || 1)) * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">مؤشر الأداء التجاري</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export default TradingAccountReport;