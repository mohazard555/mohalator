
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Printer, Plus, Trash2, Edit2, Save, X, FileDown, CheckCircle, Calendar as CalendarIcon, Coins, CreditCard } from 'lucide-react';
import { CashEntry, Party, AppSettings } from '../types';
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
  
  const [formData, setFormData] = useState<Partial<CashEntry>>({
    voucherNumber: '',
    date: new Date().toISOString().split('T')[0],
    statement: '',
    partyName: '',
    amount: 0,
    amountLiteral: '',
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
    
    if (window.confirm('تم حفظ السند بنجاح. هل ترغب بطباعة القسيمة الآن؟')) {
      setPrintingVoucher(entry);
    }
    
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

  const filteredVouchers = vouchers.filter(v => 
    v.partyName?.includes(searchTerm) || v.statement?.includes(searchTerm) || v.voucherNumber?.includes(searchTerm)
  );

  if (printingVoucher) {
    const isVoucherPrimary = printingVoucher.receivedSYP > 0 || printingVoucher.paidSYP > 0;
    const displayAmount = isVoucherPrimary ? (printingVoucher.receivedSYP || printingVoucher.paidSYP) : (printingVoucher.receivedUSD || printingVoucher.paidUSD);
    const displayCurrencySymbol = isVoucherPrimary ? (settings?.currencySymbol || 'ل.س') : (settings?.secondaryCurrencySymbol || '$');
    const displayCurrencyName = isVoucherPrimary ? (settings?.currency || 'ليرة سورية') : (settings?.secondaryCurrency || 'دولار');

    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 p-10 animate-in fade-in duration-500" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-6 no-print">
           <div className="flex justify-between items-center">
             <button onClick={() => setPrintingVoucher(null)} className="flex items-center gap-2 text-zinc-500 font-bold hover:text-primary transition-colors">
               <ArrowRight className="w-5 h-5" /> العودة للقائمة
             </button>
             <button onClick={() => window.print()} className="bg-primary text-white px-10 py-3 rounded-2xl font-black shadow-xl flex items-center gap-2">
               <Printer className="w-5 h-5" /> طباعة القسيمة الاحترافية
             </button>
           </div>
        </div>

        <div className="max-w-[210mm] mx-auto bg-white text-zinc-900 p-12 rounded-3xl shadow-2xl border-2 border-zinc-100 min-h-[140mm] flex flex-col relative mt-10 print:mt-0 print:shadow-none print:border-none">
          {/* Header */}
          <div className="flex justify-between items-start mb-12 border-b-4 border-primary pb-8">
             <div className="flex flex-col gap-2">
                <div className="bg-zinc-900 text-white px-4 py-2 rounded-lg font-mono text-xl font-black shadow-lg">
                  NO: {printingVoucher.voucherNumber || printingVoucher.id.slice(0, 8).toUpperCase()}
                </div>
                <div className="flex items-center gap-2 text-zinc-500 font-bold">
                   <CalendarIcon className="w-4 h-4" />
                   <span>التاريخ:</span>
                   <span className="font-mono">{printingVoucher.date}</span>
                </div>
             </div>
             <div className="flex flex-col items-center">
                <div className="text-4xl font-black text-primary mb-1">سند {type} مالي</div>
                <div className="text-zinc-400 font-bold tracking-[0.3em] text-[10px] uppercase">OFFICIAL {type === 'قبض' ? 'RECEIPT' : 'PAYMENT'} VOUCHER</div>
             </div>
             <div className="flex flex-col items-end">
                <div className="flex items-center gap-3">
                   <div className="text-right">
                      <h1 className="text-3xl font-black text-primary leading-none mb-1">{settings?.companyName || 'SHENO'}</h1>
                      <div className="text-zinc-500 text-[8px] tracking-[0.2em] font-black text-left">{settings?.companyType || 'ACCOUNTING SYSTEM'}</div>
                   </div>
                   {settings?.logoUrl ? (
                     <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                   ) : (
                     <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
                        <CheckCircle className="text-white w-8 h-8" />
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-10 py-4">
             <div className="flex items-baseline gap-4 border-b border-zinc-200 pb-2">
                <span className="text-primary font-black text-lg whitespace-nowrap">{type === 'قبض' ? 'استلمنا من' : 'دفعنا إلى'} السيد/ة:</span>
                <span className="flex-1 text-2xl font-black border-zinc-300 px-2 italic">
                   {printingVoucher.partyName}
                </span>
             </div>

             <div className="flex items-baseline gap-4 border-b border-zinc-200 pb-2">
                <span className="text-primary font-black text-lg whitespace-nowrap">مبلغاً وقدره:</span>
                <span className="flex-1 text-2xl font-black border-zinc-300 px-2 text-primary">
                   {tafqeet(displayAmount || 0, displayCurrencyName)}
                </span>
             </div>

             <div className="flex items-baseline gap-4 border-b border-zinc-200 pb-2">
                <span className="text-primary font-black text-lg whitespace-nowrap">وذلك عن:</span>
                <span className="flex-1 text-xl font-bold border-zinc-300 px-2">
                   {printingVoucher.statement || '................................................................................'}
                </span>
             </div>

             <div className="flex justify-center mt-8">
                <div className="bg-zinc-900 p-1 rounded-2xl shadow-2xl">
                   <div className="bg-white border-4 border-primary rounded-xl px-12 py-4 flex flex-col items-center min-w-[300px]">
                      <span className="text-[10px] font-black text-primary mb-1 uppercase">Amount | المبلغ</span>
                      <span className="text-4xl font-black font-mono tracking-tighter">
                         {displayAmount?.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold mt-1 uppercase">{displayCurrencySymbol} | {displayCurrencyName}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Footer */}
          <div className="mt-16 flex justify-between px-10 pt-8">
             <div className="flex flex-col items-center">
                <span className="text-zinc-400 font-bold text-[10px] mb-12 uppercase">{type === 'قبض' ? 'المسلم' : 'المستلم'} | PARTY</span>
                <div className="w-40 border-b-2 border-zinc-200"></div>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-zinc-400 font-bold text-[10px] mb-12 uppercase">المحاسب المعتمد | ACCOUNTANT</span>
                <div className="flex flex-col items-center gap-1">
                   <div className="w-40 border-b-2 border-zinc-200 font-black text-center text-zinc-900">{settings?.accountantName || 'المحاسب الرئيسي'}</div>
                </div>
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
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">سندات ال{type} المالي</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:brightness-110 active:scale-95">
             <Plus className="w-5 h-5" /> إضافة سند {type}
          </button>
          <button onClick={() => exportToCSV(vouchers, `vouchers_${type}`)} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 hover:bg-zinc-700 transition-all">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95 no-print">
           <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-black text-primary">إدخال بيانات السند المالي</h3>
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl border">
                 <button 
                   onClick={() => setSelectedCurrencyType('primary')}
                   className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'primary' ? 'bg-primary text-white shadow-md' : 'text-zinc-400'}`}
                 >
                   {settings?.currencySymbol || 'أساسية'}
                 </button>
                 <button 
                   onClick={() => setSelectedCurrencyType('secondary')}
                   className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'secondary' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-400'}`}
                 >
                   {settings?.secondaryCurrencySymbol || 'ثانوية'}
                 </button>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم السند المرجعي</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.voucherNumber} onChange={e => setFormData({...formData, voucherNumber: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">تاريخ السند</label>
                 <input type="date" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">الطرف (العملاء / الموردين)</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})}>
                    <option value="">-- اختر الطرف --</option>
                    {parties.map(p => <option key={p.id} value={p.name}>{p.name} ({p.type})</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">قيمة السند ({selectedCurrencyType === 'primary' ? settings?.currencySymbol : settings?.secondaryCurrencySymbol})</label>
                 <input type="number" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-black text-xl text-primary outline-none" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              </div>
              <div className="flex flex-col gap-1 md:col-span-3">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">البيان / ملاحظات إضافية</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.statement} onChange={e => setFormData({...formData, statement: e.target.value})} />
              </div>
           </div>
           <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={handleSave} className="bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                 <Save className="w-5 h-5" /> {editingId ? 'تحديث السند' : 'حفظ وإصدار السند'}
              </button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-8 py-3 rounded-2xl font-bold">إلغاء</button>
           </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 no-print shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder={`البحث في سندات ال${type} بالاسم أو رقم السند...`}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-2.5 pr-12 pl-4 outline-none focus:ring-2 focus:ring-primary transition-all text-readable font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                <th className="p-4">رقم السند</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">الطرف</th>
                <th className="p-4 text-center">المبلغ</th>
                <th className="p-4 text-center">العملة</th>
                <th className="p-4">البيان</th>
                <th className="p-4 text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-zinc-400 font-bold italic">لا توجد سندات مسجلة حالياً.</td>
                </tr>
              ) : (
                filteredVouchers.map(v => {
                   const isPrimary = (v.receivedSYP || 0) > 0 || (v.paidSYP || 0) > 0;
                   const amountValue = isPrimary ? (v.receivedSYP || v.paidSYP) : (v.receivedUSD || v.paidUSD);
                   return (
                    <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                      <td className="p-4 font-mono text-primary">#{v.voucherNumber || v.id.slice(0, 4)}</td>
                      <td className="p-4 font-mono text-zinc-400">{v.date}</td>
                      <td className="p-4 text-readable">{v.partyName}</td>
                      <td className={`p-4 text-center font-mono text-lg ${isPrimary ? 'text-emerald-600' : 'text-amber-600'}`}>{amountValue?.toLocaleString()}</td>
                      <td className="p-4 text-center">
                         <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isPrimary ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {isPrimary ? settings?.currencySymbol : settings?.secondaryCurrencySymbol}
                         </span>
                      </td>
                      <td className="p-4 text-zinc-500 font-normal">{v.statement}</td>
                      <td className="p-4 no-print">
                         <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setPrintingVoucher(v)} className="p-2 text-zinc-400 hover:text-emerald-500 transition-all" title="طباعة القسيمة"><Printer className="w-4 h-4" /></button>
                            <button onClick={() => { setEditingId(v.id); setFormData({...v, amount: amountValue}); setIsAdding(true); setSelectedCurrencyType(isPrimary ? 'primary' : 'secondary'); }} className="p-2 text-zinc-400 hover:text-primary transition-all" title="تعديل"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(v.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-all" title="حذف"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </td>
                    </tr>
                   );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VoucherListView;
