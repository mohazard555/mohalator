
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Plus, Trash2, Edit2, Save, X, FileDown, Calendar as CalendarIcon, FileText, Search, Coins, CreditCard, User, Hash, MessageSquare } from 'lucide-react';
import { CashEntry, Party, AppSettings, SalesInvoice, PurchaseInvoice, PartyType } from '../types';
import { tafqeet } from '../utils/tafqeet';
import { PdfExportService } from '../utils/PdfExportService';

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

  const resetForm = () => {
    setFormData({
      voucherNumber: '',
      date: new Date().toISOString().split('T')[0],
      statement: '',
      partyName: '',
      amount: 0,
      notes: ''
    });
    setSelectedCurrencyType('primary');
  };

  const handleEdit = (v: CashEntry) => {
    setEditingId(v.id);
    const amount = (v.receivedSYP || v.paidSYP || v.receivedUSD || v.paidUSD || 0);
    setFormData({
      ...v,
      amount: amount
    });
    const isPrimary = (v.receivedSYP || 0) > 0 || (v.paidSYP || 0) > 0;
    setSelectedCurrencyType(isPrimary ? 'primary' : 'secondary');
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    if (editingId) {
      allEntries = allEntries.map((e: CashEntry) => e.id === editingId ? entry : e);
    } else {
      allEntries = [entry, ...allEntries];
    }

    localStorage.setItem('sheno_cash_journal', JSON.stringify(allEntries));
    setIsAdding(false);
    setEditingId(null);
    loadData();
    resetForm();
    alert('تم حفظ السند بنجاح');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السند نهائياً؟')) {
      const savedVouchers = localStorage.getItem('sheno_cash_journal');
      if (savedVouchers) {
        const all: CashEntry[] = JSON.parse(savedVouchers);
        const updated = all.filter(v => v.id !== id);
        localStorage.setItem('sheno_cash_journal', JSON.stringify(updated));
        loadData();
      }
    }
  };

  const handleExportPDF = async () => {
    if (!printableRef.current || !printingVoucher || isProcessing) return;
    setIsProcessing(true);
    try {
      await PdfExportService.export({
        element: printableRef.current,
        fileName: `سند_${type}_${printingVoucher.voucherNumber || '000'}`,
        orientation: 'landscape',
        format: 'a5'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateCustomerTotals = () => {
    if (!reportParty) return { due: 0, paid: 0, filteredVouchers: [] };
    let totalDue = 0;
    if (type === 'قبض') {
      const salesRaw = localStorage.getItem('sheno_sales_invoices');
      if (salesRaw) {
        const sales: SalesInvoice[] = JSON.parse(salesRaw);
        totalDue = sales.filter(s => s.customerName === reportParty).reduce((acc, curr) => acc + curr.totalAmount, 0);
      }
    } else {
      const purRaw = localStorage.getItem('sheno_purchases');
      if (purRaw) {
        const pur: PurchaseInvoice[] = JSON.parse(purRaw);
        totalDue = pur.filter(p => p.supplierName === reportParty).reduce((acc, curr) => acc + curr.totalAmount, 0);
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
    const totalPaid = allFilteredVouchers.reduce((acc, curr) => acc + (curr.receivedSYP || curr.paidSYP || curr.receivedUSD || curr.paidUSD || 0), 0);
    return { due: totalDue, paid: totalPaid, filteredVouchers: allFilteredVouchers };
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
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center p-4 md:p-10 animate-in fade-in" dir="rtl">
        <style>{`
          @media print {
            @page { size: 210mm 148.5mm landscape; margin: 0 !important; }
            body { margin: 0 !important; padding: 0 !important; background: white !important; }
            .no-print { display: none !important; }
            .print-receipt-half { 
              width: 210mm !important; 
              height: 148.5mm !important; 
              margin: 0 !important; 
              padding: 12mm !important; 
              display: flex !important;
              flex-direction: column !important;
              background: white !important;
              border: none !important;
              box-shadow: none !important;
            }
          }
        `}</style>
        
        <div className="w-full max-w-xl mb-6 no-print flex justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
           <button onClick={() => setPrintingVoucher(null)} className="flex items-center gap-2 text-zinc-500 font-black hover:text-rose-900 transition-colors">
              <ArrowRight className="w-5 h-5" /> رجوع
           </button>
           <div className="flex gap-2">
              <button onClick={handleExportPDF} disabled={isProcessing} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
                {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FileDown className="w-5 h-5" />}
                تصدير PDF
              </button>
              <button onClick={() => window.print()} className="bg-rose-900 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg hover:brightness-110 transition-all">
                <Printer className="w-5 h-5" /> طباعة
              </button>
           </div>
        </div>

        <div ref={printableRef} className="print-receipt-half bg-white text-zinc-900 w-[210mm] h-[148.5mm] shadow-2xl flex flex-col p-12 relative overflow-hidden rounded-xl">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -rotate-12">
             <span className="text-[60px] font-black uppercase text-rose-900">{settings?.companyName}</span>
          </div>

          <div className="flex justify-between items-start mb-8 border-b-2 border-rose-900 pb-4">
             <div className="flex flex-col gap-1">
                <h1 className="text-xl font-black text-rose-900 leading-none">{settings?.companyName}</h1>
                <div className="text-[10px] font-bold text-zinc-400" dir="ltr">{settings?.phone}</div>
             </div>
             {settings?.logoUrl ? <img src={settings.logoUrl} className="w-14 h-14 object-contain" alt="Logo" /> : <div className="w-12 h-12 bg-rose-600 rounded-lg flex items-center justify-center text-white font-black text-xl">XO</div>}
          </div>

          <div className="text-center mb-8">
             <h2 className="text-3xl font-black text-rose-900">سند {type} مالي</h2>
             <div className="flex items-center justify-center gap-10 mt-2 border-t border-zinc-50 pt-2">
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">رقم السند: {printingVoucher.voucherNumber || printingVoucher.id.slice(0, 6).toUpperCase()}</span>
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">التاريخ: {printingVoucher.date}</span>
             </div>
          </div>

          <div className="flex-1 space-y-8 pt-4">
             <div className="space-y-2 border-b-2 border-zinc-50 pb-2">
                <span className="text-rose-900 font-black text-sm uppercase">{type === 'قبض' ? 'استلمنا من السيد' : 'دفعنا إلى السيد'}:</span>
                <div className="text-2xl font-black text-zinc-800 italic leading-none">{printingVoucher.partyName}</div>
             </div>
             <div className="space-y-2 border-b-2 border-zinc-50 pb-2">
                <span className="text-rose-900 font-black text-sm uppercase">مبلغاً وقدره:</span>
                <div className="text-lg font-black text-zinc-600 leading-relaxed italic">
                   {tafqeet(displayAmount || 0, displayCurrencyName)}
                </div>
             </div>
             <div className="space-y-2 border-b-2 border-zinc-50 pb-2">
                <span className="text-rose-900 font-black text-sm uppercase">وذلك عن:</span>
                <div className="text-lg font-bold text-zinc-500 leading-relaxed">
                   {printingVoucher.statement}
                </div>
             </div>
          </div>

          <div className="flex justify-center mt-6">
             <div className="bg-zinc-50 border-2 border-rose-900 rounded-3xl px-16 py-4 flex flex-col items-center min-w-[280px] shadow-sm">
                <div className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-1">المبلغ الصافي | TOTAL</div>
                <div className="flex items-center gap-4">
                   <span className="text-5xl font-black font-mono tracking-tighter text-zinc-900">{displayAmount?.toLocaleString()}</span>
                   <span className="text-xl font-black text-zinc-400 uppercase">{displayCurrencySymbol}</span>
                </div>
             </div>
          </div>
          <div className="mt-12 pt-6 border-t border-zinc-100 flex justify-between items-end">
             <div className="flex flex-col items-center">
                <div className="w-32 border-b border-zinc-200 mb-2"></div>
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{type === 'قبض' ? 'المسلم' : 'المستلم'}</span>
             </div>
             <div className="flex flex-col items-center text-center">
                <div className="text-xs font-black text-zinc-800 mb-1">{settings?.accountantName}</div>
                <div className="w-32 border-b border-rose-900 mb-2"></div>
                <span className="text-[9px] font-black text-rose-900 uppercase tracking-widest">توقيع المحاسب</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* نموذج الإضافة والتعديل المطور */}
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
                       <select 
                         value={formData.partyName} 
                         onChange={e => setFormData({...formData, partyName: e.target.value})}
                         className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black text-readable outline-none focus:border-rose-900 transition-all appearance-none cursor-pointer"
                       >
                          <option value="">-- اختر الحساب --</option>
                          {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                       </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1"><Hash className="w-3 h-3" /> رقم السند (اختياري)</label>
                       <input 
                         type="text" 
                         value={formData.voucherNumber} 
                         onChange={e => setFormData({...formData, voucherNumber: e.target.value})}
                         placeholder="تلقائي"
                         className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black text-readable outline-none focus:border-rose-900 transition-all"
                       />
                    </div>

                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> التاريخ</label>
                       <input 
                         type="date" 
                         value={formData.date} 
                         onChange={e => setFormData({...formData, date: e.target.value})}
                         className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-mono text-readable outline-none focus:border-rose-900 transition-all"
                       />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> البيان / التفاصيل</label>
                       <input 
                         type="text" 
                         value={formData.statement} 
                         onChange={e => setFormData({...formData, statement: e.target.value})}
                         placeholder="مثلاً: دفعة عن طلبية رقم 45..."
                         className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black text-readable outline-none focus:border-rose-900 transition-all"
                       />
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
                       <input 
                         type="number" 
                         value={formData.amount} 
                         onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                         className="w-full bg-transparent border-b-4 border-zinc-200 dark:border-zinc-800 text-center text-6xl font-mono font-black text-readable outline-none focus:border-rose-900 transition-all"
                         autoFocus
                       />
                       <div className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-300 font-black text-2xl uppercase">{selectedCurrencyType === 'primary' ? settings?.currencySymbol : settings?.secondaryCurrencySymbol}</div>
                    </div>
                    <div className="text-sm font-black text-rose-900 dark:text-rose-500 italic">
                       {tafqeet(formData.amount || 0, selectedCurrencyType === 'primary' ? settings?.currency || 'ليرة' : settings?.secondaryCurrency || 'دولار')}
                    </div>
                 </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 flex justify-end gap-3 border-t dark:border-zinc-800">
                 <button onClick={handleSave} className="bg-rose-900 text-white px-16 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-lg flex items-center gap-3">
                    <Save className="w-6 h-6" /> {editingId ? 'تحديث السند' : 'حفظ السند المالي'}
                 </button>
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
            placeholder="بحث سريع في السندات (رقم، حساب، بيان)..." 
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
