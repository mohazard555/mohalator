
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Plus, Trash2, Edit2, Save, X, FileDown, FileText, Search, Calendar, User, Coins, CreditCard } from 'lucide-react';
import { CashEntry, Party, AppSettings, SalesInvoice, PurchaseInvoice, PartyType } from '../types';
import { tafqeet } from '../utils/tafqeet';

// تعريف html2pdf كمتغير عالمي لتجنب أخطاء TypeScript
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
          const matchStart = !reportStart || v.date >= reportStart;
          const matchEnd = !reportEnd || v.date <= reportEnd;
          return matchParty && matchStart && matchEnd;
       });
    }

    const totalPaid = allFilteredVouchers.reduce((acc, curr) => {
       return acc + (curr.receivedSYP || curr.paidSYP || curr.receivedUSD || curr.paidUSD || 0);
    }, 0);

    return { due: totalDue, paid: totalPaid, filteredVouchers: allFilteredVouchers };
  };

  const handleExportReportPDF = () => {
    if (!reportRef.current || !reportParty) return;

    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `كشف_حساب_${reportParty}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: false, 
        backgroundColor: '#ffffff'
      },
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
      <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-4 animate-in fade-in" dir="rtl">
        <style>{`
          @media print {
            @page { size: 148mm 105mm; margin: 0; }
            body { margin: 0; padding: 0; background: white; }
            .no-print { display: none !important; }
            .print-area { width: 148mm !important; height: 105mm !important; padding: 5mm !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
          }
        `}</style>
        <div className="max-w-xl w-full mb-6 no-print flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border text-readable">
           <button onClick={() => setPrintingVoucher(null)} className="flex items-center gap-2 text-zinc-500 font-black hover:text-rose-900 transition-colors"><ArrowRight className="w-5 h-5" /> العودة</button>
           <button onClick={() => window.print()} className="bg-rose-900 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2"> <Printer className="w-5 h-5" /> طباعة</button>
        </div>
        <div className="print-area bg-white text-zinc-900 border-2 border-zinc-200 shadow-2xl flex flex-col relative overflow-hidden" style={{ width: '148mm', height: '105mm', padding: '8mm' }}>
          <div className="flex justify-between items-start border-b-2 border-rose-900 pb-2">
             <div>
                <div className="text-rose-900 font-black text-sm uppercase">سند {type} مالي</div>
                <div className="bg-zinc-900 text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold w-fit">NO: {printingVoucher.voucherNumber || printingVoucher.id.slice(0, 6).toUpperCase()}</div>
             </div>
             <div className="flex flex-col items-center">
                {settings?.logoUrl && <img src={settings.logoUrl} className="h-10 w-auto object-contain mb-1" />}
                <div className="text-zinc-400 font-black text-[7px] tracking-widest uppercase">{settings?.companyType}</div>
             </div>
             <div className="text-left flex flex-col items-end">
                <h1 className="text-sm font-black text-rose-900 leading-tight">{settings?.companyName}</h1>
                <div className="text-zinc-400 text-[8px] font-bold mt-1" dir="ltr">{settings?.phone}</div>
             </div>
          </div>
          <div className="flex-1 pt-4 space-y-3">
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
             <div className="flex justify-center pt-2">
                <div className="bg-white border border-rose-900 rounded-md px-6 py-1 flex items-center gap-4">
                   <div className="flex flex-col items-center">
                      <span className="text-[7px] font-black text-rose-900 leading-none">AMOUNT | المبلغ</span>
                      <div className="text-xl font-black font-mono mt-1 tracking-tighter">{displayAmount?.toLocaleString()}</div>
                   </div>
                   <span className="text-[10px] font-black text-zinc-400">{displayCurrencySymbol}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* نافذة كشف حساب العميل */}
      {showCustomerReport && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-2 md:p-8 overflow-y-auto animate-in fade-in">
           
           <div className="w-full max-w-5xl mb-4 flex flex-wrap justify-between items-end gap-4 bg-zinc-800 p-6 rounded-3xl border border-zinc-700 shadow-xl no-print">
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
                 <button onClick={handleExportReportPDF} className="bg-zinc-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-zinc-600 transition-all border border-zinc-500 shadow-lg">
                   <FileDown className="w-5 h-5" /> تصدير PDF
                 </button>
                 <button onClick={() => window.print()} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-rose-500 transition-all shadow-lg">
                   <Printer className="w-5 h-5" /> طباعة الكشف
                 </button>
                 <button onClick={() => setShowCustomerReport(false)} className="bg-zinc-900 text-zinc-400 px-6 py-3 rounded-xl font-bold hover:text-white transition-all">إغلاق العرض</button>
              </div>
           </div>

           <div ref={reportRef} className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-900 border border-zinc-200 print:shadow-none print:border-none print:m-0 print:rounded-none">
              
              <div className="p-8 flex justify-between items-start border-b-2 border-rose-600">
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                       {settings?.logoUrl && <img src={settings.logoUrl} className="w-12 h-12 object-contain" alt="Logo" />}
                       <h1 className="text-2xl font-black tracking-tighter text-zinc-800 uppercase leading-none">{settings?.companyName || 'XO COMPANY'}</h1>
                    </div>
                    <div className="text-[9px] font-black text-rose-600 mt-3 uppercase tracking-widest leading-none">المحاسبة والمالية</div>
                    <div className="text-[10px] font-bold text-zinc-500 leading-none">{settings?.address || 'دمشق، سوريا'}</div>
                    <div className="text-[10px] font-mono font-bold text-zinc-400 leading-none">{new Date().toLocaleDateString('ar-SA')}</div>
                 </div>

                 <div className="text-center flex-1 pt-4">
                    <h2 className="text-3xl font-black underline decoration-rose-600 decoration-2 underline-offset-8">تقرير كشف حساب زبون</h2>
                    <p className="text-[10px] font-bold text-zinc-400 mt-6 tracking-widest leading-none">الفترة: {reportStart || 'البداية'} - {reportEnd || 'اليوم'}</p>
                    <p className="text-xl font-black text-rose-600 mt-1 uppercase leading-none">{reportParty || '...لم يتم اختيار اسم...'}</p>
                 </div>
              </div>

              <div className="mx-8 h-1 bg-rose-600 rounded-full mt-2 opacity-80"></div>

              <div className="px-8 py-8 space-y-8">
                 <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white border-t-4 border-zinc-800 p-6 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm border border-zinc-100">
                       <span className="text-[10px] font-black text-zinc-400 uppercase text-center leading-tight">إجمالي المسحوبات<br/>(الديون)</span>
                       <span className="text-3xl font-mono font-black text-zinc-800 leading-none mt-2">{due.toLocaleString()}</span>
                    </div>
                    <div className="bg-white border-t-4 border-emerald-500 p-6 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm border border-zinc-100">
                       <span className="text-[10px] font-black text-emerald-600 uppercase text-center leading-tight">إجمالي المدفوعات<br/>(الواصل)</span>
                       <span className="text-3xl font-mono font-black text-emerald-500 leading-none mt-2">{paid.toLocaleString()}</span>
                    </div>
                    <div className="bg-white border-t-4 border-rose-600 p-6 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg border border-zinc-100">
                       <span className="text-[10px] font-black text-rose-500 uppercase text-center leading-tight">الرصيد المتبقي<br/>(الذمة)</span>
                       <span className="text-4xl font-mono font-black text-rose-600 leading-none mt-2">{(due - paid).toLocaleString()}-</span>
                    </div>
                 </div>

                 <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                    <table className="w-full text-right border-collapse">
                       <thead>
                          <tr className="bg-zinc-50 text-zinc-400 font-black text-[9px] uppercase tracking-widest h-10 border-b">
                             <th className="p-3 w-28 text-center border-l">التاريخ</th>
                             <th className="p-3 w-28 text-center border-l">رقم السند</th>
                             <th className="p-3 border-l">البيان / الوصف</th>
                             <th className="p-3 text-center w-36">القيمة</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-100 font-bold text-xs text-readable">
                          {reportVouchers.length === 0 ? (
                             <tr><td colSpan={4} className="p-16 text-center text-zinc-300 italic font-black">لا توجد حركات مالية مسجلة في هذه الفترة</td></tr>
                          ) : reportVouchers.map(v => (
                             <tr key={v.id} className="h-10">
                                <td className="p-3 text-center font-mono text-zinc-400 text-[10px] border-l">{v.date}</td>
                                <td className="p-3 text-center font-black text-zinc-800 border-l">#{v.voucherNumber || '---'}</td>
                                <td className="p-3 text-zinc-600 border-l">{v.statement}</td>
                                <td className="p-3 text-center font-mono font-black text-lg text-emerald-600">{(v.receivedSYP || v.paidSYP || v.receivedUSD || v.paidUSD).toLocaleString()}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              <div className="p-8 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center mt-auto">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-400 tracking-[0.2em] uppercase leading-none">Accounting Ledger System</span>
                    <span className="text-[10px] font-black text-rose-600 italic leading-none mt-1">SAMLATOR2026 Secured Terminal</span>
                 </div>
                 <div className="text-[10px] font-black text-zinc-400 italic">توقيع المحاسب المعتمد: ...............................</div>
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
