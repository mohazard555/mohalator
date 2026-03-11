
import React, { useState, useRef } from 'react';
import { 
  MinusSquare, PlusSquare, FileSpreadsheet, List, Calculator, 
  ArrowDownLeft, Tag, Truck, RefreshCcw, Percent, X, Printer, FileDown, Search 
} from 'lucide-react';
import { exportToCSV } from '../utils/export';
import { PdfExportService } from '../utils/PdfExportService';

interface TradingAccountReportProps {
  fin: any;
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
  settings?: any;
}

const TradingAccountReport: React.FC<TradingAccountReportProps> = ({ fin, expandedSections, toggleSection, settings }) => {
  const [drillDown, setDrillDown] = useState<{ title: string; data: any[] } | null>(null);
  const modalPrintRef = useRef<HTMLDivElement>(null);

  const handleExportExcel = () => {
    const data = [
      { "الجانب": "مدين (منه)", "البيان": "بضاعة أول المدة", "القيمة": fin.openingStockValue },
      { "الجانب": "مدين (منه)", "البيان": "صافي المشتريات", "القيمة": fin.netPurchases },
      { "الجانب": "دائن (له)", "البيان": "إجمالي المبيعات (صافي)", "القيمة": fin.netSales },
      { "الجانب": "دائن (له)", "البيان": "بضاعة آخر المدة", "القيمة": fin.closingStockValue },
      { "الجانب": "النتيجة", "البيان": "تكلفة البضاعة المباعة (COGS)", "القيمة": fin.cogs },
      { "الجانب": "النتيجة", "البيان": "مجمل الربح/الخسارة", "القيمة": fin.grossProfit }
    ];
    exportToCSV(data, 'حساب_المتاجرة');
  };

  const handleDrillDownExportExcel = () => {
    if (!drillDown) return;
    const data = drillDown.data.map((item, idx) => ({
      'م': idx + 1,
      'التاريخ': item.date,
      'رقم المستند': item.number,
      'الطرف': item.party,
      'البيان': item.statement,
      'القيمة': item.value
    }));
    exportToCSV(data, drillDown.title.replace(/\s+/g, '_'));
  };

  const handleDrillDownExportPDF = async () => {
    if (!modalPrintRef.current || !drillDown) return;
    await PdfExportService.export({
      element: modalPrintRef.current,
      fileName: drillDown.title.replace(/\s+/g, '_'),
      orientation: 'portrait'
    });
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
       <div className="flex justify-between items-center no-print">
          <h3 className="text-xl font-black text-readable flex items-center gap-2">
             <Calculator className="w-6 h-6 text-primary" />
             ملخص نتائج المتاجرة
          </h3>
          <button 
            onClick={handleExportExcel}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md hover:brightness-110"
          >
             <FileSpreadsheet className="w-4 h-4" /> تصدير ميزان المتاجرة Excel
          </button>
       </div>

       {/* Quick Summary Cards (Visible in Print & Screen) */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center">
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">صافي المبيعات</span>
             <div className="text-2xl font-mono font-black text-rose-700">{fin.netSales.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center">
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">تكلفة المبيعات (COGS)</span>
             <div className="text-2xl font-mono font-black text-zinc-600">{fin.cogs.toLocaleString()}</div>
          </div>
          <div className={`p-6 rounded-3xl border flex flex-col items-center text-center ${fin.grossProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800'}`}>
             <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${fin.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {fin.grossProfit >= 0 ? 'مجمل الربح' : 'مجمل الخسارة'}
             </span>
             <div className={`text-3xl font-mono font-black ${fin.grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {Math.abs(fin.grossProfit).toLocaleString()}
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-2 border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
          {/* الجانب المدين */}
          <div className="border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col">
             <div className="bg-zinc-100 dark:bg-zinc-900 p-4 font-black text-center text-xs border-b dark:border-zinc-800 uppercase tracking-widest">الجانب المدين (منه)</div>
             <div className="flex-1 divide-y dark:divide-zinc-800">
                <div className="p-5">
                   <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('tr_opening')}>
                      <span className="font-black text-sm flex items-center gap-2 text-primary">
                         {expandedSections.has('tr_opening') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         بضاعة أول المدة
                      </span>
                      <span className="font-mono font-black text-lg">{fin.openingStockValue.toLocaleString()}</span>
                   </div>
                   {expandedSections.has('tr_opening') && renderItemsTable(fin.openingStockItems, 'STOCK')}
                </div>

                <div className="p-5">
                   <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('tr_net_purchases')}>
                      <span className="font-black text-sm flex items-center gap-2 text-primary">
                         {expandedSections.has('tr_net_purchases') ? <MinusSquare className="w-4 h-4 text-primary"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         صافي المشتريات
                      </span>
                      <span className="font-mono font-black text-lg">{(fin.netPurchases || 0).toLocaleString()}</span>
                   </div>
                   
                   {expandedSections.has('tr_net_purchases') && (
                     <div className="mt-4 space-y-2 no-print bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div 
                          className="flex justify-between items-center text-[11px] font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 p-2 rounded-lg transition-all"
                          onClick={() => setDrillDown({ title: 'إجمالي المشتريات', data: fin.purchasesBreakdown })}
                        >
                           <span className="flex items-center gap-2"><Tag className="w-3 h-3"/> إجمالي المشتريات</span>
                           <span className="font-mono">+{(fin.grossPurchasesVal || 0).toLocaleString()}</span>
                        </div>
                        <div 
                          className="flex justify-between items-center text-[11px] font-bold text-primary cursor-pointer hover:bg-white dark:hover:bg-zinc-800 p-2 rounded-lg transition-all"
                          onClick={() => setDrillDown({ title: 'مصاريف النقل', data: fin.transportBreakdown })}
                        >
                           <span className="flex items-center gap-2"><Truck className="w-3 h-3"/> مصاريف النقل</span>
                           <span className="font-mono">+{(fin.purchaseTransport || 0).toLocaleString()}</span>
                        </div>
                        <div 
                          className="flex justify-between items-center text-[11px] font-bold text-rose-600 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 p-2 rounded-lg transition-all"
                          onClick={() => setDrillDown({ title: 'مردودات المشتريات', data: fin.purchaseReturnsBreakdown })}
                        >
                           <span className="flex items-center gap-2"><RefreshCcw className="w-3 h-3"/> مردودات المشتريات</span>
                           <span className="font-mono">-{(fin.purchaseReturnsVal || 0).toLocaleString()}</span>
                        </div>
                        <div 
                          className="flex justify-between items-center text-[11px] font-bold text-emerald-600 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 p-2 rounded-lg transition-all"
                          onClick={() => setDrillDown({ title: 'الخصم المكتسب', data: fin.purchaseDiscountsBreakdown })}
                        >
                           <span className="flex items-center gap-2"><Percent className="w-3 h-3"/> الخصم المكتسب</span>
                           <span className="font-mono">-{(fin.purchaseDiscountsVal || 0).toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs font-black">
                           <span>الصافي النهائي للمشتريات</span>
                           <span className="text-lg text-primary">{(fin.netPurchases || 0).toLocaleString()}</span>
                        </div>
                     </div>
                   )}
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
                      <span className="font-black text-sm flex items-center gap-2 text-rose-800">
                         {expandedSections.has('tr_sales') ? <MinusSquare className="w-4 h-4 text-rose-800"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         إجمالي المبيعات (الصافي)
                      </span>
                      <span className="font-mono font-black text-lg">{(fin.netSales || 0).toLocaleString()}</span>
                   </div>
                   
                   {expandedSections.has('tr_sales') && (
                     <div className="mt-4 space-y-2 no-print bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div 
                          className="flex justify-between items-center text-[11px] font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 p-2 rounded-lg transition-all"
                          onClick={() => setDrillDown({ title: 'إجمالي المبيعات (Gross)', data: fin.salesBreakdown })}
                        >
                           <span className="flex items-center gap-2"><Tag className="w-3 h-3"/> إجمالي المبيعات (Gross)</span>
                           <span className="font-mono">+{(fin.grossSalesVal || 0).toLocaleString()}</span>
                        </div>
                        <div 
                          className="flex justify-between items-center text-[11px] font-bold text-rose-600 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 p-2 rounded-lg transition-all"
                          onClick={() => setDrillDown({ title: 'مردودات المبيعات', data: fin.salesReturnsBreakdown })}
                        >
                           <span className="flex items-center gap-2"><RefreshCcw className="w-3 h-3"/> مردودات المبيعات</span>
                           <span className="font-mono">-{(fin.salesReturnsVal || 0).toLocaleString()}</span>
                        </div>
                        <div 
                          className="flex justify-between items-center text-[11px] font-bold text-amber-600 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 p-2 rounded-lg transition-all"
                          onClick={() => setDrillDown({ title: 'الخصم الممنوح', data: fin.salesDiscountsBreakdown })}
                        >
                           <span className="flex items-center gap-2"><Percent className="w-3 h-3"/> الخصم الممنوح</span>
                           <span className="font-mono">-{(fin.salesDiscountsVal || 0).toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs font-black">
                           <span>الصافي النهائي للمبيعات</span>
                           <span className="text-lg text-rose-700">{(fin.netSales || 0).toLocaleString()}</span>
                        </div>
                     </div>
                   )}
                   {expandedSections.has('tr_sales') && renderItemsTable(fin.saleItems || [], 'INVOICE')}
                </div>

                <div className="p-5">
                   <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('tr_closing')}>
                      <span className="font-black text-sm flex items-center gap-2 text-rose-800">
                         {expandedSections.has('tr_closing') ? <MinusSquare className="w-4 h-4 text-rose-800"/> : <PlusSquare className="w-4 h-4 text-zinc-300"/>}
                         بضاعة آخر المدة
                      </span>
                      <span className="font-mono font-black text-lg">{fin.closingStockValue.toLocaleString()}</span>
                   </div>
                   {expandedSections.has('tr_closing') && renderItemsTable(fin.closingStockItems || [], 'STOCK')}
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

       {/* Drill Down Modal */}
       {drillDown && (
         <>
         <style type="text/css" media="print">
           {`
             @page { size: A4 portrait; margin: 10mm; }
             body { background: white !important; }
             .no-print { display: none !important; }
             .drill-down-modal-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; background: white !important; z-index: 999999 !important; padding: 0 !important; }
             .drill-down-modal-content { border: none !important; box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; height: auto !important; overflow: visible !important; }
             .drill-down-modal-scroll { overflow: visible !important; height: auto !important; padding: 0 !important; }
             .print-header { display: flex !important; }
           `}
         </style>
         <div className="drill-down-modal-container fixed inset-0 bg-black/60 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="drill-down-modal-content bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
               <div className="p-6 bg-zinc-900 text-white flex justify-between items-center px-10 no-print">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-primary rounded-2xl"><Calculator className="w-6 h-6"/></div>
                     <div>
                        <h3 className="text-2xl font-black tracking-tight">{drillDown.title}</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">التدقيق التفصيلي لمفردات البند</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 no-print">
                     <button onClick={handleDrillDownExportExcel} className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg flex items-center gap-2 text-xs font-black"><FileDown className="w-4 h-4"/> Excel</button>
                     <button onClick={handleDrillDownExportPDF} className="p-2.5 bg-rose-800 hover:bg-rose-700 text-white rounded-xl transition-all shadow-lg flex items-center gap-2 text-xs font-black"><FileDown className="w-4 h-4"/> PDF</button>
                     <button onClick={() => window.print()} className="p-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-all shadow-lg"><Printer className="w-4 h-4"/></button>
                     <button onClick={() => setDrillDown(null)} className="p-2.5 bg-white/10 hover:bg-rose-600 text-white rounded-xl transition-all"><X className="w-5 h-5"/></button>
                  </div>
               </div>

               <div className="drill-down-modal-scroll p-8 flex-1 overflow-y-auto custom-scrollbar" ref={modalPrintRef}>
                  <div className="hidden print-header print:flex flex-col mb-8 bg-white text-zinc-900 mx-auto w-full">
                    <div className="flex justify-between items-center border-b-4 border-rose-700 pb-4">
                      <div className="text-right flex flex-col gap-1">
                        <span className="text-sm font-black text-zinc-600">سوريا</span>
                        <span className="text-xs font-bold text-zinc-500">تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</span>
                      </div>
                      <div className="text-center flex flex-col items-center">
                        <h2 className="text-3xl font-black text-black">تفصيل بند: {drillDown.title}</h2>
                        <span className="text-sm font-black text-rose-700 mt-1">الفترة: {startDate} إلى {endDate}</span>
                      </div>
                      <div className="text-left flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <h1 className="text-2xl font-black text-rose-700 leading-none">SAMLATOR2026</h1>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">نظام إدارة محاسبية متطور</p>
                        </div>
                        <div className="w-12 h-12 bg-rose-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm">SH</div>
                      </div>
                    </div>
                  </div>

                  <table className="w-full text-right border-collapse">
                     <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800 border-b-2 border-zinc-100 dark:border-zinc-700 h-12 text-zinc-500 dark:text-zinc-400 font-black text-[10px] uppercase tracking-widest print:bg-zinc-100 print:text-black">
                           <th className="p-3 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300 w-12 text-center">م</th>
                           <th className="p-3 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300 w-32 text-center">التاريخ</th>
                           <th className="p-3 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300 w-32 text-center">رقم المستند</th>
                           <th className="p-3 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300">الطرف / الحساب</th>
                           <th className="p-3 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300">البيان</th>
                           <th className="p-3 text-center w-40 bg-zinc-100/50 dark:bg-zinc-800/50 print:bg-zinc-200">القيمة</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800 print:divide-zinc-200">
                        {drillDown.data.map((item, idx) => (
                           <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors h-14 font-bold text-sm print:text-black">
                              <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300 text-center font-mono text-zinc-300 print:text-zinc-600">{idx + 1}</td>
                              <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300 text-center font-mono text-zinc-400 print:text-zinc-700">{item.date}</td>
                              <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300 text-center text-primary print:text-black">#{item.number}</td>
                              <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300 text-readable print:text-black">{item.party}</td>
                              <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 print:border-zinc-300 text-zinc-500 font-normal italic text-xs print:text-zinc-600">{item.statement}</td>
                              <td className="p-3 text-center font-mono font-black text-lg text-zinc-900 dark:text-zinc-100 print:text-black">{item.value.toLocaleString()}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  {drillDown.data.length === 0 && (
                     <div className="p-20 text-center">
                        <Search className="w-16 h-16 text-zinc-100 mx-auto mb-4 print:text-zinc-300" />
                        <p className="text-zinc-400 font-black text-lg italic print:text-zinc-500">لا توجد سجلات مسجلة لهذا البند في الفترة المحددة</p>
                     </div>
                  )}
                  
                  <div className="hidden print:flex justify-between items-end mt-12 pt-8 border-t-2 border-zinc-100 text-[10px] font-black text-zinc-400">
                     <div className="flex flex-col gap-1">
                        <span>تاريخ استخراج التقرير آلياً: {new Date().toLocaleString('ar-SA')}</span>
                        <span>النظام المحاسبي لا يقبل التعديل بعد الاعتماد</span>
                     </div>
                     <div className="text-center">
                        <div className="w-48 border-b-2 border-zinc-300 mb-2 mx-auto"></div>
                        <span>توقيع المدير المالي / الختم الرسمي</span>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-zinc-900 text-white flex justify-between items-center px-12 border-t-4 border-primary no-print">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">إجمالي المبلغ المحقق للبند</span>
                     <div className="text-4xl font-mono font-black text-primary">
                        {drillDown.data.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                     </div>
                  </div>
                  <button onClick={() => setDrillDown(null)} className="px-12 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-black text-sm border border-zinc-700 transition-all">إغلاق النافذة</button>
               </div>
            </div>
         </div>
         </>
       )}

       {/* تحليل إضافي */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center group">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"><List className="w-5 h-5 text-zinc-500"/></div>
                <div>
                   <h4 className="font-black text-sm text-readable">تكلفة البضاعة المباعة (COGS)</h4>
                   <p className="text-[10px] text-zinc-400 font-bold">بضاعة أول المدة + صافي مشتريات - بضاعة آخر المدة</p>
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
                   <p className="text-[10px] text-zinc-400 font-bold">صافي المبيعات − التكلفة</p>
                </div>
             </div>
             <div className="text-right">
                <div className="text-3xl font-mono font-black text-primary">
                   {((fin.grossProfit / (fin.netSales || 1)) * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">مؤشر الأداء التجاري</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export default TradingAccountReport;
