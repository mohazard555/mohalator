
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Printer, LayoutPanelLeft } from 'lucide-react';
import { StockEntry } from '../types';

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

  useEffect(() => {
    if (invoiceNumber) {
      const match = entries.filter(e => e.invoiceNumber === invoiceNumber || e.statement.includes(invoiceNumber));
      setFilteredData(match);
    } else {
      setFilteredData([]);
    }
  }, [invoiceNumber, entries]);

  return (
    <div className="space-y-6">
      {/* Top Control Bar matching image structure */}
      <div className="bg-zinc-700 border border-zinc-600 rounded-lg p-3 flex flex-col md:flex-row items-center gap-4 shadow-xl">
        <button 
          onClick={onBack}
          className="bg-[#d1a7a7] hover:bg-[#c29696] text-zinc-800 px-6 py-2 rounded font-bold shadow-md transition-all whitespace-nowrap"
        >
          عودة إلى الصفحة الرئيسية
        </button>

        <div className="flex-1 flex flex-col items-center">
           <div className="bg-[#d1a7a7] px-6 py-1 rounded-t-md text-zinc-800 font-bold text-sm">ادخل رقم الفاتورة</div>
           <input 
             type="text" 
             value={invoiceNumber}
             onChange={(e) => setInvoiceNumber(e.target.value)}
             className="bg-white border-2 border-[#d1a7a7] text-zinc-900 text-center font-bold text-xl w-64 px-4 py-1 outline-none shadow-inner"
             placeholder="2726"
           />
        </div>

        <div className="bg-[#d1a7a7] px-8 py-3 rounded text-zinc-800 font-bold text-xl shadow-md">
          تقرير تكاليف فاتورة زبون
        </div>
      </div>

      {/* Centered Large Display of Invoice Number */}
      {invoiceNumber && (
        <div className="text-center">
           <span className="text-4xl font-mono font-black text-white tracking-widest">{invoiceNumber}</span>
        </div>
      )}

      {/* Spreadsheet Table View */}
      <div className="overflow-x-auto rounded-lg border border-zinc-700 shadow-2xl bg-[#b5b5b5]">
        <table className="w-full text-center border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-[#d1a7a7] text-zinc-900 font-bold">
              <th className="p-2 border border-zinc-400">تاريخ</th>
              <th className="p-2 border border-zinc-400">اليوم</th>
              <th className="p-2 border border-zinc-400">القسم</th>
              <th className="p-2 border border-zinc-400">كود الصنف</th>
              <th className="p-2 border border-zinc-400">الصنف</th>
              <th className="p-2 border border-zinc-400">الوحدة</th>
              <th className="p-2 border border-zinc-400">السعر</th>
              <th className="p-2 border border-zinc-400">الحركة</th>
              <th className="p-2 border border-zinc-400 font-bold">الكمية</th>
              <th className="p-2 border border-zinc-400">البيان</th>
              <th className="p-2 border border-zinc-400">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="text-zinc-900 font-semibold">
            {filteredData.length === 0 ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={`empty-${i}`} className="bg-[#f0f0f0] even:bg-[#e0e0e0]">
                  {Array.from({ length: 11 }).map((__, j) => (
                    <td key={j} className="p-3 border border-zinc-400 h-10">
                      {i === 0 && j === 4 && invoiceNumber && "لا توجد بيانات لهذه الفاتورة"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <>
                {filteredData.map((e, idx) => (
                  <tr key={e.id} className="bg-white even:bg-[#f2f2f2] hover:bg-rose-100/50 transition-colors">
                    <td className="p-2 border border-zinc-400 font-mono">{e.date}</td>
                    <td className="p-2 border border-zinc-400">{e.day}</td>
                    <td className="p-2 border border-zinc-400">{e.department}</td>
                    <td className="p-2 border border-zinc-400 font-mono text-rose-700">{e.itemCode}</td>
                    <td className="p-2 border border-zinc-400 text-right pr-4">{e.itemName}</td>
                    <td className="p-2 border border-zinc-400">{e.unit}</td>
                    <td className="p-2 border border-zinc-400 font-mono">{e.price || 0}</td>
                    <td className="p-2 border border-zinc-400 text-rose-600 font-bold">{e.movementType}</td>
                    <td className="p-2 border border-zinc-400 font-mono font-bold text-lg">{e.quantity.toFixed(3)}</td>
                    <td className="p-2 border border-zinc-400">{e.statement}</td>
                    <td className="p-2 border border-zinc-400 text-zinc-500 italic">0</td>
                  </tr>
                ))}
                {/* Padding Empty Rows */}
                {Array.from({ length: Math.max(0, 10 - filteredData.length) }).map((_, i) => (
                  <tr key={`padding-${i}`} className="bg-[#f0f0f0] even:bg-[#e0e0e0]">
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j} className="p-3 border border-zinc-400 h-10"></td>
                    ))}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Area */}
      {filteredData.length > 0 && (
        <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 flex justify-between items-center">
           <div className="flex gap-10">
              <div className="flex flex-col">
                <span className="text-zinc-500 text-xs">إجمالي الكميات</span>
                <span className="text-2xl font-mono text-amber-500">{filteredData.reduce((s, c) => s + c.quantity, 0).toFixed(3)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 text-xs">عدد المواد</span>
                <span className="text-2xl font-mono text-white">{filteredData.length}</span>
              </div>
           </div>
           <button className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
             <Printer className="w-5 h-5" /> طباعة تقرير التكلفة
           </button>
        </div>
      )}
    </div>
  );
};

export default CustomerInvoiceCostsView;
