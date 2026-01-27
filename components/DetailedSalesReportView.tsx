
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Search, X, Box, HardDrive, Calendar, Eye, EyeOff, FileDown, ImageIcon } from 'lucide-react';
import { SalesInvoice, CashEntry, Party, PartyType, AppSettings } from '../types';
import { tafqeet } from '../utils/tafqeet';
import { PdfExportService } from '../utils/PdfExportService';

interface DetailedSalesReportViewProps {
  onBack: () => void;
}

const DetailedSalesReportView: React.FC<DetailedSalesReportViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [customerFilter, setCustomerFilter] = useState('');
  const [parties, setParties] = useState<Party[]>([]);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUsedMaterials, setShowUsedMaterials] = useState(true);

  useEffect(() => {
    const savedInvoices = localStorage.getItem('sheno_sales_invoices');
    const savedCash = localStorage.getItem('sheno_cash_journal');
    const savedParties = localStorage.getItem('sheno_parties');
    const savedSettings = localStorage.getItem('sheno_settings');
    
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    if (savedCash) setCashEntries(JSON.parse(savedCash));
    if (savedParties) setParties(JSON.parse(savedParties).filter((p: Party) => p.type === PartyType.CUSTOMER || p.type === PartyType.BOTH));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesCustomer = !customerFilter || inv.customerName === customerFilter;
    const matchesDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
    return matchesCustomer && matchesDate;
  });

  const reportRows = filteredInvoices.flatMap(inv => 
    inv.items.map(item => ({
      ...item,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.date,
      usedMaterials: inv.usedMaterials || [],
      currencySymbol: inv.currencySymbol || settings?.currencySymbol || 'ل.س'
    }))
  );

  // منطق تقسيم الصفحات للـ PDF: كل 15 سجل سنضع فاصل صفحة (اختياري، html2pdf يدعم الفواصل التلقائية أيضاً)
  const ROWS_PER_PAGE = 20;
  const chunkedRows = [];
  for (let i = 0; i < reportRows.length; i += ROWS_PER_PAGE) {
    chunkedRows.push(reportRows.slice(i, i + ROWS_PER_PAGE));
  }

  const totalSales = filteredInvoices.reduce((s, c) => s + c.totalAmount, 0);
  const totalPaid = cashEntries
    .filter(e => {
      const isSelectedCustomer = !customerFilter || e.partyName === customerFilter || e.statement.includes(customerFilter);
      const isWithinDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
      return isSelectedCustomer && isWithinDate;
    })
    .reduce((s, c) => s + (c.receivedSYP + (c.receivedUSD || 0)), 0);

  const totalRemaining = totalSales - totalPaid;

  const handleExportPDF = async () => {
    if (!reportRef.current || isProcessing) return;
    setIsProcessing(true);
    try {
      await PdfExportService.export({
        element: reportRef.current,
        fileName: `كشف_حساب_${customerFilter || 'عام'}`,
        orientation: 'portrait'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 text-right bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 rounded-3xl min-h-screen text-readable" dir="rtl">
      
      {previewImage && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-full rounded-2xl" alt="Preview" />
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b pb-4 mb-4 no-print gap-4">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 rounded-xl border transition-all shadow-sm">
               <ArrowRight className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-black">كشف حساب زبون مفصل</h1>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={handleExportPDF} 
              disabled={isProcessing}
              className={`bg-rose-900 text-white px-8 py-3 rounded-2xl flex items-center gap-2 font-black shadow-xl hover:brightness-110 transition-all ${isProcessing ? 'opacity-50' : ''}`}
            >
               {isProcessing ? 'جاري التصدير...' : <><FileDown className="w-5 h-5" /> تصدير PDF احترافي</>}
            </button>
            <button onClick={() => window.print()} className="bg-zinc-800 text-white px-8 py-3 rounded-2xl flex items-center gap-2 font-black shadow-lg">
               <Printer className="w-5 h-5" /> طباعة
            </button>
         </div>
      </div>

      {/* Filters (Hidden in PDF) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border no-print shadow-sm">
         <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase">اختر الزبون</label>
            <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border outline-none font-bold text-readable">
              <option value="">-- جميع الزبائن --</option>
              {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
         </div>
         <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase">من تاريخ</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border outline-none font-mono" />
         </div>
         <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase">إلى تاريخ</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border outline-none font-mono" />
         </div>
      </div>

      {/* Report Container (Reference for PDF Export) */}
      <div ref={reportRef} className="export-container-fix p-0 md:p-8 bg-white text-zinc-900">
        
        {/* Header (Repeats on first page only) */}
        <div className="mb-8 border-b-4 border-rose-900 pb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {settings?.logoUrl && <img src={settings.logoUrl} className="w-20 h-20 object-contain" alt="Logo" />}
            <div>
              <h1 className="text-3xl font-black text-rose-900 leading-none">{settings?.companyName}</h1>
              <p className="text-xs text-zinc-500 font-bold uppercase mt-1">{settings?.companyType}</p>
            </div>
          </div>
          <div className="text-left text-xs font-bold text-zinc-400 space-y-1">
            <p className="text-xl text-zinc-800 font-black">كشف حساب تفصيلي</p>
            <p>التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
            <p>العميل: <span className="text-rose-900">{customerFilter || 'كشف عام'}</span></p>
          </div>
        </div>

        {/* Table Sections with chunked logic for clean PDF paging */}
        {chunkedRows.length === 0 ? (
          <div className="py-20 text-center text-zinc-300 font-black text-2xl border-2 border-dashed rounded-3xl">لا توجد سجلات مطابقة</div>
        ) : (
          chunkedRows.map((pageRows, pageIdx) => (
            <div key={pageIdx} className={pageIdx < chunkedRows.length - 1 ? 'pdf-page-break mb-10' : 'mb-10'}>
              <table className="w-full text-right border-collapse text-[11px] mb-4">
                <thead>
                  <tr className="bg-rose-900 text-white font-black border-b-2 border-rose-950 h-10">
                    <th className="p-2 border border-rose-800 w-16 text-center">فاتورة</th>
                    <th className="p-2 border border-rose-800 w-24 text-center">التاريخ</th>
                    <th className="p-2 border border-rose-800">الصنف / المادة</th>
                    {showUsedMaterials && <th className="p-2 border border-rose-800">المواد المستخدمة</th>}
                    <th className="p-2 border border-rose-800 w-16 text-center">العدد</th>
                    <th className="p-2 border border-rose-800 w-32 text-center">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="font-bold">
                  {pageRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="h-12 border-b border-zinc-200 even:bg-zinc-50">
                      <td className="p-2 border text-center font-mono text-rose-700">#{row.invoiceNumber}</td>
                      <td className="p-2 border text-center text-zinc-500 font-mono">{row.invoiceDate}</td>
                      <td className="p-2 border">{row.name}</td>
                      {showUsedMaterials && (
                        <td className="p-2 border">
                           <div className="flex flex-wrap gap-1">
                              {row.usedMaterials.map((m: any, i: number) => (
                                <span key={i} className="bg-zinc-100 px-1 py-0.5 rounded-sm text-[8px] border border-zinc-200">{m.name} ({m.quantity})</span>
                              ))}
                           </div>
                        </td>
                      )}
                      <td className="p-2 border text-center font-mono">{row.quantity}</td>
                      <td className="p-2 border text-center font-black text-emerald-700">{(row.quantity * row.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* تذييل الصفحة الاختياري */}
              <div className="flex justify-between items-center text-[9px] text-zinc-400 font-black uppercase mt-2 opacity-50">
                <span>صفحة رقم {pageIdx + 1}</span>
                <span>نظام شينو للمحاسبة الاحترافي</span>
              </div>
            </div>
          )
        ))}

        {/* Totals Summary (Always on last page) */}
        <div className="mt-8 border-t-4 border-rose-900 pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-50 p-6 rounded-2xl border flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">إجمالي المبيعات</span>
              <span className="text-3xl font-mono font-black text-rose-900">{totalSales.toLocaleString()}</span>
            </div>
            <div className="bg-zinc-50 p-6 rounded-2xl border flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">المبالغ المسددة</span>
              <span className="text-3xl font-mono font-black text-emerald-700">{totalPaid.toLocaleString()}</span>
            </div>
            <div className="bg-rose-900 p-6 rounded-2xl text-white flex flex-col items-center shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">الرصيد المتبقي</span>
              <span className="text-3xl font-mono font-black">{totalRemaining.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
             <span className="text-[9px] font-black text-zinc-400 uppercase block mb-1">التفقيط المالي للرصيد المتبقي</span>
             <div className="text-lg font-black italic text-rose-900">
                {tafqeet(totalRemaining, settings?.currency || 'ليرة سورية')}
             </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex justify-between items-end text-[10px] font-black text-zinc-400">
           <div className="flex flex-col">
              <span>SAMLATOR SECURED LEDGER SYSTEM</span>
              <span>تاريخ التصدير: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="flex flex-col items-center">
              <div className="w-40 border-b border-zinc-200 mb-2"></div>
              <span>توقيع المدير المعتمد</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedSalesReportView;
