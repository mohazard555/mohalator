
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Search, FileOutput, X, Users, Box, HardDrive, Calendar, Eye, EyeOff, FileDown, ImageIcon, Calculator, FileStack, Truck, Coins, CreditCard } from 'lucide-react';
import { PurchaseInvoice, InvoiceItem, CashEntry, Party, PartyType, AppSettings } from '../types';
import { tafqeet } from '../utils/tafqeet';
import { ImageExportService } from '../utils/ImageExportService';

declare var html2pdf: any;

interface DetailedSupplierReportViewProps {
  onBack: () => void;
}

const DetailedSupplierReportView: React.FC<DetailedSupplierReportViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [parties, setParties] = useState<Party[]>([]);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);
  
  const [showItems, setShowItems] = useState(true);
  const [currencyMode, setCurrencyMode] = useState<'primary' | 'secondary'>('primary');

  useEffect(() => {
    const activeId = localStorage.getItem('sheno_active_company_id') || 'default';
    const prefix = activeId === 'default' ? 'sheno' : `sheno_${activeId}`;

    const savedPurchases = localStorage.getItem(`${prefix}_purchases`);
    const savedReturns = localStorage.getItem(`${prefix}_purchase_returns`);
    const savedCash = localStorage.getItem(`${prefix}_cash_journal`);
    const savedParties = localStorage.getItem(`${prefix}_parties`);
    const savedSettings = localStorage.getItem(`${prefix}_settings`);
    
    if (savedPurchases) setPurchases(JSON.parse(savedPurchases));
    if (savedReturns) setPurchaseReturns(JSON.parse(savedReturns));
    if (savedCash) setCashEntries(JSON.parse(savedCash));
    if (savedParties) setParties(JSON.parse(savedParties).filter((p: Party) => p.type === PartyType.SUPPLIER || p.type === PartyType.BOTH));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const getSupplierMovements = () => {
    const movements: any[] = [];
    
    cashEntries.filter(entry => {
      const matchName = entry.partyName === supplierFilter;
      const matchDate = (!startDate || entry.date >= startDate) && (!endDate || entry.date <= endDate);
      const hasValue = currencyMode === 'primary' ? (entry.receivedSYP > 0 || entry.paidSYP > 0) : (entry.receivedUSD > 0 || entry.paidUSD > 0);
      return matchName && matchDate && hasValue;
    }).forEach(entry => {
      let debit = currencyMode === 'primary' ? (entry.paidSYP || 0) : (entry.paidUSD || 0);
      let credit = currencyMode === 'primary' ? (entry.receivedSYP || 0) : (entry.receivedUSD || 0);
      const originalAmount = debit || credit;
      
      let items: any[] = [];
      let purchasesVal = 0;
      let returnsVal = 0;
      let paidVal = 0;
      let discountVal = 0;
      let isCash = false;

      if (entry.voucherNumber) {
        if (entry.type === 'شراء') {
          const inv = purchases.find(p => p.invoiceNumber === entry.voucherNumber);
          if (inv) {
            items = inv.items;
            isCash = inv.paymentType === 'نقداً';
          }
        } else if (entry.type === 'مرتجع') {
          const ret = purchaseReturns.find(r => r.invoiceNumber === entry.voucherNumber);
          if (ret) {
            items = ret.items;
            isCash = ret.paymentType === 'نقداً';
          }
        }
      }

      // Logic: If cash, do not affect supplier balance
      if (isCash || (entry.type === 'حسم' && (entry.statement?.includes('نقداً') || entry.notes?.includes('نقداً')))) {
        debit = 0;
        credit = 0;
      }

      // Categorize for totals
      if (entry.type === 'شراء') {
        purchasesVal = originalAmount;
      } else if (entry.type === 'مرتجع') {
        returnsVal = originalAmount;
      } else if (entry.type === 'حسم') {
        discountVal = originalAmount;
      } else if (entry.type === 'دفع' || entry.type === 'قبض') {
        paidVal = originalAmount;
      }

      movements.push({
        date: entry.date,
        type: entry.type || 'قيد',
        number: entry.voucherNumber || '---',
        statement: entry.statement,
        items,
        purchases: purchasesVal,
        returns: returnsVal,
        paid: paidVal,
        discount: discountVal,
        debit, // Effect on balance
        credit, // Effect on balance
        originalAmount,
        isCash,
        ref: entry.id
      });
    });

    return movements.sort((a, b) => a.date.localeCompare(b.date));
  };

  const reportMovements = supplierFilter ? getSupplierMovements() : [];

  const totals = reportMovements.reduce((acc, curr) => {
    acc.purchases += curr.purchases;
    acc.returns += curr.returns;
    acc.paid += curr.paid;
    acc.discount += curr.discount;
    acc.debit += curr.debit;
    acc.credit += curr.credit;
    return acc;
  }, { purchases: 0, returns: 0, paid: 0, discount: 0, debit: 0, credit: 0 });

  // Supplier balance formula: Balance = Total Credit (Purchases) − Total Debit (Payments + Returns + Discounts)
  const finalBalance = totals.credit - totals.debit;

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `كشف_حساب_مورد_${supplierFilter || 'عام'}_${currencyMode}.pdf`,
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
      <style>{`
        @media print {
          .print-bg-white { background-color: white !important; background: white !important; color: black !important; }
          .print-no-bg { background: none !important; background-color: transparent !important; }
          
          /* Specific overrides for the final balance box */
          .bg-zinc-900.text-white {
            background-color: white !important;
            color: black !important;
            border: 2px solid #e5e7eb !important;
          }
          .text-amber-400, .text-amber-500 {
            color: #b45309 !important; /* Darker amber for print readability */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-amber-500\\/10 {
            background-color: white !important;
            border: 1px solid #f3f4f6 !important;
          }
          .relative.z-10 {
            position: static !important;
          }
          .absolute { display: none !important; }
          th { background-color: #f8fafc !important; color: #0f172a !important; border: 1px solid #e2e8f0 !important; }
          td { border: 1px solid #e2e8f0 !important; }
          table { border: 1px solid #e2e8f0 !important; }
        }
      `}</style>
      
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
               <div className="bg-amber-600 p-2 rounded shadow-sm border border-zinc-300 w-10 h-10 flex items-center justify-center text-white font-black">
                  <Truck className="w-6 h-6" />
               </div>
               <div className="flex flex-col">
                 <span className="text-readable font-black text-lg leading-none">كشف حساب مورد تفصيلي</span>
                 <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest">SUPPLIER LEDGER STATEMENT</span>
               </div>
            </div>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => ImageExportService.exportAsPng(reportRef.current!, 'Supplier_Report')}
              disabled={isExportingImage}
              className="bg-zinc-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-black shadow-lg hover:bg-zinc-700 transition-all"
            >
               {isExportingImage ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ImageIcon className="w-5 h-5" />} حفظ كصورة
            </button>
            <button onClick={() => window.print()} className="bg-amber-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-black shadow-lg hover:brightness-110 transition-all">
               <Printer className="w-5 h-5" /> طباعة
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden rounded-2xl no-print shadow-sm">
         <div className="col-span-1 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="flex border-b-2 border-zinc-200 dark:border-zinc-800 flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 flex-1 p-2 text-xs font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">عدد الأصناف الموردة</div>
               <div className="flex-1 p-2 text-center font-black text-2xl flex items-center justify-center text-readable">
                 {reportMovements.reduce((s, m) => s + (m.items?.length || 0), 0)}
               </div>
            </div>
            <div className="flex flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 flex-1 p-2 text-xs font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">إجمالي عدد الفواتير</div>
               <div className="flex-1 p-2 text-center font-black text-2xl flex items-center justify-center text-readable">
                 {reportMovements.filter(m => m.type === 'شراء').length}
               </div>
            </div>
         </div>

         <div className="col-span-1 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="flex border-b-2 border-zinc-200 dark:border-zinc-800 flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 w-32 p-2 text-xs font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">من تاريخ</div>
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 text-center font-mono outline-none text-sm bg-transparent text-readable" />
            </div>
            <div className="flex flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 w-32 p-2 text-xs font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">إلى تاريخ</div>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 text-center font-mono outline-none text-sm bg-transparent text-readable" />
            </div>
         </div>

         <div className="col-span-1 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-800/50">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 text-xs font-bold text-center border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-2 text-readable">
               <Users className="w-3 h-3 text-amber-600"/> اختيار المورد
            </div>
            <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="flex-1 text-center font-black text-xl outline-none py-4 appearance-none cursor-pointer bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-400">
              <option value="">-- عرض جميع الموردين --</option>
              {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
         </div>

         <div className="col-span-1 flex flex-col p-4 gap-2 bg-zinc-100/50 dark:bg-zinc-800/30">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center mb-1">إعدادات العرض والعملة</span>
            <div className="grid grid-cols-1 gap-2">
               <button onClick={() => setShowItems(!showItems)} className={`flex items-center gap-2 px-6 py-1.5 rounded-xl font-black text-xs transition-all w-full justify-center ${showItems ? 'bg-zinc-800 text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'}`}>
                  {showItems ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {showItems ? 'المواد المعروضة' : 'إخفاء المواد'}
               </button>
               <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 rounded-xl border p-0.5 h-10 shadow-inner">
                  <button onClick={() => setCurrencyMode('primary')} className={`flex-1 h-full rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-1 ${currencyMode === 'primary' ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-400'}`}>
                    <Coins className="w-3 h-3" /> {settings?.currencySymbol || 'ل.س'}
                  </button>
                  <button onClick={() => setCurrencyMode('secondary')} className={`flex-1 h-full rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-1 ${currencyMode === 'secondary' ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-400'}`}>
                    <CreditCard className="w-3 h-3" /> {settings?.secondaryCurrencySymbol || '$'}
                  </button>
               </div>
            </div>
         </div>
      </div>

      <div ref={reportRef} className="bg-white border-2 border-amber-800 shadow-xl rounded-2xl overflow-hidden p-4 md:p-8 export-fix">
        
        <div className="flex justify-between items-center border-b-4 border-amber-800 pb-6 mb-8 bg-white text-zinc-900">
          <div className="flex items-center gap-4">
            {settings?.logoUrl && <img src={settings.logoUrl} className="w-20 h-20 object-contain bg-white" />}
            <div>
              <h1 className="text-3xl font-black text-amber-900 leading-none">{settings?.companyName}</h1>
              <p className="text-[10px] text-zinc-500 font-black uppercase mt-1">كشف حساب مورد مالي</p>
              <p className="text-[10px] text-zinc-400 font-bold" dir="ltr">{settings?.phone}</p>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black underline decoration-amber-900/20 underline-offset-8">كشف حساب المورد التفصيلي</h2>
            <div className="text-lg font-black text-amber-800 mt-4">{supplierFilter || 'كافة الموردين'}</div>
            <div className="flex items-center justify-center gap-3 mt-2 text-zinc-400 text-[9px] font-black">
               <span className="font-mono bg-zinc-50 px-2 py-0.5 rounded border">{startDate || 'الأول'}</span>
               <span className="text-amber-300">←</span>
               <span className="font-mono bg-zinc-50 px-2 py-0.5 rounded border">{endDate || 'الآن'}</span>
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
            <tr className="bg-zinc-100 text-zinc-900 font-black border-y-2 border-amber-800 h-10">
              <th className="p-1 border border-zinc-200 w-24 text-center">التاريخ</th>
              <th className="p-1 border border-zinc-200 w-12 text-center">نوع السند</th>
              <th className="p-1 border border-zinc-200 text-right pr-4">البيان الرسمي للعملية</th>
              {showItems && <th className="p-1 border border-zinc-200 text-right pr-4">المواد الواردة/المعادة</th>}
              <th className="p-1 border border-zinc-200 w-24 text-center text-rose-700 bg-rose-50">قيمة المشتريات (+)</th>
              <th className="p-1 border border-zinc-200 w-24 text-center text-emerald-700 bg-emerald-50">المدفوع للمورد (-)</th>
            </tr>
          </thead>
          <tbody className="text-zinc-800">
            {supplierFilter && reportMovements.some(m => m.type === 'افتتاحي') && (
              <tr className="h-10 bg-zinc-50/50 font-black border-b italic">
                <td className="p-1 border text-center text-zinc-400">{reportMovements.find(m => m.type === 'افتتاحي')?.date || '---'}</td>
                <td className="p-1 border text-center">قيد</td>
                <td className="p-1 border pr-4">رصيد افتتاحي (أول المدة)</td>
                {showItems && <td className="p-1 border text-center text-zinc-300">---</td>}
                <td className="p-1 border text-center text-rose-700">{reportMovements.find(m => m.type === 'افتتاحي')?.credit > 0 ? reportMovements.find(m => m.type === 'افتتاحي')?.credit.toLocaleString() : '0'}</td>
                <td className="p-1 border text-center text-emerald-700">{reportMovements.find(m => m.type === 'افتتاحي')?.debit > 0 ? reportMovements.find(m => m.type === 'افتتاحي')?.debit.toLocaleString() : '0'}</td>
              </tr>
            )}

            {reportMovements.length === 0 ? (
              Array.from({ length: 15 }).map((_, i) => (
                <tr key={i} className="h-8 border-b border-zinc-100">
                  {Array.from({ length: showItems ? 6 : 5 }).map((__, j) => <td key={j} className="border border-zinc-100"></td>)}
                </tr>
              ))
            ) : (
              reportMovements.map((move, idx) => (
                <tr key={idx} className="h-10 border-b border-zinc-100 font-bold hover:bg-amber-50/20 transition-colors">
                  <td className="p-1 border-zinc-200 font-mono text-center text-zinc-400">{move.date}</td>
                  <td className="p-1 border-zinc-200 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                      move.type === 'شراء' ? 'bg-rose-100 text-rose-800' : 
                      move.type === 'مرتجع' ? 'bg-amber-100 text-amber-800' : 
                      move.type === 'حسم' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {move.type}
                    </span>
                  </td>
                  <td className="p-1 border-zinc-200 pr-4 text-zinc-900">{move.statement}</td>
                  {showItems && (
                    <td className="p-1 border-zinc-200 pr-4 bg-zinc-50/20">
                       <div className="flex flex-wrap gap-1">
                          {move.items.map((it: any, i: number) => (
                            <span key={i} className="bg-white text-zinc-500 px-1.5 py-0.5 rounded-sm border text-[8px]">
                               {it.name} ({it.quantity})
                            </span>
                          ))}
                       </div>
                    </td>
                  )}
                  <td className="p-1 border-zinc-200 font-mono text-center text-rose-800">
                    {move.credit > 0 ? move.credit.toLocaleString() : ''}
                  </td>
                  <td className="p-1 border-zinc-200 font-mono text-center text-emerald-800">
                    {move.debit > 0 ? move.debit.toLocaleString() : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
           <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">إجمالي المشتريات</span>
              <span className="text-2xl font-mono font-black text-rose-800">{totals.purchases.toLocaleString()}</span>
           </div>
           <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">إجمالي المرتجعات</span>
              <span className="text-2xl font-mono font-black text-amber-700">{totals.returns.toLocaleString()}</span>
           </div>
           <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">الحسم المكتسب</span>
              <span className="text-2xl font-mono font-black text-blue-700">{totals.discount.toLocaleString()}</span>
           </div>
           <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center shadow-md">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">إجمالي المدفوع نقداً</span>
              <span className="text-2xl font-mono font-black text-emerald-800">{totals.paid.toLocaleString()}</span>
           </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-6">
           <div className="flex-1 bg-zinc-900 text-white p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[100px] rounded-full"></div>
              <div className="relative z-10">
                 <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2 block">FINAL ACCOUNT BALANCE</span>
                 <h3 className="text-xl font-black italic">صافي مديونية المورد المستحقة حالياً:</h3>
              </div>
              <div className="text-center relative z-10">
                 <div className="text-5xl font-black font-mono tracking-tighter text-amber-400">
                    {finalBalance.toLocaleString()}
                 </div>
                 <span className="text-sm font-bold text-zinc-500 uppercase mt-2 block tracking-widest">{activeCurrencyName}</span>
              </div>
           </div>

           <div className="w-full md:w-96 bg-white border-2 border-zinc-200 p-6 rounded-[2rem] flex flex-col justify-center space-y-3">
              <span className="text-[10px] font-black text-zinc-400 uppercase border-b pb-1">المبلغ كتابةً / التفقيط</span>
              <div className="text-xs font-black italic text-zinc-700 leading-relaxed">
                 {tafqeet(Math.abs(finalBalance), activeCurrencyName)}
              </div>
           </div>
        </div>

        <div className="mt-12 flex justify-between items-end border-t pt-8 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
           <div className="flex flex-col gap-1">
              <span>SAMLATOR INTELLIGENCE PLATFORM | SECURED TERMINAL</span>
              <span>تاريخ استخراج التقرير: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="text-center">
              <div className="w-48 border-b-2 border-zinc-200 mb-2"></div>
              <span>توقيع المدير المالي / الختم الرسمي</span>
           </div>
        </div>
      </div>

      <div className="flex justify-between items-center no-print pt-6 pb-20">
         <button onClick={onBack} className="bg-zinc-100 dark:bg-zinc-800 text-readable px-8 py-3 rounded-2xl font-bold shadow-sm hover:bg-zinc-200 transition-all flex items-center gap-2 border border-zinc-200">
            العودة للرئيسية
         </button>
         <button onClick={handleExportPDF} className="bg-rose-900 text-white px-12 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-3">
            <FileDown className="w-6 h-6" /> تصدير نسخة PDF
         </button>
      </div>
    </div>
  );
};

export default DetailedSupplierReportView;