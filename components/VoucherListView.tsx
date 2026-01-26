
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Plus, Trash2, Edit2, Save, X, FileDown, Calendar as CalendarIcon, FileText, Search, User, Hash, MessageSquare, Coins, CreditCard } from 'lucide-react';
import { CashEntry, Party, AppSettings, SalesInvoice, PurchaseInvoice, PartyType } from '../types';
import { tafqeet } from '../utils/tafqeet';

declare var html2pdf: any;

interface VoucherListViewProps {
  onBack: () => void;
  type: 'قبض' | 'دفع';
}

const VoucherListView: React.FC<VoucherListViewProps> = ({ onBack, type }) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [vouchers, setVouchers] = useState<CashEntry[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<CashEntry | null>(null);
  const [selectedCurrencyType, setSelectedCurrencyType] = useState<'primary' | 'secondary'>('primary');
  
  const [showCustomerReport, setShowCustomerReport] = useState(false);
  const [reportParty, setReportParty] = useState('');
  const [reportStart, setReportStart] = useState('');
  const [reportEnd, setReportEnd] = useState('');

  const [formData, setFormData] = useState<Partial<CashEntry>>({
    voucherNumber: '',
    date: new Date().toISOString().split('T')[0],
    statement: '',
    partyName: '',
    amount: 0,
    notes: ''
  });

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

  const handleEdit = (v: CashEntry) => {
    setEditingId(v.id);
    const amountVal = (v.receivedSYP || v.paidSYP || v.receivedUSD || v.paidUSD || 0);
    setFormData({ ...v, amount: amountVal });
    const isPrimary = (v.receivedSYP || 0) > 0 || (v.paidSYP || 0) > 0;
    setSelectedCurrencyType(isPrimary ? 'primary' : 'secondary');
    setIsAdding(true);
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

  const handleExportPDF = async () => {
    if (!printableRef.current || !printingVoucher || isProcessing) return;
    
    setIsProcessing(true);
    const element = printableRef.current;
    
    const opt = {
      margin: 0,
      filename: `Voucher_${printingVoucher.voucherNumber || '000'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 4, 
        useCORS: true,
        letterRendering: false,
        scrollY: 0,
        scrollX: 0,
        windowWidth: 1200 // ضبط عرض نافذة التصدير لضمان عدم القص
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a5', 
        orientation: 'landscape' 
      }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportReportPDF = async () => {
    if (!reportRef.current || isProcessing) return;
    setIsProcessing(true);
    const element = reportRef.current;
    const opt = {
      margin: 0,
      filename: `Statement_${reportParty || 'Report'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 4, 
        useCORS: true,
        letterRendering: false,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };
    try {
      await html2pdf().set(opt).from(element).save();
    } finally {
      setIsProcessing(false);
    }
  };

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
      <div className="min-h-screen bg-zinc-200 flex flex-col items-center p-4 md:p-10 animate-in fade-in" dir="rtl">
        <style>{`
          @media print {
            @page { size: 210mm 148.5mm landscape; margin: 0 !important; }
            body { margin: 0 !important; padding: 0 !important; background: white !important; }
            .no-print { display: none !important; }
            .print-receipt-half { 
              width: 210mm !important; 
              height: 148.5mm !important; 
              margin: 0 !important; 
              padding: 0 !important; 
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              background: white !important;
              border: none !important;
              box-shadow: none !important;
              position: absolute !important;
              top: 0 !important;
              right: 0 !important;
            }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          .receipt-inner-container {
             box-sizing: border-box;
             width: 100%;
             height: 100%;
             padding: 10mm;
             display: flex;
             flex-direction: column;
          }
        `}</style>
        
        <div className="w-full max-w-xl mb-6 no-print flex justify-between items-center bg-white p-6 rounded-3xl shadow-xl border border-zinc-200">
           <button onClick={() => setPrintingVoucher(null)} className="flex items-center gap-2 text-zinc-500 font-black hover:text-rose-900 transition-colors">
              <ArrowRight className="w-5 h-5" /> رجوع
           </button>
           <div className="flex gap-2">
              <button onClick={handleExportPDF} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg">
                <FileDown className="w-5 h-5" /> تصدير PDF
              </button>
              <button onClick={() => window.print()} className="bg-rose-900 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg hover:brightness-110 transition-all">
                <Printer className="w-5 h-5" /> طباعة
              </button>
           </div>
        </div>

        <div ref={printableRef} className="print-receipt-half bg-white text-zinc-900 w-[210mm] h-[148.5mm] shadow-2xl flex flex-col relative overflow-hidden">
          <div className="receipt-inner-container">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none -rotate-12">
               <span className="text-[70px] font-black uppercase text-rose-900 leading-none text-center">
                 {settings?.companyName}<br/><span className="text-xl">SECURED SYSTEM</span>
               </span>
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b-2 border-rose-900 pb-4">
               <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-black text-rose-900 leading-none">{settings?.companyName}</h1>
                  <div className="text-[10px] font-bold text-zinc-400" dir="ltr">{settings?.phone}</div>
               </div>
               {settings?.logoUrl ? (
                 <img src={settings.logoUrl} className="w-14 h-14 object-contain" alt="Logo" />
               ) : (
                 <div className="w-12 h-12 bg-rose-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg">XO</div>
               )}
            </div>

            {/* Title Section */}
            <div className="text-center mb-6">
               <h2 className="text-4xl font-black text-rose-900 tracking-tight">سند {type} مالي</h2>
               <div className="flex items-center justify-center gap-10 mt-3 border-t border-zinc-100 pt-2">
                  <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">رقم السند: {printingVoucher.voucherNumber || printingVoucher.id.slice(0, 6).toUpperCase()}</span>
                  <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">التاريخ: {printingVoucher.date}</span>
               </div>
            </div>

            {/* Main Content Areas */}
            <div className="flex-1 space-y-8 pt-2">
               <div className="space-y-1.5 border-b border-zinc-100 pb-2">
                  <span className="text-rose-900 font-black text-xs uppercase tracking-wider">{type === 'قبض' ? 'استلمنا من السيد' : 'دفعنا إلى السيد'}:</span>
                  <div className="text-3xl font-black text-zinc-800 italic leading-none">{printingVoucher.partyName}</div>
               </div>

               <div className="space-y-1.5 border-b border-zinc-100 pb-2">
                  <span className="text-rose-900 font-black text-xs uppercase tracking-wider">مبلغاً وقدره:</span>
                  <div className="text-lg font-black text-zinc-600 leading-relaxed italic">
                     {tafqeet(displayAmount || 0, displayCurrencyName)}
                  </div>
               </div>

               <div className="space-y-1.5 border-b border-zinc-100 pb-2">
                  <span className="text-rose-900 font-black text-xs uppercase tracking-wider">وذلك عن:</span>
                  <div className="text-xl font-bold text-zinc-500 leading-relaxed">
                     {printingVoucher.statement}
                  </div>
               </div>
            </div>

            {/* Amount Box */}
            <div className="flex justify-center my-4">
               <div className="bg-zinc-50 border-4 border-rose-900 rounded-[2rem] px-16 py-4 flex flex-col items-center min-w-[320px] shadow-lg">
                  <div className="text-[10px] font-black text-rose-900 uppercase tracking-[0.2em] mb-1">المبلغ الصافي | TOTAL AMOUNT</div>
                  <div className="flex items-center gap-4">
                     <span className="text-6xl font-black font-mono tracking-tighter text-zinc-900">{displayAmount?.toLocaleString()}</span>
                     <span className="text-2xl font-black text-zinc-400 uppercase">{displayCurrencySymbol}</span>
                  </div>
               </div>
            </div>

            {/* Signatures */}
            <div className="mt-auto pt-6 border-t border-zinc-100 flex justify-between items-end">
               <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-10">توقيع {type === 'قبض' ? 'المسلم' : 'المستلم'}</span>
                  <div className="w-32 border-b border-zinc-200"></div>
               </div>
               <div className="flex flex-col items-center text-center">
                  <div className="text-[11px] font-black text-zinc-800 mb-1">{settings?.accountantName}</div>
                  <div className="w-32 border-b-2 border-rose-900 mb-2"></div>
                  <span className="text-[9px] font-black text-rose-900 uppercase tracking-widest">توقيع المحاسب المعتمد</span>
               </div>
            </div>
            
            <div className="absolute bottom-3 left-0 right-0 text-center">
               <span className="text-[7px] font-bold text-zinc-300 italic opacity-40 uppercase tracking-[0.6em]">SAMLATOR SECURED LEDGER SYSTEM V3.5</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-8 space-y-8">
                 <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-5">
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-2xl ${type === 'قبض' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                          <Plus className="w-6 h-6" />
                       </div>
                       <h3 className="text-2xl font-black text-readable">{editingId ? `تعديل سند ${type}` : `إنشاء سند ${type} مالي جديد`}</h3>
                    </div>
                    <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
                       <X className="w-6 h-6 text-zinc-400" />
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1"><User className="w-3 h-3" /> الحساب / الطرف</label>
                       <select value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black text-readable outline-none focus:border-rose-900 transition-all appearance-none cursor-pointer">
                          <option value="">-- اختر الحساب --</option>
                          {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                       </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1"><Hash className="w-3 h-3" /> رقم السند (اختياري)</label>
                       <input type="text" value={formData.voucherNumber} onChange={e => setFormData({...formData, voucherNumber: e.target.value})} placeholder="تلقائي" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black text-readable outline-none focus:border-rose-900 transition-all" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> التاريخ</label>
                       <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-mono text-readable outline-none focus:border-rose-900 transition-all" />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> البيان / التفاصيل</label>
                       <input type="text" value={formData.statement} onChange={e => setFormData({...formData, statement: e.target.value})} placeholder="مثلاً: دفعة..." className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black text-readable outline-none focus:border-rose-900 transition-all" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2">العملة</label>
                       <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border dark:border-zinc-700 h-[60px]">
                          <button onClick={() => setSelectedCurrencyType('primary')} className={`flex-1 flex items-center justify-center gap-2 rounded-xl transition-all ${selectedCurrencyType === 'primary' ? 'bg-rose-900 text-white shadow-lg' : 'text-zinc-500'}`}>
                             <Coins className="w-4 h-4" /> <span className="text-xs font-black">{settings?.currencySymbol || '1'}</span>
                          </button>
                          <button onClick={() => setSelectedCurrencyType('secondary')} className={`flex-1 flex items-center justify-center gap-2 rounded-xl transition-all ${selectedCurrencyType === 'secondary' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500'}`}>
                             <CreditCard className="w-4 h-4" /> <span className="text-xs font-black">{settings?.secondaryCurrencySymbol || '2'}</span>
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed dark:border-zinc-800 rounded-[2rem] gap-4">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">المبلغ الصافي</span>
                    <div className="relative group w-full max-w-sm">
                       <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full bg-transparent border-b-4 border-zinc-200 dark:border-zinc-800 text-center text-6xl font-mono font-black text-readable outline-none focus:border-rose-900 transition-all" autoFocus />
                       <div className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-300 font-black text-2xl uppercase">{selectedCurrencyType === 'primary' ? settings?.currencySymbol : settings?.secondaryCurrencySymbol}</div>
                    </div>
                    <div className="text-sm font-black text-rose-900 dark:text-rose-500 italic text-center">
                       {tafqeet(formData.amount || 0, selectedCurrencyType === 'primary' ? settings?.currency || 'ليرة' : settings?.secondaryCurrency || 'دولار')}
                    </div>
                 </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 flex justify-end gap-3 border-t dark:border-zinc-800">
                 <button onClick={handleSave} className="bg-rose-900 text-white px-16 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all text-lg flex items-center gap-3">
                    <Save className="w-6 h-6" /> {editingId ? 'تحديث السند' : 'حفظ السند المالي'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {showCustomerReport && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
           <style>{`
             @media print {
               @page { size: A4 portrait; margin: 8mm; }
               body * { visibility: hidden; }
               .printable-report, .printable-report * { visibility: visible; }
               .printable-report { 
                 position: absolute; left: 0; top: 0; width: 100%; 
                 background: white !important; color: black !important;
                 padding: 0 !important; 
               }
               .no-print { display: none !important; }
             }
           `}</style>
           <div className="bg-zinc-900/50 w-full max-w-6xl rounded-[3rem] border border-zinc-800 shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[95vh] print:bg-white print:border-none print:shadow-none print:rounded-none print:max-h-none print:static">
              
              <div ref={reportRef} className="printable-report flex flex-col min-h-full">
                {/* Header */}
                <div className="flex justify-between items-center bg-zinc-900 p-6 text-white border-b-4 border-primary rounded-b-3xl">
                  <div className="flex items-center gap-4">
                      {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-xl" />}
                      <div>
                        <h1 className="text-2xl font-black leading-none">{settings?.companyName}</h1>
                        <p className="text-[9px] font-bold opacity-60 tracking-[0.2em] mt-1">{settings?.companyType}</p>
                      </div>
                  </div>
                  <div className="text-center">
                      <h2 className="text-2xl font-black underline underline-offset-8 decoration-primary">تقرير كشف حساب مالي</h2>
                      <div className="mt-3 flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{reportParty}</span>
                      </div>
                  </div>
                  <div className="text-left text-[10px] font-bold space-y-0.5">
                      <p className="font-black text-primary uppercase">Financial Log</p>
                      <p>{settings?.address}</p>
                      <p dir="ltr">{new Date().toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>

                <div className="p-8 flex justify-between items-center shrink-0 no-print border-b border-zinc-800/50">
                  <div className="flex items-center gap-4">
                      <div className="bg-primary/20 p-3 rounded-2xl border border-primary/20"><FileText className="text-primary w-7 h-7" /></div>
                      <h3 className="text-2xl font-black text-white">تحليل مالي للطرف: <span className="text-primary">{reportParty || '...'}</span></h3>
                  </div>
                  <button onClick={() => setShowCustomerReport(false)} className="text-zinc-500 hover:text-white transition-all bg-zinc-800 p-3 rounded-2xl hover:bg-rose-900"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar print:overflow-visible print:p-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">الحساب</label>
                        <select value={reportParty} onChange={e => setReportParty(e.target.value)} className="bg-zinc-950 border-2 border-zinc-800 text-white p-3 rounded-xl font-black text-sm outline-none focus:border-primary shadow-xl appearance-none">
                            <option value="">-- اختر الطرف --</option>
                            {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">من تاريخ</label>
                        <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="bg-zinc-950 border-2 border-zinc-800 text-white p-3 rounded-xl font-mono text-xs outline-none focus:border-primary shadow-xl" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">إلى تاريخ</label>
                        <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="bg-zinc-950 border-2 border-zinc-800 text-white p-3 rounded-xl font-mono text-xs outline-none focus:border-primary shadow-xl" />
                      </div>
                  </div>

                  {reportParty && (
                      <>
                        <div className="flex flex-row items-stretch gap-4 print:gap-2">
                            <div className="flex-1 bg-zinc-950/50 p-6 rounded-3xl border-2 border-zinc-800 flex flex-col items-center justify-center gap-1 shadow-2xl print:bg-white print:border print:border-zinc-200 print:rounded-2xl print:p-4">
                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">إجمالي المسحوبات</span>
                              <span className="text-3xl font-mono font-black text-white print:text-zinc-900">{due.toLocaleString()}</span>
                            </div>
                            <div className="flex-1 bg-zinc-950/50 p-6 rounded-3xl border-2 border-zinc-800 flex flex-col items-center justify-center gap-1 shadow-2xl print:bg-white print:border print:border-zinc-200 print:rounded-2xl print:p-4">
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center">إجمالي المدفوعات</span>
                              <span className="text-3xl font-mono font-black text-emerald-500">{paid.toLocaleString()}</span>
                            </div>
                            <div className="flex-1 bg-rose-900/10 p-6 rounded-3xl border-2 border-rose-900/30 flex flex-col items-center justify-center gap-1 shadow-2xl print:bg-rose-50/20 print:border print:border-rose-100 print:rounded-2xl print:p-4">
                              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">الرصيد المتبقي</span>
                              <span className="text-4xl font-mono font-black text-rose-500">{(due - paid).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="border-2 border-zinc-800 rounded-[2rem] overflow-hidden shadow-inner print:rounded-none print:border print:border-zinc-300">
                            <table className="w-full text-right border-collapse">
                              <thead>
                                  <tr className="bg-zinc-800 text-zinc-400 font-black text-[10px] uppercase tracking-widest h-12 print:bg-zinc-100 print:text-zinc-600">
                                    <th className="p-4 border-l border-zinc-700 w-32">التاريخ</th>
                                    <th className="p-4 border-l border-zinc-700 w-32 text-center">رقم السند</th>
                                    <th className="p-4 border-l border-zinc-700">البيان / الوصف</th>
                                    <th className="p-4 text-center w-48">القيمة</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800 print:divide-zinc-200">
                                  {reportVouchers.length === 0 ? (
                                    <tr><td colSpan={4} className="p-20 text-center italic text-zinc-600 font-black text-lg">لا توجد حركات مالية</td></tr>
                                  ) : reportVouchers.map(v => (
                                    <tr key={v.id} className="hover:bg-zinc-800/30 text-sm font-bold text-zinc-300 h-12 print:text-zinc-900">
                                        <td className="p-4 border-l border-zinc-800 font-mono text-xs text-zinc-500 print:border-zinc-200">{v.date}</td>
                                        <td className="p-4 border-l border-zinc-700 text-center font-black print:border-zinc-200">#{v.voucherNumber || '---'}</td>
                                        <td className="p-4 border-l border-zinc-800 print:border-zinc-200">{v.statement}</td>
                                        <td className="p-4 text-center font-mono font-black text-xl text-emerald-500 print:text-emerald-700">{(v.receivedSYP || v.paidSYP || v.receivedUSD || v.paidUSD).toLocaleString()}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                        </div>
                      </>
                  )}
                </div>
              </div>

              <div className="bg-zinc-950 p-8 border-t border-zinc-800 flex justify-end gap-3 shrink-0 no-print">
                 <button onClick={handleExportReportPDF} disabled={isProcessing} className="bg-emerald-600 text-white px-10 py-4 rounded-3xl font-black flex items-center gap-3 shadow-xl hover:scale-105 transition-all text-lg">
                    <FileDown className="w-6 h-6" /> {isProcessing ? 'جاري التحويل...' : 'تصدير نسخة PDF'}
                 </button>
                 <button onClick={() => window.print()} className="bg-primary text-white px-12 py-4 rounded-3xl font-black flex items-center gap-3 shadow-xl hover:scale-105 transition-all text-lg">
                    <Printer className="w-6 h-6" /> طباعة الكشف المالي
                 </button>
                 <button onClick={() => setShowCustomerReport(false)} className="bg-zinc-800 text-zinc-400 px-10 py-4 rounded-3xl font-bold hover:text-zinc-200">إغلاق</button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between no-print gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-900 rounded-xl transition-all shadow-lg"><ArrowRight className="w-6 h-6" /></button>
          <h2 className="text-3xl font-black text-rose-900 tracking-tight uppercase">سجلات ال{type} المالي</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCustomerReport(true)} className="bg-zinc-900 border border-zinc-800 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-zinc-800 transition-all"><FileText className="w-5 h-5 text-rose-900" /> كشف حساب</button>
          <button onClick={() => { resetForm(); setIsAdding(true); setEditingId(null); }} className="bg-rose-900 text-white px-10 py-3 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:brightness-110 transition-all"><Plus className="w-6 h-6" /> سند {type} جديد</button>
        </div>
      </div>

      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 flex items-center gap-4 no-print">
        <div className="relative flex-1">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث سريع في السندات..." 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3.5 pr-14 outline-none font-bold text-white focus:border-rose-900 transition-all" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="bg-zinc-950 rounded-[2rem] border border-rose-900/20 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead className="bg-rose-900 text-white text-[10px] font-black uppercase tracking-widest h-14">
              <tr>
                <th className="p-4 border-l border-rose-950 text-center w-24">رقم السند</th>
                <th className="p-4 border-l border-rose-950 text-center w-32">التاريخ</th>
                <th className="p-4 border-l border-rose-950">الحساب</th>
                <th className="p-4 border-l border-rose-950">البيان</th>
                <th className="p-4 border-l border-rose-950 text-center w-40">المبلغ</th>
                <th className="p-4 text-center w-32 no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {currentFilteredList.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center italic text-zinc-700 font-bold">لا يوجد سندات</td></tr>
              ) : currentFilteredList.map(v => (
                  <tr key={v.id} className="hover:bg-rose-900/5 transition-all group h-14">
                    <td className="p-4 text-center font-mono font-black text-rose-900/80">#{v.voucherNumber || v.id.slice(0, 4)}</td>
                    <td className="p-4 text-center font-mono text-zinc-600">{v.date}</td>
                    <td className="p-4 text-white font-black">{v.partyName}</td>
                    <td className="p-4 text-zinc-500 truncate max-w-[250px]">{v.statement}</td>
                    <td className="p-4 text-center font-black text-lg text-zinc-200">{(v.receivedSYP || v.paidSYP || v.receivedUSD || v.paidUSD).toLocaleString()}</td>
                    <td className="p-4 no-print">
                      <div className="flex justify-center gap-2 opacity-40 group-hover:opacity-100 transition-all">
                        <button onClick={() => setPrintingVoucher(v)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white" title="طباعة"><Printer className="w-5 h-5" /></button>
                        <button onClick={() => handleEdit(v)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-amber-500" title="تعديل"><Edit2 className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(v.id)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-rose-500" title="حذف"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VoucherListView;
