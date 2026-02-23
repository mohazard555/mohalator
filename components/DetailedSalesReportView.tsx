
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Search, FileOutput, X, Users, Box, HardDrive, Calendar, Eye, EyeOff, FileDown, ImageIcon, Calculator, FileStack, Coins, CreditCard, Layers } from 'lucide-react';
import { SalesInvoice, InvoiceItem, CashEntry, Party, PartyType, AppSettings, StockEntry } from '../types';
import { tafqeet } from '../utils/tafqeet';
import { ImageExportService } from '../utils/ImageExportService';

declare var html2pdf: any;

interface DetailedSalesReportViewProps {
  onBack: () => void;
}

const DetailedSalesReportView: React.FC<DetailedSalesReportViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [customerFilter, setCustomerFilter] = useState('');
  const [parties, setParties] = useState<Party[]>([]);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);
  
  // خيارات العرض المتقدمة
  const [showStatement, setShowStatement] = useState(true);
  const [showSoldItems, setShowSoldItems] = useState(true);
  const [showUsedMaterials, setShowUsedMaterials] = useState(false); // مخفي افتراضياً للخصوصية
  const [currencyMode, setCurrencyMode] = useState<'primary' | 'secondary'>('primary');

  useEffect(() => {
    const activeId = localStorage.getItem('sheno_active_company_id') || 'default';
    const prefix = activeId === 'default' ? 'sheno' : `sheno_${activeId}`;

    const savedInvoices = localStorage.getItem(`${prefix}_sales_invoices`);
    const savedReturns = localStorage.getItem(`${prefix}_sales_returns`);
    const savedCash = localStorage.getItem(`${prefix}_cash_journal`);
    const savedParties = localStorage.getItem(`${prefix}_parties`);
    const savedSettings = localStorage.getItem(`${prefix}_settings`);
    
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    if (savedReturns) setSalesReturns(JSON.parse(savedReturns));
    if (savedCash) setCashEntries(JSON.parse(savedCash));
    if (savedParties) setParties(JSON.parse(savedParties).filter((p: Party) => p.type === PartyType.CUSTOMER || p.type === PartyType.BOTH));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const getCustomerMovements = () => {
    const movements: any[] = [];
    const targetSymbol = currencyMode === 'primary' ? settings?.currencySymbol : settings?.secondaryCurrencySymbol;
    
    cashEntries.filter(entry => {
      const matchName = entry.partyName === customerFilter;
      const matchDate = (!startDate || entry.date >= startDate) && (!endDate || entry.date <= endDate);
      const hasValue = currencyMode === 'primary' ? (entry.receivedSYP > 0 || entry.paidSYP > 0) : (entry.receivedUSD > 0 || entry.paidUSD > 0);
      return matchName && matchDate && hasValue;
    }).forEach(entry => {
      const debit = currencyMode === 'primary' ? (entry.paidSYP || 0) : (entry.paidUSD || 0);
      const credit = currencyMode === 'primary' ? (entry.receivedSYP || 0) : (entry.receivedUSD || 0);
      
      // محاولة جلب تفاصيل المواد إذا كان القيد مرتبطاً بفاتورة
      let soldItems: any[] = [];
      let usedMaterials: any[] = [];
      
      if (entry.voucherNumber) {
        if (entry.type === 'بيع') {
          const inv = invoices.find(i => i.invoiceNumber === entry.voucherNumber);
          if (inv) {
            soldItems = inv.items;
            usedMaterials = inv.usedMaterials || [];
          }
        } else if (entry.type === 'مرتجع') {
          const ret = salesReturns.find(r => r.invoiceNumber === entry.voucherNumber);
          if (ret) {
            soldItems = ret.items;
            usedMaterials = ret.returnedMaterialsList || [];
          }
        }
      }

      movements.push({
        date: entry.date,
        type: entry.type || 'قيد',
        number: entry.voucherNumber || '---',
        statement: entry.statement,
        soldItems,
        usedMaterials,
        debit,
        credit,
        ref: entry.id
      });
    });

    return movements.sort((a, b) => a.date.localeCompare(b.date));
  };

  const movements = customerFilter ? getCustomerMovements() : [];
  const totalDebit = movements.reduce((s, c) => s + c.debit, 0);
  const totalCredit = movements.reduce((s, c) => s + c.credit, 0);
  
  // الرصيد يحسب دائماً كالتالي: مجموع المدين - مجموع الدائن
  // القيود الافتتاحية أصبحت جزءاً من دفتر القيود
  const finalBalance = totalDebit - totalCredit;

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `كشف_حساب_زبون_${customerFilter || 'عام'}_${currencyMode}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const activeCurrencyName = currencyMode === 'primary' ? (settings?.currency || 'ليرة سورية') : (settings?.secondaryCurrency || 'دولار أمريكي');
  const activeCurrencySymbol = currencyMode === 'primary' ? (settings?.currencySymbol || 'ل.س') : (settings?.secondaryCurrencySymbol || '$');

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

      <div className="flex flex-col md:flex-row items-center justify-between border-b-2 border-zinc-200 dark:border-zinc-800 pb-4 mb-4 no-print gap-4">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-all">
               <ArrowRight className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
               <div className="bg-rose-900 p-2 rounded shadow-sm border border-zinc-300 w-10 h-10 flex items-center justify-center text-white font-black text-xs">
                  {settings?.companyName.substring(0,2).toUpperCase() || 'SH'}
               </div>
               <div className="flex flex-col">
                 <span className="text-readable font-black text-lg leading-none">{settings?.companyName || 'FINEXA'}</span>
                 <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest">{settings?.address || 'Accounting System'}</span>
               </div>
            </div>
         </div>
         <h1 className="text-2xl font-black flex-1 text-center tracking-tight text-readable underline decoration-rose-900/20 underline-offset-4">كشف حساب زبون تفصيلي (مطور)</h1>
         <div className="flex gap-2">
            <button 
              onClick={() => ImageExportService.exportAsPng(reportRef.current!, 'Customer_Statement')} 
              disabled={isExportingImage}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-black shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
            >
               {isExportingImage ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ImageIcon className="w-5 h-5" />}
               حفظ كصورة
            </button>
            <button onClick={() => window.print()} className="bg-rose-900 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-black shadow-lg hover:brightness-110 transition-all">
               <Printer className="w-5 h-5" /> طباعة
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden rounded-3xl no-print shadow-sm">
         <div className="col-span-1 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="flex border-b-2 border-zinc-200 dark:border-zinc-800 flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 flex-1 p-2 text-[9px] font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">اجمالي عدد الحركات</div>
               <div className="flex-1 p-2 text-center font-black text-2xl flex items-center justify-center text-readable">{movements.length}</div>
            </div>
            <div className="flex flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 flex-1 p-2 text-[9px] font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">اجمالي عدد الفواتير</div>
               <div className="flex-1 p-2 text-center font-black text-2xl flex items-center justify-center text-readable">
                 {movements.filter(m => m.type === 'مبيع').length}
               </div>
            </div>
         </div>

         <div className="col-span-1 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="flex border-b-2 border-zinc-200 dark:border-zinc-800 flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 w-24 p-2 text-[9px] font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">من تاريخ</div>
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 text-center font-mono outline-none text-xs bg-transparent text-readable" />
            </div>
            <div className="flex flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 w-24 p-2 text-[9px] font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">إلى تاريخ</div>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 text-center font-mono outline-none text-xs bg-transparent text-readable" />
            </div>
         </div>

         <div className="col-span-1 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-800/50">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 text-[9px] font-bold text-center border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-2 text-readable">
               <Users className="w-3 h-3"/> اختيار الزبون
            </div>
            <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="flex-1 text-center font-black text-lg outline-none py-4 appearance-none cursor-pointer bg-white dark:bg-zinc-900 text-rose-800 dark:text-rose-400 px-4">
              <option value="">-- اختر زبون --</option>
              {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
         </div>

         <div className="col-span-1 flex flex-col p-4 gap-2 bg-zinc-100/50 dark:bg-zinc-800/30">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center mb-1">إعدادات العرض والخصوصية</span>
            <div className="grid grid-cols-2 gap-2">
               <button onClick={() => setShowStatement(!showStatement)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[9px] transition-all justify-center ${showStatement ? 'bg-zinc-800 text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'}`}>
                  {showStatement ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  البيان
               </button>
               <button onClick={() => setShowSoldItems(!showSoldItems)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[9px] transition-all justify-center ${showSoldItems ? 'bg-zinc-800 text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'}`}>
                  {showSoldItems ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  الأصناف
               </button>
               <button onClick={() => setShowUsedMaterials(!showUsedMaterials)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[9px] transition-all justify-center ${showUsedMaterials ? 'bg-rose-700 text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'}`}>
                  {showUsedMaterials ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  المواد المستخدمة
               </button>
               <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 rounded-xl border p-0.5">
                  <button onClick={() => setCurrencyMode('primary')} className={`flex-1 h-full rounded-lg text-[8px] font-black transition-all ${currencyMode === 'primary' ? 'bg-primary text-white' : 'text-zinc-400'}`}>{settings?.currencySymbol || 'ل.س'}</button>
                  <button onClick={() => setCurrencyMode('secondary')} className={`flex-1 h-full rounded-lg text-[8px] font-black transition-all ${currencyMode === 'secondary' ? 'bg-amber-600 text-white' : 'text-zinc-400'}`}>{settings?.secondaryCurrencySymbol || '$'}</button>
               </div>
            </div>
         </div>
      </div>

      <div ref={reportRef} className="bg-white border-2 border-rose-900 shadow-lg rounded-2xl overflow-hidden p-4 md:p-8 export-fix">
        
        <div className="flex justify-between items-center border-b-4 border-rose-900 pb-6 mb-8 bg-white text-zinc-900">
          <div className="flex items-center gap-4">
            {settings?.logoUrl && <img src={settings.logoUrl} className="w-20 h-20 object-contain bg-white p-1 rounded-lg" />}
            <div>
              <h1 className="text-3xl font-black text-rose-900 leading-none">{settings?.companyName}</h1>
              <p className="text-[10px] text-zinc-500 font-black uppercase mt-1">{settings?.address}</p>
              <p className="text-[10px] text-zinc-400 font-bold" dir="ltr">{settings?.phone}</p>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black underline decoration-rose-900/30 underline-offset-8">كشف حساب زبون تفصيلي</h2>
            <div className="text-lg font-black text-rose-800 mt-2">{customerFilter || 'جميع الزبائن'}</div>
            <div className="flex items-center justify-center gap-3 mt-1 text-zinc-400 text-[9px] font-black">
               <span className="font-mono bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">{startDate || 'الأول'}</span>
               <span className="text-rose-200 text-lg">←</span>
               <span className="font-mono bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">{endDate || 'الآن'}</span>
               <span className="bg-zinc-900 text-white px-3 py-0.5 rounded-full uppercase tracking-widest">{activeCurrencyName}</span>
            </div>
          </div>

          <div className="text-left text-xs font-bold text-zinc-400">
            <p>{settings?.address}</p>
            <p className="mt-2 text-[9px] font-black uppercase">تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>

        <table className="w-full text-right border-collapse text-[10px]">
          <thead>
            <tr className="bg-zinc-100 text-zinc-900 font-black border-y-2 border-rose-900 h-10">
              <th className="p-1 border border-zinc-200 w-24 text-center">التاريخ</th>
              <th className="p-1 border border-zinc-200 w-16 text-center">السند</th>
              {showStatement && <th className="p-1 border border-zinc-200 text-right pr-4">البيان الرسمي</th>}
              {showSoldItems && <th className="p-1 border border-zinc-200 text-right pr-4">الأصناف والبنود</th>}
              {showUsedMaterials && <th className="p-1 border border-zinc-200 text-right pr-4 text-rose-800">المواد المستخدمة (خامات)</th>}
              <th className="p-1 border border-zinc-200 w-24 text-center text-rose-800 bg-rose-50">مدين (+)</th>
              <th className="p-1 border border-zinc-200 w-24 text-center text-emerald-700 bg-emerald-50">دائن (-)</th>
            </tr>
          </thead>
          <tbody className="text-zinc-800">
            {customerFilter && movements.some(m => m.type === 'افتتاحي') && (
              <tr className="h-10 bg-zinc-50 font-black border-b italic">
                <td className="p-1 border text-center text-zinc-400">{movements.find(m => m.type === 'افتتاحي')?.date || '---'}</td>
                <td className="p-1 border text-center">قيد</td>
                {showStatement && <td className="p-1 border pr-4">رصيد افتتاحي (أول المدة)</td>}
                {showSoldItems && <td className="p-1 border text-center text-zinc-300">---</td>}
                {showUsedMaterials && <td className="p-1 border text-center text-zinc-300">---</td>}
                <td className="p-1 border text-center text-rose-800">{movements.find(m => m.type === 'افتتاحي')?.debit > 0 ? movements.find(m => m.type === 'افتتاحي')?.debit.toLocaleString() : '0'}</td>
                <td className="p-1 border text-center text-emerald-700">{movements.find(m => m.type === 'افتتاحي')?.credit > 0 ? movements.find(m => m.type === 'افتتاحي')?.credit.toLocaleString() : '0'}</td>
              </tr>
            )}

            {movements.length === 0 ? (
              Array.from({ length: 15 }).map((_, i) => (
                <tr key={i} className="h-8 border-b border-zinc-100">
                   <td className="border border-zinc-100"></td>
                   <td className="border border-zinc-100"></td>
                   {showStatement && <td className="border border-zinc-100"></td>}
                   {showSoldItems && <td className="border border-zinc-100"></td>}
                   {showUsedMaterials && <td className="border border-zinc-100"></td>}
                   <td className="border border-zinc-100"></td>
                   <td className="border border-zinc-100"></td>
                </tr>
              ))
            ) : (
              movements.map((move, idx) => (
                <tr key={idx} className="h-10 border-b border-zinc-100 font-bold hover:bg-rose-50/20 transition-colors">
                  <td className="p-1 border-zinc-200 font-mono text-center text-zinc-400">{move.date}</td>
                  <td className="p-1 border-zinc-200 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                      move.type === 'مبيع' ? 'bg-rose-100 text-rose-800' : 
                      move.type === 'مرتجع' ? 'bg-amber-100 text-amber-800' : 
                      move.type === 'حسم' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {move.type}
                    </span>
                  </td>
                  {showStatement && <td className="p-1 border-zinc-200 pr-4 text-zinc-900">{move.statement}</td>}
                  
                  {showSoldItems && (
                    <td className="p-1 border-zinc-200 pr-4">
                       <div className="flex flex-wrap gap-1">
                          {move.soldItems.length > 0 ? (
                            move.soldItems.map((it: any, i: number) => (
                              <span key={i} className="bg-zinc-50 text-zinc-600 px-1.5 py-0.5 rounded-sm border border-zinc-100 text-[8px] font-black">
                                 {it.name} ({it.quantity})
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-300 italic text-[8px]">---</span>
                          )}
                       </div>
                    </td>
                  )}

                  {showUsedMaterials && (
                    <td className="p-1 border-zinc-200 pr-4 bg-rose-50/10">
                       <div className="flex flex-wrap gap-1">
                          {move.usedMaterials.length > 0 ? (
                            move.usedMaterials.map((it: any, i: number) => (
                              <span key={i} className="bg-white text-rose-800/60 px-1.5 py-0.5 rounded-sm border border-rose-100 text-[8px]">
                                 {it.name} ({it.quantity} {it.unit})
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-300 italic text-[8px]">---</span>
                          )}
                       </div>
                    </td>
                  )}

                  <td className="p-1 border-zinc-200 font-mono text-center text-rose-800 bg-rose-50/5">{move.debit > 0 ? move.debit.toLocaleString() : ''}</td>
                  <td className="p-1 border-zinc-200 font-mono text-center text-emerald-800 bg-emerald-50/5">{move.credit > 0 ? move.credit.toLocaleString() : ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="border-t-4 border-rose-900 mt-4 bg-zinc-900 text-white rounded-2xl overflow-hidden shadow-2xl">
           <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-white/10">
              <div className="p-6 flex flex-col items-center">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">إجمالي المبيعات (Gross)</span>
                 <span className="text-2xl font-mono font-black">{totalDebit.toLocaleString()}</span>
              </div>
              <div className="p-6 flex flex-col items-center bg-rose-500/10">
                 <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">إجمالي المرتجعات والخصومات</span>
                 <span className="text-2xl font-mono font-black text-rose-400">
                    {movements.filter(m => m.type === 'مرتجع' || m.type === 'حسم').reduce((s,c) => s + c.credit, 0).toLocaleString()}
                 </span>
              </div>
              <div className="p-6 flex flex-col items-center bg-emerald-500/10">
                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">إجمالي المقبوضات النقدية</span>
                 <span className="text-2xl font-mono font-black text-emerald-400">
                    {movements.filter(m => m.type === 'قبض').reduce((s,c) => s + c.credit, 0).toLocaleString()}
                 </span>
              </div>
              <div className="p-6 flex flex-col items-center bg-white text-zinc-900">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">صافي الرصيد المتبقي</span>
                 <span className={`text-4xl font-mono font-black ${finalBalance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{finalBalance.toLocaleString()}</span>
                 <span className="text-[9px] font-bold text-zinc-400 mt-1 uppercase">{activeCurrencySymbol}</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 border-2 border-zinc-200 bg-white rounded-2xl overflow-hidden shadow-sm mt-6">
           <div className="col-span-3 flex flex-col divide-y divide-zinc-100 text-[10px] font-bold">
              <div className="p-2.5 px-8 text-zinc-700 underline underline-offset-4 decoration-zinc-200">{tafqeet(totalDebit, activeCurrencyName)}</div>
              <div className="p-2.5 px-8 text-rose-800 underline underline-offset-4 decoration-rose-200 font-black">{tafqeet(finalBalance, activeCurrencyName)}</div>
           </div>
           <div className="col-span-1 border-r border-zinc-200 flex flex-col divide-y divide-zinc-100 font-black text-[10px] bg-zinc-50">
              <div className="p-2.5 pr-6 text-left border-l border-zinc-100">إجمالي مدين (مبيعات)</div>
              <div className="p-2.5 pr-6 text-left border-l border-zinc-100">صافي رصيد الزبون حالياً</div>
           </div>
        </div>

        <div className="print-only mt-10 pt-6 border-t border-zinc-200 flex justify-between items-end text-[9px] font-black text-zinc-400">
           <div className="flex flex-col">
              <span>FINEXA INTELLIGENCE SYSTEM | SECURED FINANCIAL LOG TERMINAL</span>
              <span>تاريخ الطباعة: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="text-center">
              <div className="w-32 border-b-2 border-zinc-200 mb-1 mx-auto"></div>
              <span>توقيع المحاسب المعتمد</span>
           </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center no-print pt-6 pb-20">
         <button onClick={onBack} className="bg-zinc-100 dark:bg-zinc-800 text-readable px-8 py-3 rounded-2xl font-bold shadow-sm hover:bg-zinc-200 transition-all flex items-center gap-2 border border-zinc-200">
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