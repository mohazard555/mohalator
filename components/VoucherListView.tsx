
import React, { useState, useEffect } from 'react';
/* Added Search to the imports below */
import { ArrowRight, Printer, Plus, Trash2, Edit2, Save, X, FileDown, Calendar as CalendarIcon, FileText, User, Coins, CreditCard, Filter, ChevronDown, CheckCircle2, Search } from 'lucide-react';
import { CashEntry, Party, AppSettings, SalesInvoice, PurchaseInvoice, PartyType } from '../types';
import { exportToCSV } from '../utils/export';

const tafqeet = (n: number, currencyName: string): string => {
  if (n === 0) return "صفر";
  return `${n.toLocaleString()} ${currencyName} فقط لا غير`;
};

interface VoucherListViewProps {
  onBack: () => void;
  type: 'قبض' | 'دفع';
}

const VoucherListView: React.FC<VoucherListViewProps> = ({ onBack, type }) => {
  const [vouchers, setVouchers] = useState<CashEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
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
    if (type === 'قبض') {
      const salesRaw = localStorage.getItem('sheno_sales_invoices');
      if (salesRaw) {
        const sales: SalesInvoice[] = JSON.parse(salesRaw);
        totalDue = sales
          .filter(s => s.customerName === reportParty)
          .reduce((acc, curr) => acc + curr.totalAmount, 0);
      }
    } else {
      const purRaw = localStorage.getItem('sheno_purchases');
      if (purRaw) {
        const pur: PurchaseInvoice[] = JSON.parse(purRaw);
        totalDue = pur
          .filter(p => p.supplierName === reportParty)
          .reduce((acc, curr) => acc + curr.totalAmount, 0);
      }
    }

    const savedAllCash = localStorage.getItem('sheno_cash_journal');
    let allFilteredVouchers: CashEntry[] = [];
    if (savedAllCash) {
       allFilteredVouchers = JSON.parse(savedAllCash).filter((v: CashEntry) => {
          const matchParty = v.partyName === reportParty || v.statement.includes(reportParty);
          const matchType = v.type === type;
          const matchStart = !reportStart || v.date >= reportStart;
          const matchEnd = !reportEnd || v.date <= reportEnd;
          return matchParty && matchType && matchStart && matchEnd;
       });
    }

    const totalPaid = allFilteredVouchers.reduce((acc, curr) => 
      acc + (curr.receivedSYP || curr.paidSYP || curr.receivedUSD || curr.paidUSD || 0), 0
    );

    return { due: totalDue, paid: totalPaid, filteredVouchers: allFilteredVouchers };
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
      <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-4 animate-in fade-in" dir="rtl">
        <style>{`
          @media print {
            @page { size: 148mm 105mm; margin: 0; }
            body { margin: 0; padding: 0; background: white; }
            .no-print { display: none !important; }
            .print-area { 
              width: 148mm !important; 
              height: 105mm !important; 
              padding: 5mm !important; 
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
          }
        `}</style>

        <div className="max-w-xl w-full mb-6 no-print flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
           <button onClick={() => setPrintingVoucher(null)} className="flex items-center gap-2 text-zinc-500 font-black hover:text-rose-900 transition-colors">
             <ArrowRight className="w-5 h-5" /> العودة للقائمة
           </button>
           <button onClick={() => window.print()} className="bg-rose-900 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all">
             <Printer className="w-5 h-5" /> طباعة (ربع A4)
           </button>
        </div>

        {/* وثيقة السند - قياس ربع A4 عرضي */}
        <div className="print-area bg-white text-zinc-900 border-2 border-zinc-200 shadow-2xl flex flex-col relative overflow-hidden" 
             style={{ width: '148mm', height: '105mm', padding: '8mm' }}>
          
          {/* خلفية مائية خفيفة */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -rotate-12 select-none">
             <span className="text-[60px] font-black uppercase">{settings?.companyName}</span>
          </div>

          {/* الترويسة - Header */}
          <div className="flex justify-between items-start border-b-2 border-rose-900 pb-2 relative z-10">
             <div className="flex flex-col gap-0.5">
                <div className="text-rose-900 font-black text-sm uppercase tracking-tighter">
                   سند {type} مالي
                </div>
                <div className="bg-zinc-900 text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold w-fit">
                   NO: {printingVoucher.voucherNumber || printingVoucher.id.slice(0, 6).toUpperCase()}
                </div>
                <div className="text-zinc-500 font-bold text-[9px] mt-0.5">
                   DATE: {printingVoucher.date}
                </div>
             </div>

             <div className="flex flex-col items-center">
                {settings?.logoUrl ? (
                   <img src={settings.logoUrl} className="h-10 w-auto object-contain mb-1" alt="Logo" />
                ) : (
                   <div className="text-lg font-black text-rose-900 leading-none">SHENO</div>
                )}
                <div className="text-zinc-400 font-black text-[7px] tracking-widest uppercase">{settings?.companyType}</div>
             </div>

             <div className="text-left flex flex-col items-end">
                <h1 className="text-sm font-black text-rose-900 leading-none">{settings?.companyName}</h1>
                <div className="text-zinc-400 text-[8px] font-bold mt-1" dir="ltr">{settings?.phone}</div>
             </div>
          </div>

          {/* المحتوى - Content */}
          <div className="flex-1 pt-4 space-y-3 relative z-10">
             <div className="flex items-baseline gap-2 border-b border-zinc-100 pb-1">
                <span className="text-rose-900 font-black text-[11px] whitespace-nowrap">{type === 'قبض' ? 'استلمنا من' : 'دفعنا إلى'}:</span>
                <span className="flex-1 text-sm font-black italic text-zinc-800">{printingVoucher.partyName}</span>
             </div>
             
             <div className="flex items-baseline gap-2 border-b border-zinc-100 pb-1">
                <span className="text-rose-900 font-black text-[11px] whitespace-nowrap">مبلغاً وقدره:</span>
                <span className="flex-1 text-xs font-bold text-zinc-700">{tafqeet(displayAmount || 0, displayCurrencyName)}</span>
             </div>

             <div className="flex items-baseline gap-2 border-b border-zinc-100 pb-1">
                <span className="text-rose-900 font-black text-[11px] whitespace-nowrap">وذلك عن:</span>
                <span className="flex-1 text-xs font-bold text-zinc-600">{printingVoucher.statement}</span>
             </div>

             {/* صندوق المبلغ - Amount Box */}
             <div className="flex justify-center pt-2">
                <div className="bg-zinc-900 p-[1px] rounded-lg">
                   <div className="bg-white border border-rose-900 rounded-md px-6 py-1 flex items-center gap-4">
                      <div className="flex flex-col items-center">
                         <span className="text-[7px] font-black text-rose-900 leading-none">AMOUNT | المبلغ</span>
                         <div className="text-xl font-black font-mono tracking-tighter leading-none mt-1">
                            {displayAmount?.toLocaleString()}
                         </div>
                      </div>
                      <div className="h-6 w-px bg-zinc-200"></div>
                      <span className="text-[10px] font-black text-zinc-400">{displayCurrencySymbol}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* التواقيع - Footer */}
          <div className="flex justify-between px-4 pt-2 border-t border-zinc-100 relative z-10">
             <div className="flex flex-col items-center">
                <span className="text-zinc-400 font-bold text-[8px] mb-4 uppercase">{type === 'قبض' ? 'المسلم' : 'المستلم'}</span>
                <div className="w-20 border-b border-zinc-200"></div>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-zinc-400 font-bold text-[8px] mb-4 uppercase">المحاسب</span>
                <div className="flex flex-col items-center">
                   <div className="w-20 border-b border-zinc-200"></div>
                   <span className="text-[8px] font-black text-zinc-800 mt-0.5">{settings?.accountantName}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* نافذة تقرير العميل */}
      {showCustomerReport && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
           <style>{`
             @media print {
               @page { size: A4 portrait; margin: 5mm; }
               body * { visibility: hidden; }
               .printable-report, .printable-report * { visibility: visible; }
               .printable-report { 
                 position: absolute; left: 0; top: 0; width: 100%; 
                 background: white !important; color: black !important;
                 padding: 10mm;
               }
               .no-print { display: none !important; }
             }
           `}</style>
           <div className="bg-zinc-900/50 w-full max-w-6xl rounded-[3rem] border border-zinc-800 shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[95vh] print:bg-white print:border-none print:shadow-none print:rounded-none print:max-h-none print:static printable-report">
              <div className="print-only flex justify-between items-center bg-zinc-900 p-8 text-white border-b-8 border-primary mb-8 rounded-b-[2rem]">
                 <div className="flex items-center gap-6">
                    {settings?.logoUrl && <img src={settings.logoUrl} className="w-24 h-24 object-contain bg-white p-2 rounded-2xl" />}
                    <div>
                       <h1 className="text-4xl font-black">{settings?.companyName}</h1>
                       <p className="text-sm font-bold opacity-60 tracking-widest">{settings?.companyType}</p>
                    </div>
                 </div>
                 <div className="text-center">
                    <h2 className="text-3xl font-black underline underline-offset-[12px] decoration-primary">تقرير كشف حساب {type === 'قبض' ? 'زبون' : 'مورد'}</h2>
                    <div className="mt-6 flex flex-col gap-1">
                       <span className="text-xs bg-white/10 px-4 py-1 rounded-full border border-white/20">الفترة: {reportStart || 'البداية'} ← {reportEnd || 'اليوم'}</span>
                       <span className="text-[12px] font-black text-primary uppercase mt-1 tracking-widest">{reportParty}</span>
                    </div>
                 </div>
                 <div className="text-left text-xs font-bold space-y-1">
                    <p className="font-black text-primary">المحاسبة والمالية</p>
                    <p>{settings?.address}</p>
                    <p dir="ltr">{new Date().toLocaleDateString('ar-SA')}</p>
                 </div>
              </div>
              <div className="p-8 flex justify-between items-center shrink-0 no-print border-b border-zinc-800/50">
                 <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-2xl shadow-inner border border-primary/20"><FileText className="text-primary w-7 h-7" /></div>
                    <h3 className="text-2xl font-black text-white">تحليل مالي للطرف: <span className="text-primary">{reportParty || '...'}</span></h3>
                 </div>
                 <button onClick={() => setShowCustomerReport(false)} className="text-zinc-500 hover:text-white transition-all bg-zinc-800 p-3 rounded-2xl hover:bg-rose-900"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar print:overflow-visible print:p-0">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                    <div className="flex flex-col gap-2">
                       <label className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mr-1">اختيار الطرف</label>
                       <select value={reportParty} onChange={e => setReportParty(e.target.value)} className="bg-zinc-950 border-2 border-zinc-800 text-white p-4 rounded-2xl font-black text-lg outline-none focus:border-primary shadow-xl appearance-none">
                          <option value="">-- اختر الطرف --</option>
                          {parties.map(p => <option key={p.id} value={p.name}>{p.name} ({p.type})</option>)}
                       </select>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mr-1">من تاريخ</label>
                       <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="bg-zinc-950 border-2 border-zinc-800 text-white p-4 rounded-2xl font-mono text-sm outline-none focus:border-primary shadow-xl" />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mr-1">إلى تاريخ</label>
                       <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="bg-zinc-950 border-2 border-zinc-800 text-white p-4 rounded-2xl font-mono text-sm outline-none focus:border-primary shadow-xl" />
                    </div>
                 </div>
                 {reportParty && (
                    <>
                       <div className="flex flex-row items-stretch gap-6 print:gap-4 print-summary-grid">
                          <div className="flex-1 bg-zinc-950/50 p-8 rounded-[2.5rem] border-2 border-zinc-800 flex flex-col items-center justify-center gap-3 shadow-2xl print:bg-white print:border print:border-zinc-200 print:rounded-3xl print:p-6 print:shadow-none print:card">
                             <span className="text-[12px] font-black text-zinc-500 uppercase tracking-widest text-center">إجمالي المسحوبات (الديون)</span>
                             <span className="text-5xl font-mono font-black text-white print:text-zinc-900">{due.toLocaleString()}</span>
                          </div>
                          <div className="flex-1 bg-zinc-950/50 p-8 rounded-[2.5rem] border-2 border-zinc-800 flex flex-col items-center justify-center gap-3 shadow-2xl print:bg-white print:border print:border-zinc-200 print:rounded-3xl print:p-6 print:shadow-none print:card">
                             <span className="text-[12px] font-black text-emerald-500 uppercase tracking-widest text-center">إجمالي المدفوعات (الواصل)</span>
                             <span className="text-5xl font-mono font-black text-emerald-500">{paid.toLocaleString()}</span>
                          </div>
                          <div className="flex-1 bg-rose-900/10 p-8 rounded-[2.5rem] border-2 border-rose-900/30 flex flex-col items-center justify-center gap-3 shadow-2xl print:bg-rose-50/20 print:border print:border-rose-100 print:rounded-3xl print:p-6 print:shadow-none print:card">
                             <span className="text-[12px] font-black text-rose-500 uppercase tracking-widest text-center">الرصيد المتبقي (الذمة)</span>
                             <span className="text-6xl font-mono font-black text-rose-500">{(due - paid).toLocaleString()}</span>
                          </div>
                       </div>
                       <div className="border-2 border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-inner print:rounded-none print:border print:border-zinc-300">
                          <table className="w-full text-right border-collapse print-table">
                             <thead>
                                <tr className="bg-zinc-800 text-zinc-400 font-black text-[11px] uppercase tracking-widest h-14 print:bg-zinc-100 print:text-zinc-600">
                                   <th className="p-5 border-l border-zinc-700 w-32">التاريخ</th>
                                   <th className="p-5 border-l border-zinc-700 w-32 text-center">رقم السند</th>
                                   <th className="p-5 border-l border-zinc-700">البيان / الوصف</th>
                                   <th className="p-5 text-center w-48">القيمة</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-zinc-800 print:divide-zinc-200">
                                {reportVouchers.length === 0 ? (
                                   <tr><td colSpan={4} className="p-20 text-center italic text-zinc-600 font-black text-lg">لا توجد حركات مالية مسجلة لهذا الحساب في الفترة المحددة</td></tr>
                                ) : reportVouchers.map(v => (
                                   <tr key={v.id} className="hover:bg-zinc-800/30 text-base font-bold text-zinc-300 h-14 print:text-zinc-900 print:hover:bg-zinc-50">
                                      <td className="p-5 border-l border-zinc-800 font-mono text-xs text-zinc-500 print:border-zinc-200">{v.date}</td>
                                      <td className="p-5 border-l border-zinc-700 text-center font-black print:border-zinc-200">#{v.voucherNumber || '---'}</td>
                                      <td className="p-5 border-l border-zinc-800 print:border-zinc-200">{v.statement}</td>
                                      <td className="p-5 text-center font-mono font-black text-2xl text-emerald-500 print:text-emerald-700">{ (v.receivedSYP || v.paidSYP || v.receivedUSD || v.paidUSD).toLocaleString() }</td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </>
                 )}
              </div>
              <div className="bg-zinc-950 p-8 border-t border-zinc-800 flex justify-end gap-3 shrink-0 no-print">
                 <button onClick={() => window.print()} className="bg-primary text-white px-16 py-4 rounded-3xl font-black flex items-center gap-3 shadow-[0_10px_30px_rgba(225,29,72,0.3)] hover:scale-105 active:scale-95 transition-all text-xl"><Printer className="w-7 h-7" /> طباعة الكشف المالي</button>
                 <button onClick={() => setShowCustomerReport(false)} className="bg-zinc-800 text-zinc-400 px-10 py-4 rounded-3xl font-bold hover:text-zinc-200">إلغاء</button>
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
          <button onClick={() => setShowCustomerReport(true)} className="bg-zinc-900 border border-zinc-800 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-zinc-800 transition-all"><FileText className="w-5 h-5 text-rose-900" /> تقرير العميل</button>
          <button onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }} className="bg-rose-900 text-white px-10 py-3 rounded-2xl font-black flex items-center gap-3 shadow-[0_10px_40px_-10px_rgba(225,29,72,0.4)] hover:brightness-110 transition-all active:scale-95"><Plus className="w-6 h-6" /> سند {type} جديد</button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-rose-900/20 shadow-2xl space-y-8 animate-in zoom-in-95 no-print relative overflow-hidden">
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
              <button onClick={handleSave} className="bg-rose-900 text-white px-16 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 hover:scale-105 transition-all"><Save className="w-6 h-6" /> حفظ وتثبيت السند</button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="bg-zinc-800 text-zinc-500 px-10 py-4 rounded-2xl font-bold hover:text-zinc-300 transition-colors">إلغاء</button>
           </div>
        </div>
      )}

      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 flex items-center gap-4 no-print shadow-2xl">
        <div className="relative flex-1">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 w-6 h-6" />
          <input 
            type="text" 
            placeholder="بحث سريع في السندات (الطرف، البيان، الرقم)..." 
            className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-4 pr-14 pl-6 outline-none font-bold text-white focus:border-rose-900 transition-all" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
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
                  <tr key={v.id} className="hover:bg-rose-900/5 transition-all group h-16">
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
      
      <div className="text-zinc-700 text-[10px] font-black uppercase text-center py-4 tracking-[0.5em] no-print">
        {settings?.companyName} Secure Ledger System v3.1
      </div>
    </div>
  );
};

export default VoucherListView;
