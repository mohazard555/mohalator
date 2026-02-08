import React from 'react';
import { MinusSquare, PlusSquare, FileSpreadsheet, List, Calculator, Package, Truck, RotateCcw, Percent } from 'lucide-react';
import { exportToCSV } from '../utils/export';

interface TradingAccountReportProps {
  fin: any;
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
}

const TradingAccountReport: React.FC<TradingAccountReportProps> = ({ fin, expandedSections, toggleSection }) => {
  
  const handleExportExcel = () => {
    const data = [
      { "الجانب": "المبيعات", "البيان": "إجمالي المبيعات", "القيمة": fin.grossSales || 0 },
      { "الجانب": "المبيعات", "البيان": "صافي المبيعات", "القيمة": fin.netSales || 0 },
      { "الجانب": "المشتريات", "البيان": "إجمالي المشتريات", "القيمة": fin.grossPurchases || 0 },
      { "الجانب": "المشتريات", "البيان": "صافي المشتريات", "القيمة": fin.netPurchases || 0 },
      { "الجانب": "المخزون", "البيان": "بضاعة أول المدة", "القيمة": fin.openingStockValue || 0 },
      { "الجانب": "المخزون", "البيان": "بضاعة آخر المدة", "القيمة": fin.closingStockValue || 0 },
      { "الجانب": "النتائج", "البيان": "تكلفة البضاعة المباعة (COGS)", "القيمة": fin.cogs || 0 },
      { "الجانب": "النتائج", "البيان": "مجمل الربح/الخسارة", "القيمة": fin.grossProfit || 0 }
    ];
    exportToCSV(data, 'حساب_المتاجرة_التفصيلي');
  };

  const renderItemsTable = (items: any[], type: 'STOCK' | 'INVOICE') => (
    <div className="mt-3 overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl animate-in slide-in-from-top-2 duration-300 bg-white dark:bg-zinc-950 no-print">
      <table className="w-full text-right border-collapse text-[10px]">
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
          {(items || []).map((it, idx) => (
            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="p-2 border-l dark:border-zinc-800 font-bold">{it.name || it.itemName}</td>
              <td className="p-2 text-center font-mono">{(it.quantity || 0).toLocaleString()}</td>
              <td className="p-2 text-center font-mono">{(it.price || 0).toLocaleString()}</td>
              {type === 'INVOICE' && (
                <td className="p-2 text-center text-[8px] border-l dark:border-zinc-800 italic">
                   {it.customer || it.supplier} (#{it.invoice})
                </td>
              )}
              <td className="p-2 text-center font-mono font-black">{(it.total || ((it.quantity || 0) * (it.price || 0))).toLocaleString()}</td>
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
          {/* الجانب المدين: تكلفة البضاعة المتاحة للبيع */}
          <div className="border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col">
             <div className="bg-zinc-100 dark:bg-zinc-900 p-4 font-black text-center text-xs border-b dark:border-zinc-800 uppercase tracking-widest">تكلفة البضاعة المتاحة للبيع (منه)</div>
             <div className="flex-1 divide-y dark:divide-zinc-800">
                
                {/* بضاعة أول المدة */}
                <div className="p-5">
                   <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('tr_opening')}>
                      <span className="font-black text-sm flex items-center gap-2">
                         {expandedSections.has('tr_opening') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         بضاعة أول المدة
                      </span>
                      <span className="font-mono font-black text-lg">{(fin.openingStockValue || 0).toLocaleString()}</span>
                   </div>
                   {expandedSections.has('tr_opening') && renderItemsTable(fin.openingStockItems || [], 'STOCK')}
                </div>

                {/* صافي المشتريات بتفاصيله */}
                <div className="p-5 bg-zinc-50/30 dark:bg-zinc-800/20">
                   <div className="flex justify-between items-center cursor-pointer mb-4" onClick={() => toggleSection('tr_net_purchases')}>
                      <span className="font-black text-sm flex items-center gap-2 text-primary">
                         {expandedSections.has('tr_net_purchases') ? <MinusSquare className="w-4 h-4"/> : <PlusSquare className="w-4 h-4 opacity-30"/>}
                         صافي المشتريات
                      </span>
                      <span className="font-mono font-black text-lg text-primary">{(fin.netPurchases || 0).toLocaleString()}</span>
                   </div>
                   
                   {expandedSections.has('tr_net_purchases') && (
                     <div className="space-y-2 pr-6 animate-in slide-in-from-right-2">
                        <div className="flex justify-between text-xs font-bold text-zinc-500">
                           <span className="flex items-center gap-1"><Package className="w-3 h-3"/> إجمالي المشتريات (+)</span>
                           <span className="font-mono">{(fin.grossPurchases || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-zinc-500">
                           <span className="flex items-center gap-1"><Truck className="w-3 h-3"/> مصاريف الشراء (+)</span>
                           <span className="font-mono">{Math.max(0, (fin.netPurchases || 0) - (fin.grossPurchases || 0)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-rose-500">
                           <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3"/> مردودات المشتريات (-)</span>
                           <span className="font-mono italic">مخصومة تلقائياً</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-rose-500">
                           <span className="flex items-center gap-1"><Percent className="w-3 h-3"/> الخصم المكتسب (-)</span>
                           <span className="font-mono italic">مخصوم تلقائياً</span>
                        </div>
                        <div className="pt-2 border-t border-dashed dark:border-zinc-700">
                           {renderItemsTable(fin.purchaseItems || [], 'INVOICE')}
                        </div>
                     </div>
                   )}
                </div>

                {/* مجمل الربح */}
                {(fin.grossProfit || 0) > 0 && (
                   <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border-t-2 border-emerald-500/20 flex justify-between items-center">
                      <span className="font-black text-emerald-700 text-lg">مجمل الربح التجاري</span>
                      <span className="font-mono font-black text-2xl text-emerald-700">{(fin.grossProfit || 0).toLocaleString()}</span>
                   </div>
                )}
             </div>
          </div>

          {/* الجانب الدائن: المبيعات والمخزون المتبقي */}
          <div className="flex flex-col">
             <div className="bg-zinc-800 text-white p-4 font-black text-center text-xs border-b border-zinc-700 uppercase tracking-widest">الإيرادات والنتائج (له)</div>
             <div className="flex-1 divide-y dark:divide-zinc-800">
                
                {/* إجمالي المبيعات */}
                <div className="p-5">
                   <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('tr_sales')}>
                      <span className="font-black text-sm flex items-center gap-2">
                         {expandedSections.has('tr_sales') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         إجمالي المبيعات
                      </span>
                      <span className="font-mono font-black text-lg">{(fin.grossSales || 0).toLocaleString()}</span>
                   </div>
                   {expandedSections.has('tr_sales') && (
                     <div className="space-y-1 mb-2 pr-6">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                           <span>صافي المبيعات (بعد الخصم والارتجاع):</span>
                           <span className="font-mono">{(fin.netSales || 0).toLocaleString()}</span>
                        </div>
                        {renderItemsTable(fin.saleItems || [], 'INVOICE')}
                     </div>
                   )}
                </div>

                {/* بضاعة آخر المدة */}
                <div className="p-5">
                   <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('tr_closing')}>
                      <span className="font-black text-sm flex items-center gap-2">
                         {expandedSections.has('tr_closing') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         بضاعة آخر المدة
                      </span>
                      <span className="font-mono font-black text-lg">{(fin.closingStockValue || 0).toLocaleString()}</span>
                   </div>
                   {expandedSections.has('tr_closing') && renderItemsTable(fin.closingStockItems || [], 'STOCK')}
                </div>

                {/* مجمل الخسارة */}
                {(fin.grossProfit || 0) < 0 && (
                   <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border-t-2 border-rose-500/20 flex justify-between items-center">
                      <span className="font-black text-rose-700 text-lg">مجمل الخسارة التجارية</span>
                      <span className="font-mono font-black text-2xl text-rose-700">{Math.abs(fin.grossProfit || 0).toLocaleString()}</span>
                   </div>
                )}
             </div>
          </div>
       </div>

       {/* تحليل تكلفة المبيعات */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border-4 border-dashed border-zinc-200 dark:border-zinc-800 flex justify-between items-center group">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-2xl shadow-inner"><List className="w-5 h-5 text-zinc-500"/></div>
                <div>
                   <h4 className="font-black text-sm text-readable">تكلفة البضاعة المباعة (COGS)</h4>
                   <p className="text-[10px] text-zinc-400 font-bold">بضاعة أول المدة + صافي المشتريات - آخر المدة</p>
                </div>
             </div>
             <div className="text-right">
                <div className="text-3xl font-mono font-black text-rose-600">{(fin.cogs || 0).toLocaleString()}</div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">صافي تكلفة المبيعات</span>
             </div>
          </div>

          <div className="p-6 bg-primary/5 rounded-3xl border border-primary/20 flex justify-between items-center shadow-xl">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-primary text-white rounded-2xl shadow-lg"><Calculator className="w-5 h-5"/></div>
                <div>
                   <h4 className="font-black text-sm text-primary">هامش مجمل الربح</h4>
                   <p className="text-[10px] text-zinc-400 font-bold">نسبة الربح من إجمالي المبيعات</p>
                </div>
             </div>
             <div className="text-right">
                <div className="text-4xl font-mono font-black text-primary">
                   {(( (fin.grossProfit || 0) / (fin.grossSales || 1)) * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">كفاءة المتاجرة</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export default TradingAccountReport;