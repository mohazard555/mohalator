
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Printer, Plus, Trash2, Edit2, Save, X, FileDown, Calendar as CalendarIcon, FileText, User, Coins, CreditCard } from 'lucide-react';
import { CashEntry, Party, AppSettings, SalesInvoice, PurchaseInvoice } from '../types';
import { exportToCSV } from '../utils/export';

// دالة التفقيط المبسطة
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
  
  // حالات التقرير الخاص بالعميل
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
    if (savedParties) setParties(JSON.parse(savedParties));
  };

  const calculateCustomerTotals = () => {
    // إصلاح الخطأ: نضمن إرجاع مصفوفة فارغة كقيمة افتراضية لـ filteredVouchers
    if (!reportParty) return { due: 0, paid: 0, filteredVouchers: [] };
    
    let totalDue = 0;
    // جلب المستحقات من الفواتير (مبيعات للقبض، مشتريات للدفع)
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

    const filteredVouchersResult = vouchers.filter(v => {
      const matchParty = v.partyName === reportParty;
      const matchStart = !reportStart || v.date >= reportStart;
      const matchEnd = !reportEnd || v.date <= reportEnd;
      return matchParty && matchStart && matchEnd;
    });

    const totalPaid = filteredVouchersResult.reduce((acc, curr) => {
      const val = (curr.receivedSYP || curr.paidSYP || curr.receivedUSD || curr.paidUSD || 0);
      return acc + val;
    }, 0);

    return { due: totalDue, paid: totalPaid, filteredVouchers: filteredVouchersResult };
  };

  const handleSave = () => {
    if (!formData.amount || !formData.partyName) return;
    
    const currencyName = selectedCurrencyType === 'primary' 
      ? (settings?.currency || 'ليرة سورية') 
      : (settings?.secondaryCurrency || 'دولار');

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

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السند نهائياً؟')) {
      const savedAll = localStorage.getItem('sheno_cash_journal');
      if (savedAll) {
        const all = JSON.parse(savedAll);
        const updated = all.filter((v: CashEntry) => v.id !== id);
        localStorage.setItem('sheno_cash_journal', JSON.stringify(updated));
        loadData();
      }
    }
  };

  const { due, paid, filteredVouchers: reportVouchers } = calculateCustomerTotals();
  const currentFilteredList = vouchers.filter(v => 
    v.partyName?.includes(searchTerm) || v.statement?.includes(searchTerm) || v.voucherNumber?.includes(searchTerm)
  );

  // عرض السند للطباعة (مستطيل - نصف A4)
  if (printingVoucher) {
    const isVoucherPrimary = (printingVoucher.receivedSYP || 0) > 0 || (printingVoucher.paidSYP || 0) > 0;
    const displayAmount = isVoucherPrimary ? (printingVoucher.receivedSYP || printingVoucher.paidSYP) : (printingVoucher.receivedUSD || printingVoucher.paidUSD);
    const displayCurrencySymbol = isVoucherPrimary ? (settings?.currencySymbol || 'ل.س') : (settings?.secondaryCurrencySymbol || '$');
    const displayCurrencyName = isVoucherPrimary ? (settings?.currency || 'ليرة سورية') : (settings?.secondaryCurrency || 'دولار');

    return (
      <div className="min-h-screen bg-zinc-100 p-4 md:p-10 animate-in fade-in" dir="rtl">
        <div className="max-w-4xl mx-auto mb-6 no-print flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
           <button onClick={() => setPrintingVoucher(null)} className="flex items-center gap-2 text-zinc-500 font-black hover:text-primary transition-colors">
             <ArrowRight className="w-5 h-5" /> العودة للقائمة
           </button>
           <button onClick={() => window.print()} className="bg-primary text-white px-10 py-3 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
             <Printer className="w-5 h-5" /> طباعة السند (نصف A4)
           </button>
        </div>

        {/* تصميم السند المستطيل (A5 عرضي) */}
        <div className="max-w-[210mm] mx-auto bg-white text-zinc-900 p-8 rounded-xl shadow-2xl border-2 border-zinc-100 flex flex-col relative print:shadow-none print:border print:border-zinc-200" style={{ minHeight: '148mm' }}>
          <style>{`
            @media print {
              body { background: white !important; padding: 0 !important; margin: 0 !important; }
              .no-print { display: none !important; }
            }
          `}</style>
          
          <div className="flex justify-between items-start mb-6 border-b-4 border-primary pb-4">
             <div className="flex flex-col gap-1">
                <div className="bg-zinc-900 text-white px-3 py-1 rounded font-mono text-lg font-black">
                  NO: {printingVoucher.voucherNumber || printingVoucher.id.slice(0, 8).toUpperCase()}
                </div>
                <div className="text-zinc-500 font-bold text-xs">التاريخ: {printingVoucher.date}</div>
             </div>
             <div className="text-center">
                <div className="text-3xl font-black text-primary">سند {type} مالي</div>
                <div className="text-zinc-400 font-black text-[10px] tracking-widest">OFFICIAL {type === 'قبض' ? 'RECEIPT' : 'PAYMENT'}</div>
             </div>
             <div className="flex flex-col items-end">
                <h1 className="text-2xl font-black text-primary">{settings?.companyName}</h1>
                <div className="text-zinc-400 text-[8px] font-black">{settings?.companyType}</div>
             </div>
          </div>

          <div className="flex-1 space-y-6 pt-4">
             <div className="flex items-baseline gap-4 border-b border-zinc-100 pb-2">
                <span className="text-primary font-black text-base whitespace-nowrap">{type === 'قبض' ? 'استلمنا من' : 'دفعنا إلى'}:</span>
                <span className="flex-1 text-xl font-black italic">{printingVoucher.partyName}</span>
             </div>
             <div className="flex items-baseline gap-4 border-b border-zinc-100 pb-2">
                <span className="text-primary font-black text-base whitespace-nowrap">مبلغاً وقدره:</span>
                <span className="flex-1 text-lg font-bold text-zinc-700">{tafqeet(displayAmount || 0, displayCurrencyName)}</span>
             </div>
             <div className="flex items-baseline gap-4 border-b border-zinc-100 pb-2">
                <span className="text-primary font-black text-base whitespace-nowrap">وذلك عن:</span>
                <span className="flex-1 text-lg font-bold text-zinc-600">{printingVoucher.statement}</span>
             </div>

             <div className="flex justify-center pt-4">
                <div className="bg-zinc-900 p-0.5 rounded-lg">
                   <div className="bg-white border-2 border-primary rounded px-12 py-2 flex flex-col items-center min-w-[240px]">
                      <span className="text-[9px] font-black text-primary mb-1 uppercase">Amount | المبلغ</span>
                      <span className="text-3xl font-black font-mono tracking-tighter">
                         {displayAmount?.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-bold mt-0.5">{displayCurrencySymbol}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="mt-8 flex justify-between px-6 pt-4 border-t border-zinc-50">
             <div className="flex flex-col items-center">
                <span className="text-zinc-400 font-bold text-[10px] mb-8 uppercase">{type === 'قبض' ? 'المسلم' : 'المستلم'}</span>
                <div className="w-32 border-b border-zinc-300"></div>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-zinc-400 font-bold text-[10px] mb-8 uppercase">المحاسب</span>
                <div className="w-32 border-b border-zinc-300 font-black text-center text-xs">{settings?.accountantName}</div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // نافذة تقرير العميل
  if (showCustomerReport) {
    const remaining = due - paid;
    return (
      <div className="space-y-6 animate-in fade-in" dir="rtl">
        <div className="flex items-center justify-between no-print bg-white p-6 rounded-3xl border shadow-xl">
           <div className="flex items-center gap-4">
              <button onClick={() => setShowCustomerReport(false)} className="p-3 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-all">
                <ArrowRight className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black">كشف سندات العميل المجمع</h2>
           </div>
           <button onClick={() => window.print()} className="bg-primary text-white px-10 py-3 rounded-2xl font-black shadow-xl flex items-center gap-2">
              <Printer className="w-5 h-5" /> طباعة التقرير
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print bg-zinc-50 p-6 rounded-3xl border">
           <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">اختيار العميل</label>
              <select value={reportParty} onChange={e => setReportParty(e.target.value)} className="bg-white p-3 rounded-2xl border font-bold outline-none">
                 <option value="">-- اختر من القائمة --</option>
                 {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
           </div>
           <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">من تاريخ</label>
              <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="bg-white p-3 rounded-2xl border font-bold outline-none" />
           </div>
           <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">إلى تاريخ</label>
              <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="bg-white p-3 rounded-2xl border font-bold outline-none" />
           </div>
           <div className="flex items-end">
              <div className="bg-primary/5 p-3 rounded-2xl border border-primary/20 w-full text-center flex flex-col">
                 <span className="text-[9px] font-black text-primary uppercase">رصيد الفترة المختار</span>
                 <span className="text-xl font-black text-primary font-mono">{paid.toLocaleString()}</span>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-3xl border overflow-hidden shadow-2xl">
           {/* ترويسة التقرير المطبوع */}
           <div className="print-only flex justify-between items-center bg-zinc-900 p-6 text-white mb-0">
             <div>
                <h1 className="text-2xl font-black">{settings?.companyName}</h1>
                <p className="text-xs">{settings?.address}</p>
             </div>
             <div className="text-center">
               <h2 className="text-2xl font-black">كشف سندات {type}</h2>
               <p className="text-sm mt-1">{reportParty || 'جميع الأطراف'}</p>
             </div>
             <div className="text-left text-xs font-bold">
               <p>{new Date().toLocaleDateString('ar-SA')}</p>
             </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                 <thead>
                    <tr className={`text-white font-black h-12 ${type === 'قبض' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                       <th className="p-4 border-l border-white/20 text-center w-16">#</th>
                       <th className="p-4 border-l border-white/20 w-32 text-center">التاريخ</th>
                       <th className="p-4 border-l border-white/20">البيان</th>
                       <th className="p-4 text-center w-40">المبلغ</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y font-bold">
                    {reportVouchers && reportVouchers.length === 0 ? (
                      <tr><td colSpan={4} className="p-20 text-center text-zinc-400 italic">لا توجد بيانات متاحة</td></tr>
                    ) : (
                      reportVouchers.map((v, idx) => {
                       const amount = v.receivedSYP || v.paidSYP || v.receivedUSD || v.paidUSD;
                       return (
                         <tr key={v.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="p-4 text-center font-mono text-zinc-400 border-l">{idx + 1}</td>
                            <td className="p-4 text-center font-mono border-l">{v.date}</td>
                            <td className="p-4 text-readable border-l">{v.statement}</td>
                            <td className="p-4 text-center font-mono text-xl">{amount.toLocaleString()}</td>
                         </tr>
                       )
                      })
                    )}
                 </tbody>
              </table>
           </div>

           <div className={`p-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-t-4 ${type === 'قبض' ? 'bg-emerald-50 border-emerald-600' : 'bg-rose-50 border-rose-600'}`}>
              <div className="flex flex-col items-center">
                 <span className="text-[10px] font-black text-zinc-500 uppercase mb-1">إجمالي المستحق</span>
                 <span className="text-3xl font-black font-mono">{due.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center border-x-2 border-zinc-200">
                 <span className="text-[10px] font-black text-zinc-500 uppercase mb-1">إجمالي ال{type}</span>
                 <span className={`text-3xl font-black font-mono ${type === 'قبض' ? 'text-emerald-700' : 'text-rose-700'}`}>{paid.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center">
                 <span className="text-[10px] font-black text-zinc-500 uppercase mb-1">المتبقي بذمته</span>
                 <span className="text-4xl font-black font-mono text-primary">{remaining.toLocaleString()}</span>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">سندات ال{type} المالي</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCustomerReport(true)} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-zinc-700 transition-all">
             <FileText className="w-5 h-5" /> تقرير العميل
          </button>
          <button onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 transition-all active:scale-95">
             <Plus className="w-5 h-5" /> سند {type} جديد
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-8 rounded-3xl border shadow-2xl space-y-8 animate-in zoom-in-95 no-print">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">الحساب (عميل/مورد)</label>
                 <select className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 font-bold outline-none" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})}>
                    <option value="">-- اختر الحساب --</option>
                    {parties.map(p => <option key={p.id} value={p.name}>{p.name} ({p.type})</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم السند</label>
                 <input type="text" className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 outline-none font-bold" value={formData.voucherNumber} onChange={e => setFormData({...formData, voucherNumber: e.target.value})} placeholder="تلقائي" />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">التاريخ</label>
                 <input type="date" className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 outline-none font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">العملة</label>
                 <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-2xl border border-zinc-200 h-[52px]">
                    <button onClick={() => setSelectedCurrencyType('primary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'primary' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500'}`}>{settings?.currencySymbol || 'أساسية'}</button>
                    <button onClick={() => setSelectedCurrencyType('secondary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'secondary' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>{settings?.secondaryCurrencySymbol || 'ثانوية'}</button>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1 md:col-span-3">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">البيان / تفاصيل السند</label>
                 <input type="text" className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 outline-none font-bold" value={formData.statement} onChange={e => setFormData({...formData, statement: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">المبلغ</label>
                 <input type="number" className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 outline-none font-black text-2xl text-primary text-center" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t">
              <button onClick={handleSave} className="bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 active:scale-95 flex items-center gap-2">
                <Save className="w-5 h-5" /> {editingId ? 'تحديث السند' : 'حفظ السند المالي'}
              </button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="bg-zinc-100 text-zinc-500 px-10 py-3 rounded-2xl font-bold">إلغاء</button>
           </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-3xl border flex items-center gap-4 no-print shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث في السجلات..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3 pr-12 outline-none font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border overflow-hidden shadow-2xl">
        <table className="w-full text-right border-collapse text-sm">
          <thead className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest h-12">
            <tr>
              <th className="p-4 border-l border-zinc-800 text-center">رقم</th>
              <th className="p-4 border-l border-zinc-800 text-center">التاريخ</th>
              <th className="p-4 border-l border-zinc-800">الحساب</th>
              <th className="p-4 border-l border-zinc-800">البيان</th>
              <th className="p-4 border-l border-zinc-800 text-center">المبلغ</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y font-bold">
            {currentFilteredList.length === 0 ? (
              <tr><td colSpan={6} className="p-20 text-center italic text-zinc-400">لا توجد سندات مسجلة حالياً</td></tr>
            ) : currentFilteredList.map(v => {
              const amount = v.receivedSYP || v.paidSYP || v.receivedUSD || v.paidUSD;
              const symbol = (v.receivedSYP || v.paidSYP) ? settings?.currencySymbol : settings?.secondaryCurrencySymbol;
              return (
                <tr key={v.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="p-4 text-center font-mono text-zinc-400 border-l">#{v.voucherNumber || v.id.slice(0, 4)}</td>
                  <td className="p-4 text-center font-mono text-zinc-400 border-l">{v.date}</td>
                  <td className="p-4 text-readable border-l">{v.partyName}</td>
                  <td className="p-4 text-zinc-500 font-normal border-l">{v.statement}</td>
                  <td className="p-4 text-center font-black text-lg border-l">
                    {amount.toLocaleString()} <span className="text-[10px] opacity-40">{symbol}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setPrintingVoucher(v)} className="p-2 text-zinc-400 hover:text-primary transition-all"><Printer className="w-4 h-4" /></button>
                      <button onClick={() => { setEditingId(v.id); setFormData({...v, amount: amount}); setIsAdding(true); }} className="p-2 text-zinc-400 hover:text-amber-500 transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VoucherListView;
