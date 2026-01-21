
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Printer, FileDown, ChevronDown, Calendar } from 'lucide-react';
import { StockEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

interface CustomerInvoiceCostsViewProps {
  onBack: () => void;
}

const CustomerInvoiceCostsView: React.FC<CustomerInvoiceCostsViewProps> = ({ onBack }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [filteredData, setFilteredData] = useState<StockEntry[]>([]);
  const [availableInvoiceNumbers, setAvailableInvoiceNumbers] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const savedStock = localStorage.getItem('sheno_stock_entries');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedStock) {
      try {
        const parsed: StockEntry[] = JSON.parse(savedStock);
        setEntries(parsed);
        const uniqueInvoices = Array.from(new Set(parsed.map(e => e.invoiceNumber).filter(n => n && n !== ''))).sort();
        setAvailableInvoiceNumbers(uniqueInvoices);
        if (uniqueInvoices.length > 0 && !invoiceNumber) {
          handleSearch(uniqueInvoices[0]);
        }
      } catch (e) {
        console.error("Failed to load entries data");
      }
    }
  }, []);

  const handleSearch = (number: string) => {
    setInvoiceNumber(number);
    if (number) {
      const match = entries.filter(e => e.invoiceNumber === number);
      setFilteredData(match);
    } else {
      setFilteredData([]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Print Header */}
      <div className="print-only print-header flex justify-between items-center bg-zinc-900 p-6 rounded-t-xl text-white mb-0 border-b-4 border-primary">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
          <div>
            <h1 className="text-2xl font-black">{settings?.companyName}</h1>
            <p className="text-xs opacity-80">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black underline decoration-white/30 underline-offset-8">تقرير تكاليف فاتورة زبون</h2>
          <p className="text-lg mt-2 font-bold text-primary">فاتورة رقم: #{invoiceNumber || '---'}</p>
          <p className="text-[9px] mt-2 opacity-80 flex items-center justify-center gap-1"><Calendar className="w-3 h-3"/> تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        <div className="text-left text-xs font-bold space-y-1">
          <p>{settings?.address}</p>
          <p>{settings?.phone}</p>
        </div>
      </div>

      {/* Top Header Section - Matching Image Style (Greyish header) */}
      <div className="bg-[#9ca3af] p-1 border-2 border-zinc-600 shadow-xl no-print rounded-t-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          <button 
            onClick={onBack}
            className="bg-[#d1a7a7] hover:brightness-105 text-white h-16 flex items-center justify-center font-black text-lg border-2 border-white/20 transition-all shadow-inner uppercase tracking-tighter"
          >
            العودة للرئيسية
          </button>

          <div className="flex flex-col bg-[#d1a7a7] border-2 border-white/20 h-16 px-4">
            <label className="text-[10px] text-white/90 font-black text-center pt-1 uppercase tracking-widest">اختر رقم الفاتورة</label>
            <div className="relative pb-1">
              <select 
                value={invoiceNumber}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-white border-2 border-zinc-400 text-zinc-900 text-center font-black text-xl w-full h-9 outline-none focus:border-rose-900 transition-colors shadow-inner appearance-none cursor-pointer"
              >
                <option value="">-- اختر فاتورة --</option>
                {availableInvoiceNumbers.map(num => (
                  <option key={num} value={num}>فاتورة رقم: {num}</option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="bg-[#d1a7a7] text-white h-16 flex items-center justify-center font-black text-2xl border-2 border-white/20 shadow-inner">
            تقرير تكاليف فاتورة زبون
          </div>
        </div>
      </div>

      {/* Spreadsheet Table - Rose Header Style */}
      <div className="bg-white rounded-b-2xl border-2 border-zinc-300 overflow-hidden shadow-2xl print:border-zinc-900 print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-[12px]">
            <thead>
              <tr className="bg-rose-900 text-white font-black border-b-2 border-rose-950 h-12 uppercase tracking-tighter print:bg-zinc-900 print:text-white">
                <th className="p-2 border-l border-rose-800 w-24 print:border-zinc-700">تاريخ</th>
                <th className="p-2 border-l border-rose-800 w-20 print:border-zinc-700">اليوم</th>
                <th className="p-2 border-l border-rose-800 w-24 print:border-zinc-700">كود الصنف</th>
                <th className="p-2 border-l border-rose-800 text-right pr-6 print:border-zinc-700">اسم الصنف</th>
                <th className="p-2 border-l border-rose-800 w-16 print:border-zinc-700">الوحدة</th>
                <th className="p-2 border-l border-rose-800 w-24 print:border-zinc-700">السعر</th>
                <th className="p-2 border-l border-rose-800 w-20 print:border-zinc-700">الحركة</th>
                <th className="p-2 border-l border-rose-800 w-28 font-black text-sm print:border-zinc-700">الكمية</th>
                <th className="p-2 border-l border-rose-800 text-right pr-4 print:border-zinc-700">البيان</th>
                <th className="p-2 w-28">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="text-zinc-900 font-bold divide-y divide-zinc-200 print:divide-zinc-300">
              {filteredData.length === 0 ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-10 bg-white even:bg-zinc-50">
                    {Array.from({ length: 10 }).map((__, j) => <td key={j} className="border-l border-zinc-200"></td>)}
                  </tr>
                ))
              ) : (
                <>
                  {filteredData.map((e, idx) => (
                    <tr key={e.id} className="h-12 bg-white hover:bg-rose-50 transition-colors">
                      <td className="p-2 border-l border-zinc-200 font-mono text-[10px]">{e.date}</td>
                      <td className="p-2 border-l border-zinc-200">{e.day}</td>
                      <td className="p-2 border-l border-zinc-200 font-mono text-rose-800 font-black">{e.itemCode}</td>
                      <td className="p-2 border-l border-zinc-200 text-right pr-6">{e.itemName}</td>
                      <td className="p-2 border-l border-zinc-200 text-zinc-500 font-normal">{e.unit}</td>
                      <td className="p-2 border-l border-zinc-200 font-mono">{e.price?.toLocaleString()}</td>
                      <td className="p-2 border-l border-zinc-200 text-rose-600 font-black">{e.movementType}</td>
                      <td className="p-2 border-l border-zinc-200 font-mono font-black text-lg bg-zinc-50/50 print:bg-transparent">{e.quantity.toLocaleString()}</td>
                      <td className="p-2 border-l border-zinc-200 text-right pr-4 text-[11px] font-normal text-zinc-500 italic">{e.statement}</td>
                      <td className="p-2 text-zinc-300 font-normal italic">---</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 10 - filteredData.length) }).map((_, i) => (
                    <tr key={`pad-${i}`} className="h-10 bg-white even:bg-zinc-50">
                      {Array.from({ length: 10 }).map((__, j) => <td key={j} className="border-l border-zinc-200"></td>)}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-zinc-100 p-6 rounded-3xl border-2 border-zinc-200 shadow-inner no-print gap-6">
         <div className="flex gap-12 items-center">
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">إجمالي الكميات</span>
               <span className="text-3xl font-mono font-black text-rose-900">{filteredData.reduce((s, c) => s + c.quantity, 0).toLocaleString()}</span>
            </div>
            <div className="w-px h-12 bg-zinc-300"></div>
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">عدد الأسطر</span>
               <span className="text-3xl font-mono font-black text-zinc-800">{filteredData.length}</span>
            </div>
         </div>
         <div className="flex gap-3">
            <button onClick={() => exportToCSV(filteredData, `costs_inv_${invoiceNumber}`)} className="bg-zinc-800 text-white px-8 py-3 rounded-xl font-black shadow-xl flex items-center gap-2 hover:bg-zinc-700 transition-all">
              <FileDown className="w-5 h-5" /> تصدير XLSX
            </button>
            <button onClick={() => window.print()} className="bg-rose-900 text-white px-12 py-3 rounded-xl font-black shadow-2xl flex items-center gap-3 hover:bg-rose-800 transition-all">
              <Printer className="w-6 h-6" /> طباعة التقرير
            </button>
         </div>
      </div>
    </div>
  );
};

export default CustomerInvoiceCostsView;
