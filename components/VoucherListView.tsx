
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Plus, Trash2, Edit2, Save, X, FileDown, FileText, Search, Calendar, User, Coins, CreditCard } from 'lucide-react';
import { CashEntry, Party, AppSettings, SalesInvoice, PurchaseInvoice, PartyType } from '../types';
import { tafqeet } from '../utils/tafqeet';

declare var html2pdf: any;

interface VoucherListViewProps {
  onBack: () => void;
  type: 'قبض' | 'دفع';
}

const VoucherListView: React.FC<VoucherListViewProps> = ({ onBack, type }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [vouchers, setVouchers] = useState<CashEntry[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<CashEntry | null>(null);
  const [selectedCurrencyType, setSelectedCurrencyType] = useState<'primary' | 'secondary'>('primary');
  
  const [showCustomerReport, setShowCustomerReport] = useState(false);
  const [reportParty, setReportParty] = useState('');
  const [reportStart, setReportStart] = useState('');
  const [reportEnd, setReportEnd] = useState('');

  useEffect(() => {
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    loadData();
  }, [type]);

  const loadData = () => {
    const savedVouchers = localStorage.getItem('sheno_cash_journal');
    const savedParties = localStorage.getItem('sheno_parties');
    if (savedVouchers) {
      const all = JSON.parse(savedVouchers);
      setVouchers(all.filter((v: CashEntry) => v.type === type));
    }
    if (savedParties) {
       const allParties = JSON.parse(savedParties);
       if (type === 'قبض') {
         setParties(allParties.filter((p: Party) => p.type === PartyType.CUSTOMER || p.type === PartyType.BOTH));
       } else {
         setParties(allParties.filter((p: Party) => p.type === PartyType.SUPPLIER || p.type === PartyType.BOTH));
       }
    }
  };

  const calculateCustomerTotals = () => {
    if (!reportParty) return { due: 0, paid: 0, filteredVouchers: [] };
    
    let totalDue = 0;
    // نحسب الديون من الفواتير (مبيعات إذا كان التقرير للزبون، مشتريات إذا كان للمورد)
    const salesRaw = localStorage.getItem('sheno_sales_invoices');
    const purRaw = localStorage.getItem('sheno_purchases');
    
    if (salesRaw) {
      const sales: SalesInvoice[] = JSON.parse(salesRaw);
      totalDue += sales
        .filter(s => s.customerName === reportParty)
        .reduce((acc, curr) => acc + curr.totalAmount, 0);
    }
    if (purRaw) {
      const purchases: PurchaseInvoice[] = JSON.parse(purRaw);
      // إذا كان الشخص مورد، فواتير الشراء هي ديوننا له (أي مسحوبات بالنسبة له)
      totalDue += purchases
        .filter(p => p.supplierName === reportParty)
        .reduce((acc, curr) => acc + curr.totalAmount, 0);
    }

    const savedAllCash = localStorage.getItem('sheno_cash_journal');
    let allFilteredVouchers: CashEntry[] = [];
    if (savedAllCash) {
       allFilteredVouchers = JSON.parse(savedAllCash).filter((v: CashEntry) => {
          const matchParty = v.partyName === reportParty || v.statement.includes(reportParty);
          const matchStart = !reportStart || v.date >= reportStart;
          const matchEnd = !reportEnd || v.date <= reportEnd;
          return matchParty && matchStart && matchEnd;
       });
    }

    const totalPaid = allFilteredVouchers.reduce((acc, curr) => {
       // الواصل هو المقبوضات منه (للزبون) أو المدفوعات له (للمورد)
       return acc + (curr.receivedSYP || curr.paidSYP || curr.receivedUSD || curr.paidUSD || 0);
    }, 0);

    return { due: totalDue, paid: totalPaid, filteredVouchers: allFilteredVouchers };
  };

  const handleExportReportPDF = () => {
    if (!reportRef.current || !reportParty) return;
    const element = reportRef.current;
    const opt = {
      margin: 0,
      filename: `كشف_حساب_${reportParty}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleSave = () => {
    if (!formData.amount || !formData.partyName) {
      alert('يرجى اختيار الحساب وتحديد المبلغ');
      return;
    }
    const currencyName = selectedCurrencyType === 'primary' ? (settings?.currency || 'ليرة سورية') : (settings?.secondaryCurrency || 'دولار');
    const isPrimary = selectedCurrencyType === 'primary';
    const amountValue = formData.amount || 0;

    const entry: CashEntry = {
      ...(editingId ? vouchers.find(v => v.id === editingId) : {}),
      ...formData as CashEntry,
      id: editingId || crypto.randomUUID(),
      type: type,
      amountLiteral: tafqeet(amountValue, currencyName),
      receivedSYP: type === 'قبض' && isPrimary ? amountValue : 0,
      paidSYP: type === 'دفع' && isPrimary ? amountValue : 0,
      receivedUSD: type === 'قبض' && !isPrimary ? amountValue : 0,
      paidUSD: type === 'دفع' && !isPrimary ? amountValue : 0,
    };

    const savedAll = localStorage.getItem('sheno_cash_journal');
    let allEntries = savedAll ? JSON.parse(savedAll) : [];
    if (editingId) allEntries = allEntries.map((e: CashEntry) => e.id === editingId ? entry : e);
    else allEntries = [entry, ...allEntries];

    localStorage.setItem('sheno_cash_journal', JSON.stringify(allEntries));
    setIsAdding(false);
    setEditingId(null);
    loadData();
    resetForm();
  };

  const resetForm = () => {
    setFormData({ voucherNumber: '', date: new Date().toISOString().split('T')[0], statement: '', partyName: '', amount: 0, notes: '' });
    setSelectedCurrencyType('primary');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('حذف السند نهائياً؟')) {
      const savedAll = localStorage.getItem('sheno_cash_journal');
      if (savedAll) {
        const updated = JSON.parse(savedAll).filter((v: CashEntry) => v.id !== id);
        localStorage.setItem('sheno_cash_journal', JSON.stringify(updated));
        loadData();
      }
    }
  };

  const [formData, setFormData] = useState<Partial<CashEntry>>({
    voucherNumber: '',
    date: new Date().toISOString().split('T')[0],
    statement: '',
    partyName: '',
    amount: 0,
    notes: ''
  });

  const { due, paid, filteredVouchers: reportVouchers } = calculateCustomerTotals();
  const currentFilteredList = vouchers.filter(v => 
    v.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.statement?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.voucherNumber?.includes(searchTerm)
  );

  if (printingVoucher) {
    const isVoucherPrimary = (printingVoucher.receivedSYP || 0) > 0 || (printingVoucher.paidSYP || 0) > 0;
    const displayAmount = isVoucherPrimary ? (printingVoucher.receivedSYP || printingVoucher.paidSYP) : (printingVoucher.receivedUSD || printingVoucher.paidUSD);
    const displayCurrencySymbol = isVoucherPrimary ? (settings?.currencySymbol || 'ل.س') : (settings?.secondaryCurrencySymbol || '$');
    const displayCurrencyName = isVoucherPrimary ? (settings?.currency || 'ليرة سورية') : (settings?.secondaryCurrency || 'دولار');

    return (
      <div className="min-h-screen bg-zinc-100 flex flex-col items-center p-4 md:p-10 animate-in fade-in" dir="rtl">
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 0; background: white !important; }
            .no-print { display: none !important; }
            .print-receipt-container { 
              width: 100% !important; 
              height: 50% !important; 
              margin: 0 !important; 
              padding: 10mm !important; 
              border: none !important; 
              box-shadow: none !important;
              display: flex !important;
              flex-direction: column !important;
            }
          }
        `}</style>
        
        <div className="w-full max-w-4xl mb-6 no-print flex justify-between items-center bg-white p-5 rounded-3xl shadow-xl border border-zinc-200">
           <button onClick={() => setPrintingVoucher(null)} className="flex items-center gap-2 text-zinc-500 font-black hover:text-rose-900 transition-colors bg-zinc-50 px-6 py-2.5 rounded-xl border border-zinc-200">
              <ArrowRight className="w-5 h-5" /> رجوع للملفات
           </button>
           <div className="flex gap-3">
              <button onClick={() => window.print()} className="bg-rose-900 text-white px-10 py-3 rounded-2xl font-black flex items-center gap-2 shadow-2xl hover:brightness-110 active:scale-95 transition-all">
                <Printer className="w-6 h-6" /> طباعة الآن
              </button>
           </div>
        </div>

        {/* Professional A5 Receipt */}
        <div className="print-receipt-container bg-white text-zinc-900 w-full max-w-4xl min-h-[148.5mm] shadow-2xl flex flex-col p-12 relative border-b-2 border-zinc-100">
          
          <div className="flex justify-between items-start mb-4">
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                   {settings?.logoUrl ? (
                     <img src={settings.logoUrl} className="w-20 h-auto object-contain" alt="Logo" />
                   ) : (
                     <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center text-white font-black text-xl">XO</div>
                   )}
                   <div className="flex flex-col">
                      <h1 className="text-xl font-black text-rose-900 leading-none">{settings?.companyName || 'XO COMPANY'}</h1>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">SAMLATOR SECURED SYSTEM</span>
                   </div>
                </div>
                <div className="text-[8px] font-bold text-zinc-400 mt-2 px-1">
                   {settings?.phone || '093XXXXXXX'}
                </div>
             </div>

             <div className="flex flex-col items-end gap-1">
                <h2 className="text-2xl font-black text-rose-900">سند {type} مالي</h2>
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-black text-zinc-400 uppercase">NO: {printingVoucher.voucherNumber || printingVoucher.id.slice(0, 6).toUpperCase()}</span>
                   <div className="w-px h-3 bg-zinc-200"></div>
                   <span className="text-[10px] font-black text-zinc-400 uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3"/> {printingVoucher.date}
                   </span>
                </div>
             </div>
          </div>

          <div className="h-1 bg-rose-900 w-full mb-10 rounded-full opacity-80"></div>

          <div className="flex-1 space-y-10">
             <div className="flex items-baseline gap-4 border-b-2 border-zinc-100 pb-2">
                <span className="text-rose-900 font-black text-lg whitespace-nowrap">{type === 'قبض' ? 'استلمنا من' : 'دفعنا إلى'}:</span>
                <span className="flex-1 text-3xl font-black text-zinc-800 italic px-4">
                   {printingVoucher.partyName}
                </span>
             </div>

             <div className="flex items-baseline gap-4 border-b-2 border-zinc-100 pb-2">
                <span className="text-rose-900 font-black text-lg whitespace-nowrap">مبلغاً وقدره:</span>
                <span className="flex-1 text-xl font-black text-zinc-600 px-4">
                   {tafqeet(displayAmount || 0, displayCurrencyName)}
                </span>
             </div>

             <div className="flex items-baseline gap-4 border-b-2 border-zinc-100 pb-2">
                <span className="text-rose-900 font-black text-lg whitespace-nowrap">وذلك عن:</span>
                <span className="flex-1 text-lg font-bold text-zinc-500 px-4">
                   {printingVoucher.statement}
                </span>
             </div>

             <div className="flex justify-center pt-8">
                <div className="relative group">
                   <div className="absolute -inset-1 bg-rose-900 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                   <div className="relative bg-white border-4 border-rose-900 rounded-2xl px-16 py-6 flex flex-col items-center min-w-[320px] shadow-lg">
                      <div className="absolute -top-3 bg-white px-4 text-[9px] font-black text-rose-900 uppercase tracking-widest border border-rose-900 rounded-full">Amount | المبلغ</div>
                      <div className="flex items-center gap-4">
                         <span className="text-[14px] font-black text-zinc-400 mt-2">{displayCurrencySymbol}</span>
                         <span className="text-5xl font-black font-mono tracking-tighter text-zinc-900">{displayAmount?.toLocaleString()}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="mt-16 pt-8 border-t border-zinc-100 flex justify-between items-end">
             <div className="flex flex-col items-center">
                <div className="w-48 border-b-2 border-zinc-200 mb-2"></div>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{type === 'قبض' ? 'المستلم' : 'المسلم'} | SIGNATURE</span>
             </div>
             <div className="flex flex-col items-center">
                <div className="text-sm font-black text-zinc-800 mb-1">{settings?.accountantName || 'المحاسب المعتمد'}</div>
                <div className="w-48 border-b-2 border-rose-900 mb-2"></div>
                <span className="text-[10px] font-black text-rose-900 uppercase tracking-widest">توقيع المحاسب | ACCOUNTANT</span>
             </div>
          </div>
          
          <div className="absolute bottom-4 left-4 text-[8px] font-bold text-zinc-300 italic">SAMLATOR SECURED LEDGER SYSTEM V2026.1</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* نافذة كشف حساب العميل - المحدثة لتطابق الصورة */}
      {showCustomerReport && (
        <div className="fixed inset-0 bg-white dark:bg-zinc-950 z-[100] flex flex-col items-center overflow-y-auto animate-in fade-in" dir="rtl">
           <style>{`
             @media print {
               @page { size: A4 portrait; margin: 0 !important; }
               body { background: white !important; margin: 0 !important; padding: 0 !important; }
               .no-print { display: none !important; }
               .print-full-container { 
                  width: 100% !important; 
                  margin: 0 !important; 
                  padding: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
               }
               #report-content {
                  padding: 10mm !important;
                  border: none !important;
               }
             }
           `}</style>

           <div className="w-full max-w-5xl my-4 flex flex-wrap justify-between items-end gap-4 bg-zinc-800 p-6 rounded-3xl border border-zinc-700 shadow-xl no-print mx-4">
              <div className="flex-1 flex gap-4 min-w-[300px]">
                <div className="flex flex-col gap-1 flex-1">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-1">اختيار الطرف</label>
                   <select value={reportParty} onChange={e => setReportParty(e.target.value)} className="bg-zinc-900 border border-zinc-600 text-white p-3 rounded-xl font-black text-sm outline-none focus:border-rose-600">
                      <option value="">-- اختر الطرف --</option>
                      {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                   </select>
                </div>
                <div className="flex flex-col gap-1 w-32">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-1">من تاريخ</label>
                   <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="bg-zinc-900 border border-zinc-600 text-white p-3 rounded-xl font-mono text-xs outline-none" />
                </div>
                <div className="flex flex-col gap-1 w-32">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-1">إلى تاريخ</label>
                   <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="bg-zinc-900 border border-zinc-600 text-white p-3 rounded-xl font-mono text-xs outline-none" />
                </div>
              </div>
              
              <div className="flex gap-2">
                 <button onClick={handleExportReportPDF} className="bg-emerald-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-emerald-600 transition-all border border-emerald-500 shadow-lg">
                   <FileDown className="w-5 h-5" /> تصدير PDF
                 </button>
                 <button onClick={() => window.print()} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-rose-500 transition-all shadow-lg">
                   <Printer className="w-5 h-5" /> طباعة الكشف
                 </button>
                 <button onClick={() => setShowCustomerReport(false)} className="bg-zinc-900 text-zinc-400 px-6 py-3 rounded-xl font-bold hover:text-white transition-all">إغلاق</button>
              </div>
           </div>

           <div ref={reportRef} id="report-content" className="print-full-container bg-white w-full max-w-5xl flex flex-col text-zinc-900 min-h-screen p-10 md:p-14 relative border-zinc-100">
              {/* Header section matching XO Company Style */}
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-6">
                    <h2 className="text-[44px] font-black text-zinc-800 tracking-tighter relative">
                       تقرير كشف حساب زبون
                       <div className="absolute -bottom-1 right-0 left-0 h-1 bg-rose-600 rounded-full"></div>
                    </h2>
                 </div>
                 
                 <div className="text-right flex flex-col items-end gap-1">
                    <div className="flex items-center gap-4">
                       <h1 className="text-3xl font-black text-zinc-800 uppercase leading-none">{settings?.companyName || 'XO COMPANY'}</h1>
                       {settings?.logoUrl ? <img src={settings.logoUrl} className="w-14 h-14 object-contain" alt="Logo" /> : <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center text-white font-black text-xl">XO</div>}
                    </div>
                    <div className="text-[11px] font-black text-rose-600 mt-2 uppercase tracking-[0.2em] leading-none">المحاسبة والمالية</div>
                    <div className="text-[10px] font-bold text-zinc-400 leading-none mt-1">{settings?.address || 'دمشق، سوريا'}</div>
                    <div className="text-[9px] font-mono font-bold text-zinc-300 leading-none mt-1">{new Date().toLocaleDateString('ar-SA')}</div>
                 </div>
              </div>

              {/* Sub-Header with Customer Name and Dates */}
              <div className="text-center mt-2 mb-6">
                 <p className="text-[11px] font-bold text-zinc-400 tracking-widest uppercase mb-1">الفترة: {reportStart || 'البداية'} - {reportEnd || 'اليوم'}</p>
                 <h3 className="text-4xl font-black text-rose-600 uppercase tracking-tight">{reportParty || '...لم يتم اختيار اسم...'}</h3>
              </div>

              <div className="h-1 bg-rose-600 w-full mb-10 rounded-full opacity-30"></div>

              {/* Summary Cards Matching Image Style */}
              <div className="grid grid-cols-3 gap-8 mb-12">
                 {/* Card 1: Balance (Red) */}
                 <div className="relative group">
                    <div className="absolute -inset-1 bg-rose-600 rounded-[2.5rem] blur opacity-5"></div>
                    <div className="relative bg-white border-[3px] border-rose-600 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-1 shadow-sm">
                       <span className="text-[10px] font-black text-rose-600 uppercase text-center leading-tight mb-2">الرصيد المتبقي<br/>(الذمة)</span>
                       <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-mono font-black text-rose-600">-{ (due - paid).toLocaleString() }-</span>
                       </div>
                    </div>
                 </div>

                 {/* Card 2: Payments (Emerald) */}
                 <div className="relative group">
                    <div className="absolute -inset-1 bg-emerald-500 rounded-[2.5rem] blur opacity-5"></div>
                    <div className="relative bg-white border-[3px] border-emerald-500 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-1 shadow-sm">
                       <span className="text-[10px] font-black text-emerald-600 uppercase text-center leading-tight mb-2">إجمالي المدفوعات<br/>(الواصل)</span>
                       <span className="text-4xl font-mono font-black text-emerald-600">{paid.toLocaleString()}</span>
                    </div>
                 </div>

                 {/* Card 3: Debts (Zinc) */}
                 <div className="relative group">
                    <div className="absolute -inset-1 bg-zinc-200 rounded-[2.5rem] blur opacity-5"></div>
                    <div className="relative bg-white border-[3px] border-zinc-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-1 shadow-sm">
                       <span className="text-[10px] font-black text-zinc-400 uppercase text-center leading-tight mb-2">إجمالي المسحوبات<br/>(الديون)</span>
                       <span className="text-4xl font-mono font-black text-zinc-800">{due.toLocaleString()}</span>
                    </div>
                 </div>
              </div>

              {/* Table Section */}
              <div className="flex-1">
                 <div className="rounded-[2.5rem] bg-zinc-50 border border-zinc-100 overflow-hidden shadow-sm">
                    <table className="w-full text-right border-collapse">
                       <thead>
                          <tr className="bg-white text-zinc-400 font-black text-[10px] uppercase tracking-widest h-12 border-b">
                             <th className="p-4 w-32 text-center border-l border-zinc-100">التاريخ</th>
                             <th className="p-4 w-32 text-center border-l border-zinc-100">رقم السند</th>
                             <th className="p-4 border-l border-zinc-100">البيان / الوصف</th>
                             <th className="p-4 text-center w-40">القيمة</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-100 font-bold text-sm text-zinc-800 bg-white">
                          {reportVouchers.length === 0 ? (
                             <tr><td colSpan={4} className="p-24 text-center text-zinc-300 italic font-black">لا توجد حركات مالية مسجلة</td></tr>
                          ) : reportVouchers.map(v => (
                             <tr key={v.id} className="h-14">
                                <td className="p-4 text-center font-mono text-zinc-400 text-[11px] border-l border-zinc-50">{v.date}</td>
                                <td className="p-4 text-center font-black text-zinc-800 border-l border-zinc-50 font-mono">#---</td>
                                <td className="p-4 text-zinc-500 font-bold border-l border-zinc-50 italic">{v.statement}</td>
                                <td className="p-4 text-center font-mono font-black text-2xl text-emerald-600">{(v.receivedSYP || v.paidSYP || v.receivedUSD || v.paidUSD).toLocaleString()}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* Footer Section */}
              <div className="mt-16 pt-8 flex justify-between items-end border-t border-zinc-100">
                 <div className="flex flex-col">
                    <div className="w-64 border-b-2 border-zinc-200 mb-2"></div>
                    <span className="text-[11px] font-black text-zinc-400 uppercase italic">توقيع المحاسب المعتمد</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none">ACCOUNTING LEDGER SYSTEM</span>
                    <span className="text-[11px] font-black text-rose-600 italic leading-none mt-1">SAMLATOR2026 Secured Terminal</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between no-print gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-900 rounded-xl transition-all shadow-lg"><ArrowRight className="w-6 h-6" /></button>
          <h2 className="text-3xl font-black text-rose-900 tracking-tight uppercase">سندات ال{type} المالي</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCustomerReport(true)} className="bg-zinc-900 border border-zinc-800 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-zinc-800 transition-all"><FileText className="w-5 h-5 text-rose-900" /> تقرير كشف حساب</button>
          <button onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }} className="bg-rose-900 text-white px-10 py-3 rounded-2xl font-black flex items-center gap-3 shadow-[0_10px_40px_-10px_rgba(225,29,72,0.4)] hover:brightness-110 transition-all active:scale-95"><Plus className="w-6 h-6" /> سند {type} جديد</button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-rose-900/20 shadow-2xl space-y-8 animate-in zoom-in-95 no-print relative overflow-hidden text-readable">
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-900/5 blur-3xl rounded-full"></div>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">الحساب المالي</label>
                 <select className="bg-zinc-950 border-2 border-zinc-800 text-white p-3.5 rounded-2xl font-black outline-none focus:border-rose-900 transition-all" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})}><option value="">-- اختر الحساب --</option>{parties.map(p => <option key={p.id} value={p.name}>{p.name} ({p.type})</option>)}</select>
              </div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم السند</label><input type="text" className="bg-zinc-950 border-2 border-zinc-800 text-white p-3.5 rounded-2xl outline-none font-black text-center" value={formData.voucherNumber} onChange={e => setFormData({...formData, voucherNumber: e.target.value})} placeholder="تلقائي" /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">تاريخ اليوم</label><input type="date" className="bg-zinc-950 border-2 border-zinc-800 text-white p-3.5 rounded-2xl outline-none font-mono text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">العملة</label>
                 <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border-2 border-zinc-800 h-[56px]">
                    <button onClick={() => setSelectedCurrencyType('primary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'primary' ? 'bg-rose-900 text-white shadow-lg' : 'text-zinc-600'}`}>{settings?.currencySymbol || '1'}</button>
                    <button onClick={() => setSelectedCurrencyType('secondary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'secondary' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600'}`}>{settings?.secondaryCurrencySymbol || '2'}</button>
                 </div>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
              <div className="flex flex-col gap-1 md:col-span-3"><label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">بيان السند (التفاصيل)</label><input type="text" className="bg-zinc-950 border-2 border-zinc-800 text-white p-3.5 rounded-2xl outline-none font-bold" value={formData.statement} onChange={e => setFormData({...formData, statement: e.target.value})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-rose-500 font-black uppercase tracking-widest mr-1">قيمة السند</label><input type="number" className="bg-zinc-950 border-2 border-rose-900/30 text-white p-3.5 rounded-2xl outline-none font-black text-3xl text-rose-500 text-center shadow-inner" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} /></div>
           </div>
           <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800 relative z-10">
              <button onClick={handleSave} className="bg-rose-900 text-white px-16 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 hover:scale-105 transition-all"><Save className="w-6 h-6" /> حفظ السند</button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="bg-zinc-800 text-zinc-500 px-10 py-4 rounded-2xl font-bold hover:text-zinc-300 transition-colors">إلغاء</button>
           </div>
        </div>
      )}

      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 flex items-center gap-4 no-print shadow-2xl">
        <div className="relative flex-1">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 w-6 h-6" />
          <input type="text" placeholder="بحث سريع في السندات..." className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-4 pr-14 pl-6 outline-none font-bold text-white focus:border-rose-900 transition-all shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-zinc-950 rounded-[2.5rem] border border-rose-900/20 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead className="bg-rose-900 text-white text-[11px] font-black uppercase tracking-[0.2em] h-16 shadow-lg relative z-10">
              <tr>
                <th className="p-5 border-l border-rose-950 text-center w-24">رقم السند</th>
                <th className="p-5 border-l border-rose-950 text-center w-32">التاريخ</th>
                <th className="p-5 border-l border-rose-950">الحساب المالي</th>
                <th className="p-5 border-l border-rose-950">البيان</th>
                <th className="p-5 border-l border-rose-950 text-center w-40">المبلغ</th>
                <th className="p-5 text-center w-32 no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {currentFilteredList.length === 0 ? (
                <tr><td colSpan={6} className="p-24 text-center italic text-zinc-700 font-black text-lg">لا يوجد سندات مسجلة حالياً</td></tr>
              ) : currentFilteredList.map(v => {
                const amount = v.receivedSYP || v.paidSYP || v.receivedUSD || v.paidUSD;
                const symbol = (v.receivedSYP || v.paidSYP) ? settings?.currencySymbol : settings?.secondaryCurrencySymbol;
                return (
                  <tr key={v.id} className="hover:bg-rose-900/5 transition-all group h-16 text-readable">
                    <td className="p-4 text-center font-mono font-black text-rose-900/80 border-l border-zinc-900">#{v.voucherNumber || v.id.slice(0, 4)}</td>
                    <td className="p-4 text-center font-mono font-bold text-zinc-600 border-l border-zinc-900">{v.date}</td>
                    <td className="p-4 text-white font-black border-l border-zinc-900">{v.partyName}</td>
                    <td className="p-4 text-zinc-500 font-medium border-l border-zinc-900 truncate max-w-[300px]">{v.statement}</td>
                    <td className="p-4 text-center font-black text-xl border-l border-zinc-900 text-zinc-200">
                      {amount.toLocaleString()} <span className="text-[10px] text-rose-900 uppercase ml-1 opacity-60 font-bold">{symbol}</span>
                    </td>
                    <td className="p-4 no-print border-zinc-900">
                      <div className="flex justify-center gap-2 opacity-40 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <button onClick={() => setPrintingVoucher(v)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"><Printer className="w-5 h-5" /></button>
                        <button onClick={() => { setEditingId(v.id); setFormData({...v, amount: amount}); setIsAdding(true); }} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-amber-500 transition-all"><Edit2 className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(v.id)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VoucherListView;
