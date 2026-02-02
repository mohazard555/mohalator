
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Search, Printer, FileDown, ChevronDown, Calendar, ImageIcon } from 'lucide-react';
import { StockEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';
import { ImageExportService } from '../utils/ImageExportService';

interface CustomerInvoiceCostsViewProps {
  onBack: () => void;
}

const CustomerInvoiceCostsView: React.FC<CustomerInvoiceCostsViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [filteredData, setFilteredData] = useState<StockEntry[]>([]);
  const [availableInvoiceNumbers, setAvailableInvoiceNumbers] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);

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

  const handleExportImage = async () => {
    if (!reportRef.current || isExportingImage) return;
    setIsExportingImage(true);
    try {
      await ImageExportService.exportAsPng(
        reportRef.current,
        `تكاليف_فاتورة_${invoiceNumber || 'عام'}_${new Date().getTime()}`
      );
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Top Header Section - Replaced grey with Deep Navy for comfort */}
      <div className="bg-[#0f172a] p-1.5 border-2 border-slate-800 shadow-2xl no-print rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 relative z-10">
          <button 
            onClick={onBack}
            className="bg-slate-800 hover:bg-slate-700 text-white h-16 flex items-center justify-center font-black text-lg border border-white/5 transition-all shadow-inner uppercase tracking-tighter rounded-xl"
          >
            <ArrowRight className="w-5 h-5 ml-2" /> العودة للرئيسية
          </button>

          <div className="flex flex-col bg-slate-800 border border-white/5 h-16 px-4 rounded-xl">
            <label className="text-[10px] text-slate-400 font-black text-center pt-1 uppercase tracking-widest">اختر رقم الفاتورة</label>
            <div className="relative pb-1">
              <select 
                value={invoiceNumber}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-center font-black text-xl w-full h-9 outline-none focus:border-primary transition-colors shadow-inner appearance-none cursor-pointer rounded-lg"
              >
                <option value="">-- اختر فاتورة --</option>
                {availableInvoiceNumbers.map(num => (
                  <option key={num} value={num}>فاتورة رقم: {num}</option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="bg-primary text-white h-16 flex items-center justify-center font-black text-2xl border border-white/10 shadow-inner rounded-xl">
            تقرير تكاليف فاتورة زبون
          </div>
        </div>
      </div>

      {/* Main Container for Capture and Print */}
      <div ref={reportRef} className="bg-white rounded-3xl border-2 border-zinc-200 overflow-hidden shadow-2xl export-fix">
        {/* Print Header */}
        <div className="flex justify-between items-center bg-zinc-900 p-8 text-white border-b-4 border-primary">
          <div className="flex items-center gap-4">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" alt="Logo" />
            ) : (
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg">SH</div>
            )}
            <div>
              <h1 className="text-2xl font-black">{settings?.companyName || 'SAMLATOR SYSTEM'}</h1>
              <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">{settings?.companyType}</p>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-black underline decoration-white/20 underline-offset-8">تقرير تكاليف فاتورة زبون</h2>
            <p className="text-lg mt-3 font-bold text-primary">فاتورة رقم: #{invoiceNumber || '---'}</p>
            <div className="flex items-center justify-center gap-2 mt-2 opacity-60 text-[9px] font-bold">
               <Calendar className="w-3 h-3"/> تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}
            </div>
          </div>
          <div className="text-left text-[10px] font-bold space-y-1 opacity-80">
            <p>{settings?.address || 'دمشق، سوريا'}</p>
            <p dir="ltr">{settings?.phone || '093XXXXXXX'}</p>
          </div>
        </div>

        {/* Spreadsheet Table - Rose Header Style */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-[12px]">
            <thead>
              <tr className="bg-rose-900 text-white font-black border-b-2 border-rose-950 h-14 uppercase tracking-tighter">
                <th className="p-2 border-l border-rose-800 w-28">تاريخ الحركة</th>
                <th className="p-2 border-l border-rose-800 w-24">اليوم</th>
                <th className="p-2 border-l border-rose-800 w-24">كود الصنف</th>
                <th className="p-2 border-l border-rose-800 text-right pr-6">اسم الصنف / البيان</th>
                <th className="p-2 border-l border-rose-800 w-20">الوحدة</th>
                <th className="p-2 border-l border-rose-800 w-28">السعر</th>
                <th className="p-2 border-l border-rose-800 w-24">الحركة</th>
                <th className="p-2 border-l border-rose-800 w-32 font-black text-base">الكمية</th>
                <th className="p-2 text-right pr-6">البيان الرسمي للمواد</th>
              </tr>
            </thead>
            <tbody className="text-zinc-900 font-bold divide-y divide-zinc-200">
              {filteredData.length === 0 ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-12 bg-white even:bg-zinc-50/50">
                    {Array.from({ length: 9 }).map((__, j) => <td key={j} className="border-l border-zinc-100"></td>)}
                  </tr>
                ))
              ) : (
                <>
                  {filteredData.map((e) => (
                    <tr key={e.id} className="h-14 bg-white hover:bg-rose-50/30 transition-colors">
                      <td className="p-2 border-l border-zinc-100 font-mono text-[11px] text-zinc-400">{e.date}</td>
                      <td className="p-2 border-l border-zinc-100 text-zinc-500">{e.day}</td>
                      <td className="p-2 border-l border-zinc-100 font-mono text-rose-800 font-black">{e.itemCode}</td>
                      <td className="p-2 border-l border-zinc-100 text-right pr-6 text-zinc-900">{e.itemName}</td>
                      <td className="p-2 border-l border-zinc-100 text-zinc-400 font-normal">{e.unit}</td>
                      <td className="p-2 border-l border-zinc-100 font-mono text-zinc-600">{e.price?.toLocaleString()}</td>
                      <td className="p-2 border-l border-zinc-100 text-rose-600 font-black">{e.movementType}</td>
                      <td className="p-2 border-l border-zinc-100 font-mono font-black text-xl text-primary bg-rose-50/20">{e.quantity.toLocaleString()}</td>
                      <td className="p-2 text-right pr-6 text-[11px] font-normal text-zinc-400 italic leading-relaxed">{e.statement || '-'}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 10 - filteredData.length) }).map((_, i) => (
                    <tr key={`pad-${i}`} className="h-12 bg-white even:bg-zinc-50/50">
                      {Array.from({ length: 9 }).map((__, j) => <td key={j} className="border-l border-zinc-100"></td>)}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer for Image Capture */}
        <div className="p-8 bg-zinc-50 border-t-2 border-zinc-100 flex justify-between items-end">
           <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">اعتماد مدير المستودع</span>
              <div className="w-48 border-b-2 border-zinc-200 mt-8"></div>
           </div>
           <div className="text-left flex flex-col items-end gap-1">
              <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em]">SAMLATOR SECURED LEDGER SYSTEM</span>
              <div className="text-[11px] font-black text-rose-900 italic">Accounting Terminal v4.1</div>
           </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl no-print gap-6">
         <div className="flex gap-12 items-center">
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">إجمالي الكميات</span>
               <span className="text-3xl font-mono font-black text-rose-600">{filteredData.reduce((s, c) => s + c.quantity, 0).toLocaleString()}</span>
            </div>
            <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">عدد البنود</span>
               <span className="text-3xl font-mono font-black text-zinc-800 dark:text-zinc-200">{filteredData.length}</span>
            </div>
         </div>
         <div className="flex gap-3">
            <button 
              onClick={handleExportImage}
              disabled={isExportingImage}
              className="bg-amber-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:bg-amber-500 active:scale-95 transition-all disabled:opacity-50"
            >
              {isExportingImage ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ImageIcon className="w-5 h-5" />}
              حفظ كصورة
            </button>
            <button onClick={() => exportToCSV(filteredData, `costs_inv_${invoiceNumber}`)} className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:bg-emerald-500 transition-all active:scale-95">
              <FileDown className="w-5 h-5" /> تصدير XLSX
            </button>
            <button onClick={() => window.print()} className="bg-rose-900 text-white px-10 py-3.5 rounded-2xl font-black shadow-2xl flex items-center gap-3 hover:bg-rose-800 transition-all active:scale-95">
              <Printer className="w-6 h-6" /> طباعة التقرير
            </button>
         </div>
      </div>
    </div>
  );
};

export default CustomerInvoiceCostsView;
