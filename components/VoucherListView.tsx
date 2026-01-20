
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Printer, Plus, Trash2, Edit2, Save, X, FileDown, Calendar as CalendarIcon, FileText, User, Coins, CreditCard, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';
import { CashEntry, Party, AppSettings, SalesInvoice, PurchaseInvoice } from '../types';
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
  
  // حالات تقرير العميل
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
    if (savedParties) setParties(JSON.parse(savedParties));
  };

  const calculateCustomerTotals = () => {
    if (!reportParty) return { due: 0, paid: 0, filteredVouchers: [] };
    
    let totalDue = 0;
    // حساب الديون (من فواتير المبيعات أو المشتريات)
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

    // فلترة السندات لهذا الطرف حسب التاريخ
    const filteredVouchersResult = vouchers.filter(v => {
      const matchParty = v.partyName === reportParty;
      const matchStart = !reportStart || v.date >= reportStart;
      const matchEnd = !reportEnd || v.date <= reportEnd;
      return matchParty && matchStart && matchEnd;
    });

    const totalPaid = filteredVouchersResult.reduce((acc, curr) => 
      acc + (curr.receivedSYP || curr.paidSYP || curr.receivedUSD || curr.paidUSD || 0), 0
    );

    return { due: totalDue, paid: totalPaid, filteredVouchers: filteredVouchersResult };
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

  // واجهة المعاينة للطباعة
  if (printingVoucher) {
    const isVoucherPrimary = (printingVoucher.receivedSYP || 0) > 0 || (printingVoucher.paidSYP || 0) > 0;
    const displayAmount = isVoucherPrimary ? (printingVoucher.receivedSYP || printingVoucher.paidSYP) : (printingVoucher.receivedUSD || printingVoucher.paidUSD);
    const displayCurrencySymbol = isVoucherPrimary ? (settings?.currencySymbol || 'ل.س') : (settings?.secondaryCurrencySymbol || '$');
    const displayCurrencyName = isVoucherPrimary ? (settings?.currency || 'ليرة سورية') : (settings?.secondaryCurrency || 'دولار');

    return (
      <div className="min-h-screen bg-zinc-100 p-4 md:p-10 animate-in fade-in" dir="rtl">
        <div className="max-w-4xl mx-auto mb-6 no-print flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
           <button onClick={() => setPrintingVoucher(null)} className="flex items-center gap-2 text-zinc-500 font-black hover:text-rose-900 transition-colors">
             <ArrowRight className="w-5 h-5" /> العودة للقائمة
           </button>
           <button onClick={() => window.print()} className="bg-rose-900 text-white px-10 py-3 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
             <Printer className="w-5 h-5" /> طباعة السند (نصف A4)
           </button>
        </div>
        <div className="max-w-[210mm] mx-auto bg-white text-zinc-900 p-8 rounded-xl shadow-2xl border-2 border-zinc-100 flex flex-col relative print:shadow-none print:border print:border-zinc-200" style={{ minHeight: '148mm' }}>
          <div className="flex justify-between items-start mb-6 border-b-4 border-rose-900 pb-4">
             <div className="flex flex-col gap-1">
                <div className="bg-zinc-900 text-white px-3 py-1 rounded font-mono text-lg font-black">NO: {printingVoucher.voucherNumber || printingVoucher.id.slice(0, 8).toUpperCase()}</div>
                <div className="text-zinc-500 font-bold text-xs">التاريخ: {printingVoucher.date}</div>
             </div>
             <div className="text-center">
                <div className="text-3xl font-black text-rose-900">سند {type} مالي</div>
                <div className="text-zinc-400 font-black text-[10px] tracking-widest uppercase">OFFICIAL {type === 'قبض' ? 'RECEIPT' : 'PAYMENT'}</div>
             </div>
             <div className="flex flex-col items-end">
                <h1 className="text-2xl font-black text-rose-900">{settings?.companyName}</h1>
                <div className="text-zinc-400 text-[8px] font-black">{settings?.companyType}</div>
             </div>
          </div>
          <div className="flex-1 space-y-6 pt-4">
             <div className="flex items-baseline gap-4 border-b border-zinc-100 pb-2">
                <span className="text-rose-900 font-black text-base whitespace-nowrap">{type === 'قبض' ? 'استلمنا من' : 'دفعنا إلى'}:</span>
                <span className="flex-1 text-xl font-black italic">{printingVoucher.partyName}</span>
             </div>
             <div className="flex items-baseline gap-4 border-b border-zinc-100 pb-2">
                <span className="text-rose-900 font-black text-base whitespace-nowrap">مبلغاً وقدره:</span>
                <span className="flex-1 text-lg font-bold text-zinc-700">{tafqeet(displayAmount || 0, displayCurrencyName)}</span>
             </div>
             <div className="flex items-baseline gap-4 border-b border-zinc-100 pb-2">
                <span className="text-rose-900 font-black text-base whitespace-nowrap">وذلك عن:</span>
                <span className="flex-1 text-lg font-bold text-zinc-600">{printingVoucher.statement}</span>
             </div>
             <div className="flex justify-center pt-4">
                <div className="bg-zinc-900 p-0.5 rounded-lg">
                   <div className="bg-white border-2 border-rose-900 rounded px-12 py-2 flex flex-col items-center min-w-[240px]">
                      <span className="text-[9px] font-black text-rose-900 mb-1 uppercase">Amount | المبلغ</span>
                      <span className="text-3xl font-black font-mono tracking-tighter">{displayAmount?.toLocaleString()}</span>
                      <span className="text-[9px] text-zinc-400 font-bold mt-0.5">{displayCurrencySymbol}</span>
                   </div>
                </div>
             </div>
          </div>
          <div className="mt-8 flex justify-between px-6 pt-4 border-t border-zinc-50">
             <div className="flex flex-col items-center"><span className="text-zinc-400 font-bold text-[10px] mb-8 uppercase">{type === 'قبض' ? 'المسلم' : 'المستلم'}</span><div className="w-32 border-b border-zinc-300"></div></div>
             <div className="flex flex-col items-center"><span className="text-zinc-400 font-bold text-[10px] mb-8 uppercase">المحاسب</span><div className="w-32 border-b border-zinc-300 font-black text-center text-xs">{settings?.accountantName}</div></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* نافذة تقرير العميل المنبثقة */}
      {showCustomerReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="bg-zinc-900 w-full max-w-5xl rounded-[2.5rem] border border-rose-900/30 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-rose-900 p-6 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-2 rounded-xl"><FileText className="text-white w-6 h-6" /></div>
                    <h3 className="text-xl font-black text-white">تقرير مالي تفصيلي للطرف: {reportParty || '...'}</h3>
                 </div>
                 <button onClick={() => setShowCustomerReport(false)} className="text-white/60 hover:text-white transition-colors bg-white/10 p-2 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
                    <div className="flex flex-col gap-1 md:col-span-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">اختيار الطرف</label>
                       <select 
                         value={reportParty} 
                         onChange={e => setReportParty(e.target.value)}
                         className="bg-zinc-800 border-2 border-zinc-700 text-white p-3 rounded-2xl font-bold outline-none focus:border-rose-900"
                       >
                          <option value="">-- اختر الطرف --</option>
                          {parties.map(p => <option key={p.id} value={p.name}>{p.name} ({p.type})</option>)}
                       </select>
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">من تاريخ</label>
                       <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="bg-zinc-800 border-2 border-zinc-700 text-white p-3 rounded-2xl font-mono text-sm outline-none" />
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">إلى تاريخ</label>
                       <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="bg-zinc-800 border-2 border-zinc-700 text-white p-3 rounded-2xl font-mono text-sm outline-none" />
                    </div>
                 </div>

                 {reportParty && (
                    <>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-zinc-800/50 p-6 rounded-3xl border border-zinc-700 flex flex-col items-center gap-2">
                             <span className="text-[10px] font-black text-zinc-500 uppercase">إجمالي المسحوبات (الديون)</span>
                             <span className="text-3xl font-mono font-black text-white">{due.toLocaleString()}</span>
                          </div>
                          <div className="bg-zinc-800/50 p-6 rounded-3xl border border-zinc-700 flex flex-col items-center gap-2">
                             <span className="text-[10px] font-black text-emerald-500 uppercase">إجمالي المدفوعات (الواصل)</span>
                             <span className="text-3xl font-mono font-black text-emerald-500">{paid.toLocaleString()}</span>
                          </div>
                          <div className="bg-rose-900/10 p-6 rounded-3xl border border-rose-900/20 flex flex-col items-center gap-2">
                             <span className="text-[10px] font-black text-rose-500 uppercase">الرصيد المتبقي (الذمة)</span>
                             <span className="text-4xl font-mono font-black text-rose-500">{(due - paid).toLocaleString()}</span>
                          </div>
                       </div>

                       <div className="border border-zinc-800 rounded-3xl overflow-hidden shadow-inner">
                          <table className="w-full text-right border-collapse">
                             <thead>
                                <tr className="bg-zinc-800 text-zinc-400 font-black text-[10px] uppercase">
                                   <th className="p-4 border-l border-zinc-700">التاريخ</th>
                                   <th className="p-4 border-l border-zinc-700">رقم السند</th>
                                   <th className="p-4 border-l border-zinc-700">البيان</th>
                                   <th className="p-4 text-center">القيمة</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-zinc-800">
                                {reportVouchers.length === 0 ? (
                                   <tr><td colSpan={4} className="p-8 text-center italic text-zinc-600">لا توجد حركات مالية مسجلة لهذا الطرف</td></tr>
                                ) : reportVouchers.map(v => (
                                   <tr key={v.id} className="hover:bg-zinc-800/50 text-sm font-bold text-zinc-300">
                                      <td className="p-4 border-l border-zinc-800 font-mono text-xs">{v.date}</td>
                                      <td className="p-4 border-l border-zinc-800">#{v.voucherNumber || '---'}</td>
                                      <td className="p-4 border-l border-zinc-800">{v.statement}</td>
                                      <td className="p-4 text-center font-mono text-emerald-500">{(v.receivedSYP || v.paidSYP || v.receivedUSD || v.paidUSD).toLocaleString()}</td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </>
                 )}
              </div>
              
              <div className="bg-zinc-950 p-6 border-t border-zinc-800 flex justify-end gap-3 shrink-0">
                 <button onClick={() => window.print()} className="bg-rose-900 text-white px-10 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg"><Printer className="w-5 h-5" /> طباعة التقرير</button>
                 <button onClick={() => setShowCustomerReport(false)} className="bg-zinc-800 text-zinc-400 px-8 py-3 rounded-2xl font-bold">إغلاق</button>
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
        {settings?.companyName} Secure Ledger System v3.0
      </div>
    </div>
  );
};

export default VoucherListView;
