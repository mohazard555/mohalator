
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Search, FileDown, Clock, Calendar, Package, FileText } from 'lucide-react';
import { exportToCSV } from '../utils/export';
import { AppSettings } from '../types';

declare var html2pdf: any;

interface SalesReturnHistoryViewProps {
  onBack: () => void;
}

const SalesReturnHistoryView: React.FC<SalesReturnHistoryViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [returns, setReturns] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const savedReturns = localStorage.getItem('sheno_sales_returns');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedReturns) setReturns(JSON.parse(savedReturns));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const filtered = returns.filter(ret => {
    const matchSearch = ret.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       ret.invoiceNumber.includes(searchTerm);
    const matchDate = (!startDate || ret.date >= startDate) && (!endDate || ret.date <= endDate);
    return matchSearch && matchDate;
  });

  const totalFilteredPieces = filtered.reduce((sum, ret) => sum + ret.items.reduce((s: number, i: any) => s + i.quantity, 0), 0);
  const totalFilteredAmount = filtered.reduce((sum, ret) => sum + (ret.totalReturnAmount || 0), 0);

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `سجل_مرتجع_مبيعات_${new Date().toLocaleDateString('ar-SA')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">سجل مرتجعات المبيعات</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="bg-rose-700 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
             <FileText className="w-5 h-5" /> تصدير PDF
          </button>
          <button onClick={() => exportToCSV(filtered, 'sales_returns_history')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
          <button onClick={() => window.print()} className="bg-rose-100 text-rose-700 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-rose-200 transition-all hover:bg-rose-200">
             <Printer className="w-5 h-5" /> طباعة السجل
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 items-center no-print shadow-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث برقم الفاتورة أو اسم الزبون..."
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 pr-12 outline-none font-bold text-readable focus:border-rose-900"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700">
           <Calendar className="w-4 h-4 text-zinc-400" />
           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">من</span>
           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-readable" />
           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إلى</span>
           <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-readable" />
        </div>
      </div>

      <div ref={reportRef} className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-sm print:shadow-none print:border-rose-900 print:rounded-none">
        {/* Report Header for PDF */}
        <div className="flex justify-between items-center bg-rose-900 p-6 rounded-t-xl text-white mb-6 border-b-0 print:m-0">
          <div className="flex items-center gap-4">
            {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
            <div>
              <h1 className="text-2xl font-black">{settings?.companyName || 'SAMLATOR'}</h1>
              <p className="text-xs opacity-80">سجل مرتجع مبيعات مفصل</p>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black underline underline-offset-8 decoration-white/30">تقرير المرتجعات المالية</h2>
            <div className="flex gap-4 justify-center mt-3 text-[9px] font-black">
               <span className="bg-white/20 px-3 py-0.5 rounded">إجمالي القطع: {totalFilteredPieces}</span>
               <span className="bg-white/20 px-3 py-0.5 rounded">القيمة: {totalFilteredAmount.toLocaleString()} {settings?.currencySymbol}</span>
            </div>
          </div>
          <div className="text-left text-xs font-bold space-y-1">
            <p>{settings?.address}</p>
            <p>{new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-right border-collapse text-[10px]">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 font-black uppercase tracking-tighter border-b h-12">
                <th className="p-3 border-l text-center w-12">م</th>
                <th className="p-3 border-l text-center w-16">رقم الفاتورة</th>
                <th className="p-3 border-l text-center w-20">تاريخ المرتجع</th>
                <th className="p-3 border-l text-center">العميل</th>
                <th className="p-3 border-l text-right w-64">الأصناف المرتجعة</th>
                <th className="p-3 border-l text-center w-12">العدد</th>
                <th className="p-3 border-l text-center w-24">إجمالي القيمة</th>
                <th className="p-3 text-right">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold">
              {filtered.map((ret, idx) => (
                <tr key={ret.id} className="hover:bg-rose-50 transition-colors h-12">
                  <td className="p-3 border-l text-center font-mono text-zinc-400">{filtered.length - idx}</td>
                  <td className="p-3 border-l text-center text-rose-700 font-black">#{ret.invoiceNumber}</td>
                  <td className="p-3 border-l text-center font-mono">{ret.date}</td>
                  <td className="p-3 border-l truncate max-w-[120px]">{ret.customerName}</td>
                  <td className="p-3 border-l">
                    <div className="flex flex-col gap-1">
                      {ret.items.map((it: any, i: number) => (
                        <div key={i} className="text-[8px]">• {it.name} ({it.quantity})</div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 border-l text-center font-mono font-black">{ret.items.reduce((s: number,i: any) => s + i.quantity, 0)}</td>
                  <td className="p-3 border-l text-center font-black text-rose-600 font-mono">{ret.totalReturnAmount.toLocaleString()}</td>
                  <td className="p-3 text-zinc-400 font-normal italic truncate max-w-[100px]">{ret.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-10 pt-6 border-t border-zinc-100 flex justify-between items-end text-[9px] font-black text-zinc-400">
           <div className="flex flex-col">
              <span>SAMLATOR SYSTEM | SECURED FINANCIAL LOG</span>
              <span>تاريخ الطباعة: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="text-center">
              <div className="w-32 border-b-2 border-zinc-200 mb-1 mx-auto"></div>
              <span>توقيع قسم المرتجعات</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReturnHistoryView;
