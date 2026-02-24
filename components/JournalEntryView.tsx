
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Plus, Trash2, Save, X, Search, 
  Calculator, MessageSquare, Calendar, Hash,
  ChevronDown, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { AccountNode, Party, AccountingCategory, CashEntry, AppSettings } from '../types';

interface JournalRow {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  notes: string;
}

interface JournalEntryViewProps {
  onBack: () => void;
}

const JournalEntryView: React.FC<JournalEntryViewProps> = ({ onBack }) => {
  const [rows, setRows] = useState<JournalRow[]>([
    { id: crypto.randomUUID(), accountId: '', accountName: '', debit: 0, credit: 0, notes: '' },
    { id: crypto.randomUUID(), accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }
  ]);
  
  const [voucherNumber, setVoucherNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mainDescription, setMainDescription] = useState('');
  
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const sAcc = localStorage.getItem('sheno_chart_accounts');
    const sPar = localStorage.getItem('sheno_parties');
    const sCat = localStorage.getItem('sheno_accounting_categories');
    const sSett = localStorage.getItem('sheno_settings');
    
    if (sAcc) setAccounts(JSON.parse(sAcc));
    if (sPar) setParties(JSON.parse(sPar));
    if (sCat) setCategories(JSON.parse(sCat));
    if (sSett) setSettings(JSON.parse(sSett));
    
    const sJou = localStorage.getItem('sheno_cash_journal');
    if (sJou) {
        const jou: CashEntry[] = JSON.parse(sJou);
        const lastNum = jou.filter(j => j.type === 'قيد').length;
        setVoucherNumber((lastNum + 1).toString());
    } else {
        setVoucherNumber('1');
    }
  }, []);

  const handleAddRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length > 2) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof JournalRow, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const totalDebit = rows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalCredit = rows.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  const diff = Number((totalDebit - totalCredit).toFixed(2));

  const handleSave = () => {
    if (diff !== 0) {
      alert('لا يمكن حفظ القيد لأن الجانب المدين لا يساوي الجانب الدائن (القيد غير متوازن)');
      return;
    }
    
    const validRows = rows.filter(r => r.accountName && (r.debit > 0 || r.credit > 0));
    if (validRows.length < 2) {
      alert('يجب إدخال حسابين على الأقل في القيد');
      return;
    }

    const savedJou = localStorage.getItem('sheno_cash_journal');
    let jou: CashEntry[] = savedJou ? JSON.parse(savedJou) : [];

    const newJournalEntries: CashEntry[] = validRows.map(r => ({
        id: crypto.randomUUID(),
        date,
        statement: r.notes || mainDescription || `قيد رقم ${voucherNumber}`,
        receivedSYP: r.credit, 
        paidSYP: r.debit,   
        receivedUSD: 0,
        paidUSD: 0,
        notes: mainDescription,
        type: 'قيد',
        voucherNumber,
        partyName: r.accountName
      }));

    localStorage.setItem('sheno_cash_journal', JSON.stringify([...newJournalEntries, ...jou]));
    alert('تم ترحيل سند القيد بنجاح. ستنعكس الأرصدة فوراً في دليل الحسابات.');
    onBack();
  };

  const allSearchableAccounts = [
    ...accounts.filter(a => a.type === 'ACCOUNT').map(a => ({ name: a.name, code: a.code, type: 'حساب عام' })),
    ...parties.map(p => ({ name: p.name, code: p.code, type: 'جهة (عميل/مورد)' })),
    ...categories.map(c => ({ name: c.name, code: c.accountCode || '---', type: 'بند مصروف/إيراد' }))
  ];

  const filteredResults = allSearchableAccounts.filter(a => 
    (a.name || '').toLowerCase().includes(accountSearch.toLowerCase()) || 
    (a.code || '').toLowerCase().includes(accountSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <style>{`
        @media print {
          .bg-zinc-900, .bg-zinc-800, .bg-zinc-950, .bg-zinc-50 {
            background-color: white !important;
            color: #0f172a !important;
            border: 1px solid #e2e8f0 !important;
          }
          .text-white {
            color: #0f172a !important;
          }
          .bg-emerald-900\\/20, .bg-rose-900\\/20, .bg-emerald-50\\/10, .bg-rose-50\\/10 {
            background-color: transparent !important;
          }
          table {
            background-color: white !important;
            border: 1px solid #e2e8f0 !important;
          }
          th, td {
            border: 1px solid #e2e8f0 !important;
          }
          th {
            background-color: #f8fafc !important;
            color: #0f172a !important;
          }
          .border-zinc-800, .border-zinc-700, .border-zinc-100 {
            border-color: #e2e8f0 !important;
          }
          .shadow-2xl, .shadow-xl, .shadow-lg {
            shadow: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all shadow-sm">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-readable">إدخال سند قيد يدوي</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">Manual Journal Entry | ترحيل تلقائي للدليل</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="bg-zinc-100 dark:bg-zinc-800 text-readable border border-zinc-200 dark:border-zinc-700 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2"><FileText className="w-5 h-5" /> معاينة الطباعة</button>
           <button onClick={handleSave} className="bg-primary text-white px-10 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all"><Save className="w-5 h-5" /> ترحيل القيد للدليل</button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
         <div className="p-8 bg-zinc-50 dark:bg-zinc-950 border-b dark:border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
            <div className="flex flex-col gap-1.5 relative z-10">
               <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1"><Hash className="w-3 h-3"/> رقم السند</label>
               <input type="text" value={voucherNumber} onChange={e => setVoucherNumber(e.target.value)} className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 p-3 rounded-2xl font-black text-center text-primary outline-none focus:border-primary transition-all" />
            </div>
            <div className="flex flex-col gap-1.5 relative z-10">
               <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1"><Calendar className="w-3 h-3"/> تاريخ القيد</label>
               <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 p-3 rounded-2xl font-mono text-readable outline-none focus:border-primary transition-all" />
            </div>
            <div className="md:col-span-2 flex flex-col gap-1.5 relative z-10">
               <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> البيان العام للسند</label>
               <input type="text" value={mainDescription} onChange={e => setMainDescription(e.target.value)} placeholder="وصف عام للعملية المالية..." className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 p-3 rounded-2xl font-black text-readable outline-none focus:border-primary transition-all" />
            </div>
         </div>

         <div className="flex-1 overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[800px]">
               <thead>
                  <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest h-14">
                     <th className="p-4 border-l border-zinc-800 w-16 text-center">#</th>
                     <th className="p-4 border-l border-zinc-800 text-center">الحساب المحاسبي (من الدليل)</th>
                     <th className="p-4 border-l border-zinc-800 text-center w-40 bg-emerald-900/20">مدين (+)</th>
                     <th className="p-4 border-l border-zinc-800 text-center w-40 bg-rose-900/20">دائن (-)</th>
                     <th className="p-4 border-l border-zinc-800">ملاحظات السطر</th>
                     <th className="p-4 text-center w-20">إجراء</th>
                  </tr>
               </thead>
               <tbody className="divide-y dark:divide-zinc-800 font-bold text-sm">
                  {rows.map((row, index) => (
                     <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors h-16 group">
                        <td className="p-4 text-center font-mono text-zinc-400 border-l dark:border-zinc-800">{index + 1}</td>
                        <td className="p-2 border-l dark:border-zinc-800 relative">
                           <div className={`w-full p-2.5 rounded-xl border-2 transition-all cursor-text flex items-center justify-between ${activeRowId === row.id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-700'}`} onClick={() => { setActiveRowId(row.id); setShowResults(true); setAccountSearch(row.accountName); }}>
                              <span className={row.accountName ? 'text-readable' : 'text-zinc-300 italic text-xs'}>{row.accountName || 'ابحث واضغط لاختيار الحساب...'}</span>
                              <ChevronDown className="w-4 h-4 text-zinc-300" />
                           </div>
                           {activeRowId === row.id && showResults && (
                             <div className="absolute top-full right-2 left-2 mt-1 bg-white dark:bg-zinc-950 border-2 border-primary rounded-2xl shadow-2xl z-[100] max-h-60 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                                <div className="p-2 bg-zinc-50 dark:bg-zinc-900 border-b dark:border-zinc-800">
                                   <div className="relative">
                                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                      <input type="text" autoFocus className="w-full bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl py-2 pr-10 pl-4 outline-none font-black text-xs text-readable" placeholder="اكتب اسم الحساب أو الكود..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} />
                                   </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                   {filteredResults.length === 0 ? (<div className="p-6 text-center text-zinc-400 text-xs italic">لا يوجد حساب مطابق</div>) : (
                                      filteredResults.map((acc, i) => (
                                         <div key={i} onClick={() => { updateRow(row.id, 'accountName', acc.name); setShowResults(false); setActiveRowId(null); }} className="p-3 border-b dark:border-zinc-800 hover:bg-primary/10 cursor-pointer flex justify-between items-center group transition-colors">
                                            <div className="flex flex-col text-right"><span className="font-black text-xs text-readable group-hover:text-primary">{acc.name}</span><span className="text-[9px] text-zinc-400 font-bold uppercase">{acc.type}</span></div>
                                            <span className="font-mono text-[10px] text-zinc-400 font-black">#{acc.code}</span>
                                         </div>
                                      ))
                                   )}
                                </div>
                             </div>
                           )}
                        </td>
                        <td className="p-2 border-l dark:border-zinc-800 bg-emerald-50/10 dark:bg-emerald-950/10"><input type="number" className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 text-center font-mono font-black text-lg text-emerald-600 outline-none p-2" value={row.debit || ''} onChange={e => updateRow(row.id, 'debit', Number(e.target.value))} onFocus={() => { if(row.credit > 0) updateRow(row.id, 'credit', 0); }} /></td>
                        <td className="p-2 border-l dark:border-zinc-800 bg-rose-50/10 dark:bg-rose-950/10"><input type="number" className="w-full bg-transparent border-b border-transparent focus:border-rose-500 text-center font-mono font-black text-lg text-rose-600 outline-none p-2" value={row.credit || ''} onChange={e => updateRow(row.id, 'credit', Number(e.target.value))} onFocus={() => { if(row.debit > 0) updateRow(row.id, 'debit', 0); }} /></td>
                        <td className="p-2 border-l dark:border-zinc-800"><input type="text" placeholder="بيان السطر..." className="w-full bg-transparent border-b border-transparent focus:border-zinc-400 text-readable outline-none p-2 font-normal italic text-xs" value={row.notes} onChange={e => updateRow(row.id, 'notes', e.target.value)} /></td>
                        <td className="p-2 text-center"><button onClick={() => handleRemoveRow(row.id)} className="p-2 text-zinc-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button></td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <div className="p-8 bg-zinc-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-t-4 border-primary">
            <div className="flex gap-10">
               <div className="flex flex-col items-center"><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">إجمالي المدين (+)</span><span className="text-3xl font-mono font-black text-emerald-400">{totalDebit.toLocaleString()}</span></div>
               <div className="flex flex-col items-center"><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">إجمالي الدائن (-)</span><span className="text-3xl font-mono font-black text-rose-400">{totalCredit.toLocaleString()}</span></div>
               <div className="w-px h-12 bg-zinc-800 hidden md:block"></div>
               <div className="flex flex-col items-center"><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">الفرق (التوازن)</span><div className="flex items-center gap-3"><span className={`text-4xl font-mono font-black ${diff === 0 ? 'text-blue-500' : 'text-rose-600 animate-pulse'}`}>{Math.abs(diff).toLocaleString()}</span>{diff === 0 ? (<CheckCircle2 className="w-8 h-8 text-emerald-500" />) : (<AlertCircle className="w-8 h-8 text-rose-600" />)}</div></div>
            </div>
            <div className="flex gap-3">
               <button onClick={handleAddRow} className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all border border-zinc-700"><Plus className="w-6 h-6" /> إضافة سطر جديد</button>
               <button onClick={handleSave} className={`px-16 py-4 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center gap-3 ${diff === 0 ? 'bg-primary hover:scale-105 active:scale-95' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'}`} disabled={diff !== 0}><Save className="w-7 h-7" /> ترحيل القيد ومزامنة الدليل</button>
            </div>
         </div>
      </div>
      <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-[2rem] flex items-center gap-4 text-readable no-print"><Calculator className="w-10 h-10 text-primary shrink-0" /><p className="text-sm font-bold leading-relaxed"><b>تنبيه محاسبي:</b> ترحيل القيد سيقوم بتحديث رصيد الحساب المختار فوراً في دليل الحسابات. يتم الربط بناءً على "اسم الحساب" لضمان التوافق.</p></div>
    </div>
  );
};

export default JournalEntryView;
