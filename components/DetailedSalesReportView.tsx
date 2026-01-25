
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Search, FileOutput, X, Users, Box, HardDrive, Calendar, Eye, EyeOff, FileDown } from 'lucide-react';
import { SalesInvoice, InvoiceItem, CashEntry, Party, PartyType, AppSettings } from '../types';
import { tafqeet } from '../utils/tafqeet';

declare var html2pdf: any;

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

  const totalSales = filteredInvoices.reduce((s, c) => s + c.totalAmount, 0);
  const totalPaid = cashEntries
    .filter(e => {
      const isSelectedCustomer = !customerFilter || e.partyName === customerFilter || e.statement.includes(customerFilter);
      const isWithinDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
      return isSelectedCustomer && isWithinDate;
    })
    .reduce((s, c) => s + (c.receivedSYP + (c.receivedUSD || 0)), 0);

  const totalRemaining = totalSales - totalPaid;
  const totalItemsCount = reportRows.reduce((s, c) => s + c.quantity, 0);
  const totalInvoicesCount = filteredInvoices.length;

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `كشف_حساب_${customerFilter || 'عام'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-4 text-right bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 rounded-3xl shadow-2xl min-h-screen text-readable border border-zinc-200 dark:border-zinc-800 print:bg-white print:border-none print:shadow-none" dir="rtl">
      
      {previewImage && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 md:p-20 animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-10 right-10 text-white hover:text-rose-500 transition-colors no-print">
            <X className="w-10 h-10" />
          </button>
          <img src={previewImage} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" onClick={(e) => e.stopPropagation()} alt="Full Preview" />
        </div>
      )}

      {/* Print Header Visible ONLY in Print/PDF Mode */}
      <div className="print-only print-header flex justify-between items-center bg-rose-900 p-6 rounded-t-xl text-white mb-0 border-b-0">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
          <div>
            <h1 className="text-2xl font-black">{settings?.companyName}</h1>
            <p className="text-xs opacity-80">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black underline decoration-white/30 underline-offset-8">كشف حساب زبون تفصيلي</h2>
          <div className="flex gap-4 justify-center mt-3">
             <span className="bg-white/20 px-3 py-0.5 rounded text-[10px] font-black">إجمالي القطع: {totalItemsCount}</span>
             <span className="bg-white/20 px-3 py-0.5 rounded text-[10px] font-black">عدد الفواتير: {totalInvoicesCount}</span>
          </div>
          <p className="text-[10px] mt-1 opacity-80 font-bold">{customerFilter || 'جميع الزبائن'}</p>
          <p className="text-[9px] mt-1 opacity-70 flex items-center justify-center gap-1"><Calendar className="w-3 h-3"/> {startDate} ← {endDate}</p>
        </div>
        <div className="text-left text-xs font-bold space-y-1">
          <p>{settings?.address}</p>
          <p>{settings?.phone}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between border-b-2 border-zinc-200 dark:border-zinc-800 pb-4 mb-4 no-print gap-4">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-all">
               <ArrowRight className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
               {settings?.logoUrl ? (
                 <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded" />
               ) : (
                  <div className="bg-rose-900 p-2 rounded shadow-sm border border-zinc-300 w-10 h-10 flex items-center justify-center text-white font-black text-xs">
                     {settings?.companyName.substring(0,2).toUpperCase() || 'SH'}
                  </div>
               )}
               <div className="flex flex-col">
                 <span className="text-readable font-black text-lg leading-none">{settings?.companyName || 'SAMLATOR'}</span>
                 <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest">{settings?.address || 'Accounting System'}</span>
               </div>
            </div>
         </div>
         <h1 className="text-2xl font-black flex-1 text-center tracking-tight text-readable">كشف حساب زبون مفصل</h1>
         <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-rose-900 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-black shadow-lg hover:brightness-110 transition-all">
               <Printer className="w-5 h-5" /> طباعة التقرير
            </button>
         </div>
      </div>

      {/* Filter & Privacy Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden rounded-2xl no-print">
         <div className="col-span-1 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="flex border-b-2 border-zinc-200 dark:border-zinc-800 flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 flex-1 p-2 text-xs font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">اجمالي عدد القطع</div>
               <div className="flex-1 p-2 text-center font-black text-2xl flex items-center justify-center text-readable">{totalItemsCount}</div>
            </div>
            <div className="flex flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 flex-1 p-2 text-xs font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">اجمالي عدد الفواتير</div>
               <div className="flex-1 p-2 text-center font-black text-2xl flex items-center justify-center text-readable">{totalInvoicesCount}</div>
            </div>
         </div>

         <div className="col-span-1 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="flex border-b-2 border-zinc-200 dark:border-zinc-800 flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 w-32 p-2 text-xs font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">بداية التاريخ</div>
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 text-center font-mono outline-none text-sm bg-transparent text-readable" />
            </div>
            <div className="flex flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 w-32 p-2 text-xs font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">نهاية التاريخ</div>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 text-center font-mono outline-none text-sm bg-transparent text-readable" />
            </div>
         </div>

         <div className="col-span-1 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-800/50">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 text-xs font-bold text-center border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-2 text-readable">
               <Users className="w-3 h-3"/> اختيار الزبون
            </div>
            <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="flex-1 text-center font-black text-xl outline-none py-4 appearance-none cursor-pointer bg-white dark:bg-zinc-900 text-rose-800 dark:text-rose-400">
              <option value="">-- عرض جميع الزبائن --</option>
              {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
         </div>

         <div className="col-span-1 flex flex-col items-center justify-center p-4 gap-3 bg-zinc-100/50 dark:bg-zinc-800/30">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إعدادات الخصوصية</span>
            <button onClick={() => setShowUsedMaterials(!showUsedMaterials)} className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs transition-all w-full justify-center ${showUsedMaterials ? 'bg-emerald-600 text-white shadow-lg' : 'bg-rose-600 text-white shadow-lg'}`}>
               {showUsedMaterials ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
               {showUsedMaterials ? 'إظهار عمود المواد' : 'إخفاء عمود المواد'}
            </button>
         </div>
      </div>

      {/* Report Content Ref (Used for PDF Export and Print) */}
      <div ref={reportRef} className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 shadow-lg rounded-2xl overflow-hidden print:border-rose-900 print:rounded-none p-4 md:p-8">
        
        {/* Header visible inside Ref (Used for PDF) */}
        <div className="print-only mb-8">
           <div className="flex justify-between items-center border-b-2 border-rose-900 pb-4">
              <div className="flex items-center gap-4">
                 {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
                 <div>
                    <h1 className="text-2xl font-black">{settings?.companyName}</h1>
                    <p className="text-xs text-zinc-500">{settings?.companyType}</p>
                 </div>
              </div>
              <div className="text-center">
                 <h2 className="text-2xl font-black underline decoration-rose-900 underline-offset-8">كشف حساب زبون تفصيلي</h2>
                 <p className="text-[10px] mt-2 font-bold">{customerFilter || 'جميع الزبائن'}</p>
              </div>
              <div className="text-left text-xs font-bold text-zinc-500">
                 <p>{settings?.address}</p>
                 <p>{new Date().toLocaleDateString('ar-SA')}</p>
              </div>
           </div>
        </div>

        <table className="w-full text-right border-collapse text-[10px]">
          <thead>
            <tr className="bg-rose-900 text-white font-black border-b-2 border-rose-950 h-10">
              <th className="p-1 border border-rose-800 w-12 text-center">فاتورة</th>
              <th className="p-1 border border-rose-800 w-20 text-center">التاريخ</th>
              <th className="p-1 border border-rose-800 text-right pr-4">الصنف وتفاصيله</th>
              {showUsedMaterials && <th className="p-1 border border-rose-800 text-right pr-4">المواد المستخدمة</th>}
              <th className="p-1 border border-rose-800 w-12 text-center">العدد</th>
              <th className="p-1 border border-rose-800 w-24 text-center">السعر</th>
              <th className="p-1 border border-rose-800 w-24 text-center">المجموع</th>
            </tr>
          </thead>
          <tbody className="text-readable">
            {reportRows.length === 0 ? (
              Array.from({ length: 15 }).map((_, i) => (
                <tr key={i} className="h-8 border-b border-zinc-100 dark:border-zinc-800">
                  {Array.from({ length: showUsedMaterials ? 7 : 6 }).map((__, j) => <td key={j} className="border border-zinc-100 dark:border-zinc-800"></td>)}
                </tr>
              ))
            ) : (
              reportRows.map((row, idx) => (
                <tr key={idx} className="h-10 border-b border-zinc-100 dark:border-zinc-800 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">
                  <td className="p-1 border-zinc-100 dark:border-zinc-800 font-mono text-rose-700 dark:text-rose-400 text-center">#{row.invoiceNumber}</td>
                  <td className="p-1 border-zinc-100 dark:border-zinc-800 font-mono text-center text-zinc-400">{row.invoiceDate}</td>
                  <td className="p-1 border-zinc-100 dark:border-zinc-800 text-right pr-4">
                    <div className="flex items-center gap-2">
                       {row.image && <img src={row.image} className="w-6 h-6 object-cover rounded shadow-sm border border-zinc-200 cursor-zoom-in" onClick={() => setPreviewImage(row.image!)} />}
                       <div className="flex flex-col">
                          <span className="text-readable">{row.name}</span>
                          {row.serialNumber && <span className="text-[8px] text-zinc-400 font-mono uppercase">SN: {row.serialNumber}</span>}
                       </div>
                    </div>
                  </td>
                  {showUsedMaterials && (
                    <td className="p-1 border-zinc-100 dark:border-zinc-800 text-right pr-4 bg-zinc-50/50 dark:bg-zinc-800/30 print:bg-transparent">
                       <div className="flex flex-wrap gap-1">
                          {row.usedMaterials.length > 0 ? (
                            row.usedMaterials.map((m: any, i: number) => (
                              <span key={i} className="bg-rose-500/5 text-rose-600 dark:text-rose-300 px-1.5 py-0.5 rounded-sm border border-rose-200 dark:border-rose-900/50 text-[8px] flex items-center gap-1">
                                 <HardDrive className="w-2 h-2 opacity-50"/> {m.name} ({m.quantity})
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-300 dark:text-zinc-600 font-normal italic">لا يوجد مواد</span>
                          )}
                       </div>
                    </td>
                  )}
                  <td className="p-1 border-zinc-100 dark:border-zinc-800 font-mono text-center text-sm">{row.quantity}</td>
                  <td className="p-1 border-zinc-100 dark:border-zinc-800 font-mono text-center">{row.price.toLocaleString()}</td>
                  <td className="p-1 border-zinc-100 dark:border-zinc-800 font-mono font-black text-center text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 print:bg-transparent">{(row.quantity * row.price).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="border-t-4 border-rose-900 mt-4">
          <div className="flex border-b border-zinc-200 dark:border-zinc-700 h-12 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
             <div className="bg-rose-100 dark:bg-rose-900/30 w-64 border-l border-zinc-200 dark:border-zinc-800 p-3 font-black text-center text-sm">اجمالي المبيعات</div>
             <div className="flex-1 p-2 font-mono font-black text-2xl px-8 text-rose-900 dark:text-rose-400">
               {totalSales.toLocaleString()} <span className="text-sm font-bold opacity-60">{settings?.currencySymbol}</span>
             </div>
          </div>
          <div className="flex border-b border-zinc-200 dark:border-zinc-700 h-12 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
             <div className="bg-emerald-100 dark:bg-emerald-900/30 w-64 border-l border-zinc-200 dark:border-zinc-800 p-3 font-black text-center text-sm">الرصيد المدفوع</div>
             <div className="flex-1 p-2 font-mono font-black text-2xl px-8 text-emerald-700 dark:text-emerald-400">
               {totalPaid.toLocaleString()} <span className="text-sm font-bold opacity-60">{settings?.currencySymbol}</span>
             </div>
          </div>
          <div className="flex h-12 items-center bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all">
             <div className="bg-rose-200 dark:bg-rose-800/40 w-64 border-l border-zinc-200 dark:border-zinc-800 p-3 font-black text-center text-sm">الرصيد المتبقي</div>
             <div className="flex-1 p-2 font-mono font-black text-2xl px-8 text-rose-700 dark:text-rose-300">
               {totalRemaining.toLocaleString()} <span className="text-sm font-bold opacity-60">{settings?.currencySymbol}</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-4 border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-md mt-6 print:border-rose-900">
           <div className="col-span-3 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 text-[10px] font-bold">
              <div className="p-2.5 px-8 text-readable underline underline-offset-4 decoration-zinc-200 dark:decoration-zinc-700">{tafqeet(totalSales, settings?.currency || 'ليرة سورية')}</div>
              <div className="p-2.5 px-8 text-readable underline underline-offset-4 decoration-zinc-200 dark:decoration-zinc-700">{tafqeet(totalPaid, settings?.currency || 'ليرة سورية')}</div>
              <div className="p-2.5 px-8 text-rose-800 dark:text-rose-400 underline underline-offset-4 decoration-rose-200 dark:decoration-rose-900 font-black">{tafqeet(totalRemaining, settings?.currency || 'ليرة سورية')}</div>
           </div>
           <div className="col-span-1 border-r border-zinc-200 dark:border-zinc-800 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 font-black text-[10px] bg-zinc-50 dark:bg-zinc-800/50 print:border-rose-900">
              <div className="p-2.5 pr-6 text-left border-l border-zinc-100 dark:border-zinc-800">المبيع كتابةً</div>
              <div className="p-2.5 pr-6 text-left border-l border-zinc-100 dark:border-zinc-800">المدفوع كتابةً</div>
              <div className="p-2.5 pr-6 text-left border-l border-zinc-100 dark:border-zinc-800">المتبقي كتابةً</div>
           </div>
        </div>

        {/* Print Only Footer */}
        <div className="print-only mt-10 pt-6 border-t border-zinc-100 flex justify-between items-end text-[9px] font-black text-zinc-400">
           <div className="flex flex-col">
              <span>SAMLATOR SYSTEM | SECURED FINANCIAL LOG</span>
              <span>تاريخ الطباعة: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="text-center">
              <div className="w-32 border-b-2 border-zinc-200 mb-1 mx-auto"></div>
              <span>توقيع المدير</span>
           </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center no-print pt-6 pb-20">
         <button onClick={onBack} className="bg-zinc-100 dark:bg-zinc-800 text-readable px-8 py-3 rounded-2xl font-bold shadow-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 flex items-center gap-2 border border-zinc-200 dark:border-zinc-700">
            العودة للرئيسية
         </button>
         <button onClick={handleExportPDF} className="bg-rose-900 text-white px-12 py-3 rounded-2xl flex items-center gap-2 font-black shadow-xl hover:bg-rose-800 transition-all active:scale-95">
            <FileDown className="w-6 h-6" /> تصدير PDF
         </button>
      </div>
    </div>
  );
};

export default DetailedSalesReportView;
