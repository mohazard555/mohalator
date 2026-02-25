
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Plus, Trash2, Save, X, Search, 
  Calculator, MessageSquare, Calendar, Hash,
  ChevronDown, CheckCircle2, AlertCircle, FileText,
  Printer, Eye, Edit2
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

type ViewMode = 'ENTRY' | 'ARCHIVE';

const JournalEntryView: React.FC<JournalEntryViewProps> = ({ onBack }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('ENTRY');
  const [archiveEntries, setArchiveEntries] = useState<CashEntry[]>([]);
  const [editingVoucherNumber, setEditingVoucherNumber] = useState<string | null>(null);

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

  const getPrefix = () => {
    const activeId = localStorage.getItem('sheno_active_company_id') || 'default';
    return activeId === 'default' ? 'sheno' : `sheno_${activeId}`;
  };

  const loadData = () => {
    const prefix = getPrefix();
    const sAcc = localStorage.getItem(`${prefix}_chart_accounts`);
    const sPar = localStorage.getItem(`${prefix}_parties`);
    const sCat = localStorage.getItem(`${prefix}_accounting_categories`);
    const sSett = localStorage.getItem(`${prefix}_settings`);
    const sJou = localStorage.getItem(`${prefix}_cash_journal`);
    
    if (sAcc) setAccounts(JSON.parse(sAcc));
    if (sPar) setParties(JSON.parse(sPar));
    if (sCat) setCategories(JSON.parse(sCat));
    if (sSett) setSettings(JSON.parse(sSett));
    
    if (sJou) {
        const jou: CashEntry[] = JSON.parse(sJou);
        setArchiveEntries(jou.filter(j => j.type === 'قيد'));
        if (viewMode === 'ENTRY' && !editingVoucherNumber) {
           const lastNum = jou.filter(j => j.type === 'قيد').length;
           setVoucherNumber((lastNum + 1).toString());
        }
    } else {
        if (!editingVoucherNumber) setVoucherNumber('1');
    }
  };

  useEffect(() => {
    loadData();
  }, [viewMode]);

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

    const prefix = getPrefix();
    const savedJou = localStorage.getItem(`${prefix}_cash_journal`);
    let jou: CashEntry[] = savedJou ? JSON.parse(savedJou) : [];

    // If editing, remove old lines
    if (editingVoucherNumber) {
       jou = jou.filter(j => j.voucherNumber !== editingVoucherNumber || j.type !== 'قيد');
    }

    const newJournalEntries: CashEntry[] = validRows.map(r => {
        const acc = accounts.find(a => a.name === r.accountName);
        const party = parties.find(p => p.name === r.accountName);
        const cat = categories.find(c => c.name === r.accountName);

        return {
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
            partyName: r.accountName,
            linkedAccountId: acc?.id || party?.id || cat?.id,
            linkedAccountCode: acc?.code || party?.code || cat?.accountCode
        };
    });

    localStorage.setItem(`${prefix}_cash_journal`, JSON.stringify([...newJournalEntries, ...jou]));
    alert('تم ترحيل سند القيد بنجاح.');
    setEditingVoucherNumber(null);
    resetForm();
    setViewMode('ARCHIVE');
  };

  const resetForm = () => {
    setRows([
      { id: crypto.randomUUID(), accountId: '', accountName: '', debit: 0, credit: 0, notes: '' },
      { id: crypto.randomUUID(), accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }
    ]);
    setMainDescription('');
    setEditingVoucherNumber(null);
    loadData();
  };

  const handleEditArchive = (vNum: string) => {
    const entries = archiveEntries.filter(e => e.voucherNumber === vNum);
    if (entries.length > 0) {
      const newRows: JournalRow[] = entries.map(e => ({
        id: crypto.randomUUID(),
        accountId: e.linkedAccountId || '',
        accountName: e.partyName || '',
        debit: e.paidSYP,
        credit: e.receivedSYP,
        notes: e.statement === e.notes ? '' : e.statement
      }));
      setRows(newRows);
      setVoucherNumber(vNum);
      setDate(entries[0].date);
      setMainDescription(entries[0].notes || '');
      setEditingVoucherNumber(vNum);
      setViewMode('ENTRY');
    }
  };

  const handleDeleteArchive = (vNum: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السند بالكامل؟')) return;
    const prefix = getPrefix();
    const savedJou = localStorage.getItem(`${prefix}_cash_journal`);
    if (savedJou) {
      const jou: CashEntry[] = JSON.parse(savedJou);
      const updated = jou.filter(j => j.voucherNumber !== vNum || j.type !== 'قيد');
      localStorage.setItem(`${prefix}_cash_journal`, JSON.stringify(updated));
      loadData();
    }
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

  const [printingVoucher, setPrintingVoucher] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .bg-zinc-900, .bg-zinc-800, .bg-zinc-950, .bg-zinc-50, .bg-primary {
            background-color: white !important;
            color: #0f172a !important;
            border: 1px solid #e2e8f0 !important;
          }
          .text-white, .text-primary, .text-emerald-400, .text-rose-400, .text-blue-500 {
            color: #0f172a !important;
          }
          .bg-emerald-900\\/20, .bg-rose-900\\/20, .bg-emerald-50\\/10, .bg-rose-50\\/10, .bg-zinc-900 {
            background-color: transparent !important;
            color: #0f172a !important;
          }
          table {
            background-color: white !important;
            border: 1px solid #e2e8f0 !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #e2e8f0 !important;
            color: #0f172a !important;
            padding: 8px !important;
          }
          th {
            background-color: #f8fafc !important;
            color: #0f172a !important;
          }
          .border-zinc-800, .border-zinc-700, .border-zinc-100, .border-primary {
            border-color: #e2e8f0 !important;
          }
          .shadow-2xl, .shadow-xl, .shadow-lg, .shadow-sm {
            shadow: none !important;
            box-shadow: none !important;
          }
          .print-header { display: flex !important; flex-direction: column; align-items: center; margin-bottom: 20px; }
          .print-footer { margin-top: 40px; display: flex !important; justify-content: space-between; }
        }
        .print-only { display: none; }
        @media print { .print-only { display: block !important; } }
      `}</style>

      {/* Print Template */}
      {printingVoucher && (
        <div className="print-only p-10 bg-white text-zinc-900">
           <div className="flex justify-between items-start mb-10 border-b-2 border-zinc-900 pb-6">
              <div className="flex items-center gap-4">
                 {settings?.logoUrl ? <img src={settings.logoUrl} className="w-16 h-16 object-contain" alt="Logo" /> : <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-black text-2xl">SH</div>}
                 <div>
                    <h1 className="text-xl font-black">{settings?.companyName}</h1>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase">{settings?.companyType}</p>
                 </div>
              </div>
              <div className="text-center">
                 <h2 className="text-2xl font-black border-b-2 border-zinc-100 px-6 pb-1 mb-2">سند قيد يدوي</h2>
                 <p className="text-sm font-bold">رقم السند: {printingVoucher}</p>
              </div>
              <div className="text-left text-[8px] font-bold text-zinc-400">
                 <p>{settings?.address}</p>
                 <p dir="ltr">{settings?.phone}</p>
              </div>
           </div>

           <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-zinc-50 p-3 rounded-lg border">
                 <span className="text-[10px] text-zinc-400 block mb-1">تاريخ السند</span>
                 <p className="font-bold">{archiveEntries.find(e => e.voucherNumber === printingVoucher)?.date}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-lg border">
                 <span className="text-[10px] text-zinc-400 block mb-1">البيان العام</span>
                 <p className="font-bold">{archiveEntries.find(e => e.voucherNumber === printingVoucher)?.notes || '-'}</p>
              </div>
           </div>

           <table className="w-full text-right border-collapse mb-10">
              <thead>
                 <tr className="bg-zinc-100 font-bold text-xs">
                    <th className="p-3 border">الحساب</th>
                    <th className="p-3 border text-center">مدين (+)</th>
                    <th className="p-3 border text-center">دائن (-)</th>
                    <th className="p-3 border">البيان</th>
                 </tr>
              </thead>
              <tbody>
                 {archiveEntries.filter(e => e.voucherNumber === printingVoucher).map((e, i) => (
                    <tr key={i} className="text-xs">
                       <td className="p-3 border font-bold">{e.partyName}</td>
                       <td className="p-3 border text-center font-mono">{e.paidSYP > 0 ? e.paidSYP.toLocaleString() : '-'}</td>
                       <td className="p-3 border text-center font-mono">{e.receivedSYP > 0 ? e.receivedSYP.toLocaleString() : '-'}</td>
                       <td className="p-3 border italic text-zinc-500">{e.statement}</td>
                    </tr>
                 ))}
              </tbody>
              <tfoot>
                 <tr className="bg-zinc-50 font-black">
                    <td className="p-3 border">الإجمالي</td>
                    <td className="p-3 border text-center font-mono">{archiveEntries.filter(e => e.voucherNumber === printingVoucher).reduce((s, e) => s + e.paidSYP, 0).toLocaleString()}</td>
                    <td className="p-3 border text-center font-mono">{archiveEntries.filter(e => e.voucherNumber === printingVoucher).reduce((s, e) => s + e.receivedSYP, 0).toLocaleString()}</td>
                    <td className="p-3 border"></td>
                 </tr>
              </tfoot>
           </table>

           <div className="grid grid-cols-3 gap-10 text-center mt-20">
              <div className="border-t border-zinc-300 pt-2"><p className="text-[10px] font-bold uppercase text-zinc-400">المحاسب</p></div>
              <div className="border-t border-zinc-300 pt-2"><p className="text-[10px] font-bold uppercase text-zinc-400">المدير المالي</p></div>
              <div className="border-t border-zinc-300 pt-2"><p className="text-[10px] font-bold uppercase text-zinc-400">المدير العام</p></div>
           </div>
        </div>
      )}

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
        <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
           <button 
             onClick={() => setViewMode('ENTRY')} 
             className={`px-6 py-2 rounded-xl font-black text-xs transition-all ${viewMode === 'ENTRY' ? 'bg-white dark:bg-zinc-700 shadow-md text-primary' : 'text-zinc-400'}`}
           >
             إدخال جديد
           </button>
           <button 
             onClick={() => setViewMode('ARCHIVE')} 
             className={`px-6 py-2 rounded-xl font-black text-xs transition-all ${viewMode === 'ARCHIVE' ? 'bg-white dark:bg-zinc-700 shadow-md text-primary' : 'text-zinc-400'}`}
           >
             أرشيف السندات
           </button>
        </div>
      </div>

      {viewMode === 'ENTRY' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col no-print">
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
                 <button onClick={handleSave} className={`px-16 py-4 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center gap-3 ${diff === 0 ? 'bg-primary hover:scale-105 active:scale-95' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'}`} disabled={diff !== 0}><Save className="w-7 h-7" /> {editingVoucherNumber ? 'تحديث القيد' : 'ترحيل القيد ومزامنة الدليل'}</button>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col no-print">
           <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-b dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-black text-lg text-readable">أرشيف سندات القيد</h3>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">إجمالي السندات: {Array.from(new Set(archiveEntries.map(e => e.voucherNumber))).length}</span>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                 <thead>
                    <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest h-12">
                       <th className="p-4 border-l border-zinc-800">التاريخ</th>
                       <th className="p-4 border-l border-zinc-800">رقم السند</th>
                       <th className="p-4 border-l border-zinc-800">البيان العام</th>
                       <th className="p-4 border-l border-zinc-800 text-center">القيمة الإجمالية</th>
                       <th className="p-4 text-center">إجراءات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y dark:divide-zinc-800 font-bold text-sm">
                    {Array.from(new Set(archiveEntries.map(e => e.voucherNumber))).map(vNum => {
                       const entries = archiveEntries.filter(e => e.voucherNumber === vNum);
                       const total = entries.reduce((s, e) => s + e.paidSYP, 0);
                       return (
                          <tr key={vNum} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors h-14">
                             <td className="p-4 font-mono text-zinc-400 border-l dark:border-zinc-800">{entries[0].date}</td>
                             <td className="p-4 font-black text-primary border-l dark:border-zinc-800">#{vNum}</td>
                             <td className="p-4 text-zinc-500 font-normal border-l dark:border-zinc-800">{entries[0].notes || '-'}</td>
                             <td className="p-4 text-center font-mono text-emerald-600 border-l dark:border-zinc-800">{total.toLocaleString()}</td>
                             <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                   <button onClick={() => { setPrintingVoucher(vNum); setTimeout(() => { window.print(); setPrintingVoucher(null); }, 100); }} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-900 hover:text-white rounded-xl transition-all" title="طباعة"><Printer className="w-4 h-4"/></button>
                                   <button onClick={() => handleEditArchive(vNum)} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-primary hover:text-white rounded-xl transition-all" title="عرض وتعديل"><Edit2 className="w-4 h-4"/></button>
                                   <button onClick={() => handleDeleteArchive(vNum)} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white rounded-xl transition-all" title="حذف"><Trash2 className="w-4 h-4"/></button>
                                </div>
                             </td>
                          </tr>
                       );
                    })}
                    {archiveEntries.length === 0 && (
                       <tr>
                          <td colSpan={5} className="p-20 text-center text-zinc-400 italic font-bold">لا توجد سندات قيد مؤرشفة حالياً</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-[2rem] flex items-center gap-4 text-readable no-print"><Calculator className="w-10 h-10 text-primary shrink-0" /><p className="text-sm font-bold leading-relaxed"><b>تنبيه محاسبي:</b> ترحيل القيد سيقوم بتحديث رصيد الحساب المختار فوراً في دليل الحسابات. يتم الربط بناءً على "اسم الحساب" لضمان التوافق.</p></div>
    </div>
  );
};

export default JournalEntryView;
