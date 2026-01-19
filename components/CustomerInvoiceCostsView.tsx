
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Printer, FileDown } from 'lucide-react';
import { StockEntry } from '../types';
import { exportToCSV } from '../utils/export';

interface CustomerInvoiceCostsViewProps {
  onBack: () => void;
}

const CustomerInvoiceCostsView: React.FC<CustomerInvoiceCostsViewProps> = ({ onBack }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [filteredData, setFilteredData] = useState<StockEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('sheno_stock_entries');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load entries data");
      }
    }
  }, []);

  const handleSearch = () => {
    if (invoiceNumber) {
      const match = entries.filter(e => e.invoiceNumber === invoiceNumber || e.statement.includes(invoiceNumber));
      setFilteredData(match);
    } else {
      setFilteredData([]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    exportToCSV(filteredData, `Detailed_Costs_Invoice_${invoiceNumber}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Top Header Section matching the image color scheme and layout */}
      <div className="bg-[#9ca3af] p-1 border-2 border-zinc-600 shadow-xl no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          {/* Left: Back Button */}
          <button 
            onClick={onBack}
            className="bg-[#d1a7a7] hover:brightness-105 text-white h-16 flex items-center justify-center font-bold text-xl border-2 border-white/20 transition-all shadow-inner"
          >
            عودة الى الصفحة الرئيسية
          </button>

          {/* Center: Search Field */}
          <div className="flex flex-col bg-[#d1a7a7] border-2 border-white/20 h-16">
            <label className="text-[11px] text-white/90 font-black text-center pt-1 uppercase">ادخل رقم الفاتورة</label>
            <div className="flex px-4 pb-1">
              <input 
                type="text" 
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-white border-2 border-zinc-400 text-zinc-900 text-center font-black text-2xl w-full h-8 outline-none focus:border-rose-900 transition-colors shadow-inner"
                placeholder="2726"
              />
              <button onClick={handleSearch} className="mr-1 bg-white border-2 border-zinc-400 px-2 flex items-center justify-center hover:bg-zinc-100">
                <Search className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
          </div>

          {/* Right: Title */}
          <div className="bg-[#d1a7a7] text-white h-16 flex items-center justify-center font-black text-2xl border-2 border-white/20 shadow-inner">
            تقرير تكاليف فاتورة زبون
          </div>
        </div>
      </div>

      {/* Large Invoice ID display below header */}
      <div className="text-center py-2 bg-zinc-900/5 dark:bg-white/5 border-b-2 border-zinc-300 no-print">
         <span className="text-4xl font-mono font-black text-readable tracking-[0.2em]">{invoiceNumber || '----'}</span>
      </div>

      {/* Spreadsheet Table matching the provided model image */}
      <div className="bg-white rounded-sm border-2 border-zinc-600 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#d1a7a7] text-zinc-900 font-black border-b-2 border-zinc-600">
                <th className="p-2 border-l border-zinc-600 w-24">تاريخ</th>
                <th className="p-2 border-l border-zinc-600 w-20">اليوم</th>
                <th className="p-2 border-l border-zinc-600 w-32">القسم</th>
                <th className="p-2 border-l border-zinc-600 w-24">كود الصنف</th>
                <th className="p-2 border-l border-zinc-600 text-right pr-6">الصنف</th>
                <th className="p-2 border-l border-zinc-600 w-16">الوحدة</th>
                <th className="p-2 border-l border-zinc-600 w-24">السعر</th>
                <th className="p-2 border-l border-zinc-600 w-20">الحركة</th>
                <th className="p-2 border-l border-zinc-600 w-28 font-black">الكميه</th>
                <th className="p-2 border-l border-zinc-600 text-right pr-4">البيان</th>
                <th className="p-2 w-28">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="text-zinc-900 font-bold divide-y divide-zinc-300">
              {filteredData.length === 0 ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-10 bg-white even:bg-[#f3f4f6]">
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j} className="border-l border-zinc-300">
                        {i === 0 && j === 4 && invoiceNumber && (
                           <span className="text-zinc-400 font-normal italic">لم يتم العثور على حركات مستودعية لهذه الفاتورة</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <>
                  {filteredData.map((e, idx) => (
                    <tr key={e.id} className="h-10 bg-white hover:bg-rose-50 transition-colors">
                      <td className="p-2 border-l border-zinc-300 font-mono text-xs">{e.date}</td>
                      <td className="p-2 border-l border-zinc-300">{e.day}</td>
                      <td className="p-2 border-l border-zinc-300 text-xs">{e.department}</td>
                      <td className="p-2 border-l border-zinc-300 font-mono text-rose-800">{e.itemCode}</td>
                      <td className="p-2 border-l border-zinc-300 text-right pr-6">{e.itemName}</td>
                      <td className="p-2 border-l border-zinc-300">{e.unit}</td>
                      <td className="p-2 border-l border-zinc-300 font-mono">{e.price || 0}</td>
                      <td className="p-2 border-l border-zinc-300 text-rose-600">{e.movementType}</td>
                      <td className="p-2 border-l border-zinc-300 font-mono font-black text-lg bg-zinc-50/50">
                        {e.quantity.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                      </td>
                      <td className="p-2 border-l border-zinc-300 text-right pr-4 text-xs font-normal text-zinc-500 italic">
                        {e.statement}
                      </td>
                      <td className="p-2 text-zinc-400 font-normal italic">0</td>
                    </tr>
                  ))}
                  {/* Padding rows to maintain spreadsheet feel if few results */}
                  {Array.from({ length: Math.max(0, 15 - filteredData.length) }).map((_, i) => (
                    <tr key={`pad-${i}`} className="h-10 bg-white even:bg-[#f3f4f6]">
                      {Array.from({ length: 11 }).map((__, j) => <td key={j} className="border-l border-zinc-300"></td>)}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Controls & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#9ca3af]/10 p-6 rounded-3xl border-2 border-zinc-400/50 shadow-inner no-print gap-6">
         <div className="flex gap-12 items-center">
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">إجمالي الكميات</span>
               <span className="text-3xl font-mono font-black text-rose-900">
                 {filteredData.reduce((s, c) => s + c.quantity, 0).toLocaleString(undefined, { minimumFractionDigits: 3 })}
               </span>
            </div>
            <div className="w-px h-12 bg-zinc-300"></div>
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">عدد الأصناف</span>
               <span className="text-3xl font-mono font-black text-zinc-800">{filteredData.length}</span>
            </div>
         </div>

         <div className="flex gap-3">
            <button 
              onClick={handleExport}
              className="bg-zinc-800 text-white px-8 py-3 rounded-xl font-black shadow-xl flex items-center gap-2 hover:bg-zinc-700 transition-all active:scale-95"
            >
              <FileDown className="w-5 h-5" /> تصدير XLSX
            </button>
            <button 
              onClick={handlePrint}
              className="bg-rose-900 text-white px-12 py-3 rounded-xl font-black shadow-2xl flex items-center gap-3 hover:bg-rose-800 transition-all active:scale-95 border-b-4 border-rose-950 active:border-b-0"
            >
              <Printer className="w-6 h-6" /> طباعة التقرير النهائي
            </button>
         </div>
      </div>

      <div className="text-center pb-20 no-print">
         <p className="text-zinc-400 text-xs font-bold italic tracking-wide">
           نظام شينو المحاسبي - وحدة تحليل التكاليف المستودعية الدقيقة بناءً على مستندات الصرف والإدخال.
         </p>
      </div>
    </div>
  );
};

export default CustomerInvoiceCostsView;
