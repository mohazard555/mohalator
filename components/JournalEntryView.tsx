
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Plus, Trash2, Save, X, Search, 
  Calculator, MessageSquare, Calendar, Hash,
  ChevronDown, CheckCircle2, AlertCircle, FileText, History, Printer, Edit2
} from 'lucide-react';
import { AccountNode, Party, AccountingCategory, CashEntry, AppSettings } from '../types';
import { loadChartAccounts, getPrefix, normalizeArabic } from '../utils/accountUtils';
import { PrintHeader } from './PrintHeader';

interface JournalRow {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  notes: string;
}

interface Voucher {
  voucherNumber: string;
  date: string;
  mainDescription: string;
  rows: JournalRow[];
}

interface JournalEntryViewProps {
  onBack: () => void;
}

const JournalEntryView: React.FC<JournalEntryViewProps> = ({ onBack }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<JournalRow[]>([
    { id: crypto.randomUUID(), accountId: '', accountName: '', debit: 0, credit: 0, notes: '' },
    { id: crypto.randomUUID(), accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }
  ]);
  
  const [voucherNumber, setVoucherNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mainDescription, setMainDescription] = useState('');
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [journal, setJournal] = useState<CashEntry[]>([]);

  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<Voucher | null>(null);

  useEffect(() => {
    const prefix = getPrefix();
    const sPar = localStorage.getItem(`${prefix}_parties`);
    const sCat = localStorage.getItem(`${prefix}_accounting_categories`);
    const sSett = localStorage.getItem(`${prefix}_settings`);
    const sJou = localStorage.getItem(`${prefix}_cash_journal`);
    
    setAccounts(loadChartAccounts());
    if (sPar) setParties(JSON.parse(sPar));
    if (sCat) setCategories(JSON.parse(sCat));
    if (sSett) setSettings(JSON.parse(sSett));
    
    if (sJou) {
        const jou: CashEntry[] = JSON.parse(sJou);
        setJournal(jou);
        const lastNum = jou.filter(j => j.type === 'قيد').length;
        if (!editingVoucherId) setVoucherNumber((lastNum + 1).toString());
    } else {
        if (!editingVoucherId) setVoucherNumber('1');
    }
  }, [editingVoucherId]);

  const getVouchers = (): Voucher[] => {
    const journalEntries = journal.filter(j => j.type === 'قيد');
    const grouped: { [key: string]: Voucher } = {};

    journalEntries.forEach(j => {
      const key = `${j.voucherNumber}_${j.date}`;
      if (!grouped[key]) {
        grouped[key] = {
          voucherNumber: j.voucherNumber || '',
          date: j.date,
          mainDescription: j.notes || '',
          rows: []
        };
      }
      grouped[key].rows.push({
        id: j.id,
        accountId: j.linkedAccountId || '',
        accountName: j.partyName || '',
        debit: j.receivedSYP || 0,
        credit: j.paidSYP || 0,
        notes: j.statement.replace(`قيد رقم ${j.voucherNumber}`, '').replace(j.notes || '', '').trim()
      });
    });

    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date) || b.voucherNumber.localeCompare(a.voucherNumber));
  };

  const handleEditVoucher = (v: Voucher) => {
    setVoucherNumber(v.voucherNumber);
    setDate(v.date);
    setMainDescription(v.mainDescription);
    setRows(v.rows.map(r => ({ ...r, id: crypto.randomUUID() })));
    setEditingVoucherId(v.voucherNumber);
    setIsArchiveOpen(false);
  };

  const handleDeleteVoucher = (v: Voucher) => {
    if (!confirm('هل أنت متأكد من حذف هذا القيد نهائياً؟')) return;
    const prefix = getPrefix();
    const updatedJournal = journal.filter(j => !(j.voucherNumber === v.voucherNumber && j.date === v.date && j.type === 'قيد'));
    localStorage.setItem(`${prefix}_cash_journal`, JSON.stringify(updatedJournal));
    setJournal(updatedJournal);
  };

  const handlePrintVoucher = (v: Voucher) => {
    setSelectedVoucherForPrint(v);
    setTimeout(() => {
      window.print();
    }, 100);
  };

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

    // If editing, remove old rows first
    if (editingVoucherId) {
      jou = jou.filter(j => !(j.voucherNumber === editingVoucherId && j.type === 'قيد'));
    }

    const newJournalEntries: CashEntry[] = validRows.map((r, idx) => {
        const acc = accounts.find(a => a.name === r.accountName);
        const party = parties.find(p => p.name === r.accountName);
        const cat = categories.find(c => c.name === r.accountName);

        // Find counter parties
        const otherRows = validRows.filter((_, i) => i !== idx);
        const counterName = otherRows.length === 1 
          ? otherRows[0].accountName 
          : otherRows.length > 1 
            ? 'مذكورين' 
            : '---';

        return {
            id: crypto.randomUUID(),
            date,
            statement: r.notes || mainDescription || `قيد رقم ${voucherNumber}`,
            receivedSYP: r.debit, 
            paidSYP: r.credit,   
            receivedUSD: 0,
            paidUSD: 0,
            notes: mainDescription,
            type: 'قيد',
            voucherNumber,
            partyName: r.accountName,
            counterPartyName: counterName,
            linkedAccountId: acc?.id || party?.id || cat?.id,
            linkedAccountCode: acc?.code || party?.code || cat?.accountCode
        };
    });

    localStorage.setItem(`${prefix}_cash_journal`, JSON.stringify([...newJournalEntries, ...jou]));
    alert('تم ترحيل سند القيد بنجاح. ستنعكس الأرصدة فوراً في دليل الحسابات.');
    
    // Reset form
    setEditingVoucherId(null);
    setMainDescription('');
    setRows([
      { id: crypto.randomUUID(), accountId: '', accountName: '', debit: 0, credit: 0, notes: '' },
      { id: crypto.randomUUID(), accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }
    ]);
    
    // Refresh journal state
    setJournal([...newJournalEntries, ...jou]);
  };

  const allSearchableAccounts = [
    ...accounts.map(a => ({ 
      id: a.id,
      name: a.name, 
      code: a.code, 
      type: a.type === 'FOLDER' ? 'قسم رئيسي' : 'حساب عام' 
    })),
    ...parties.map(p => ({ id: p.id, name: p.name, code: p.code, type: 'جهة (عميل/مورد)' })),
    ...categories.map(c => ({ id: c.id, name: c.name, code: c.accountCode || '---', type: 'بند مصروف/إيراد' }))
  ];

  const searchTerm = normalizeArabic(accountSearch);
  const filteredResults = allSearchableAccounts.filter(a => 
    normalizeArabic(a.name || '').includes(searchTerm) || 
    normalizeArabic(a.code || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
           <button onClick={() => setIsArchiveOpen(true)} className="bg-zinc-100 dark:bg-zinc-800 text-readable border border-zinc-200 dark:border-zinc-700 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700"><History className="w-5 h-5" /> أرشيف القيود</button>
           <button onClick={handleSave} className="bg-primary text-white px-10 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all"><Save className="w-5 h-5" /> {editingVoucherId ? 'تحديث القيد' : 'ترحيل القيد للدليل'}</button>
        </div>
      </div>

      {/* Archive Modal */}
      {isArchiveOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl"><History className="w-6 h-6 text-primary" /></div>
                <h3 className="text-xl font-black text-readable">أرشيف سندات القيد اليدوية</h3>
              </div>
              <button onClick={() => setIsArchiveOpen(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"><X className="w-6 h-6 text-zinc-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 gap-4">
                {getVouchers().length === 0 ? (
                  <div className="p-20 text-center flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center"><FileText className="w-10 h-10 text-zinc-300" /></div>
                    <p className="text-zinc-400 font-bold italic">لا يوجد قيود مؤرشفة حالياً</p>
                  </div>
                ) : (
                  getVouchers().map((v, idx) => (
                    <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 hover:border-primary/50 transition-all group">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center min-w-[80px]">
                            <span className="block text-[10px] text-zinc-400 font-black uppercase">رقم السند</span>
                            <span className="block text-lg font-black text-primary">#{v.voucherNumber}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4 text-zinc-400" />
                              <span className="text-sm font-black text-readable">{v.date}</span>
                            </div>
                            <h4 className="font-bold text-readable line-clamp-1">{v.mainDescription || 'بدون بيان عام'}</h4>
                            <p className="text-[10px] text-zinc-400 font-bold mt-1">عدد الأسطر: {v.rows.length} | إجمالي القيد: {v.rows.reduce((s, r) => s + r.debit, 0).toLocaleString()} ل.س</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditVoucher(v)} className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-readable hover:text-blue-500 transition-colors"><Edit2 className="w-5 h-5" /></button>
                          <button onClick={() => handleDeleteVoucher(v)} className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-readable hover:text-rose-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Print View */}
      {selectedVoucherForPrint && (
        <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-[500] p-0 m-0">
          <div className="p-10 max-w-4xl mx-auto space-y-8 print:p-0 print:m-0 print:max-w-none">
            <PrintHeader settings={settings} title="سند قيد يدوي" period={`رقم السند: #${selectedVoucherForPrint.voucherNumber} | تاريخ القيد: ${selectedVoucherForPrint.date}`} />

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-zinc-50 p-6 rounded-2xl border-2 border-zinc-100">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] block mb-2">البيان العام للسند (Description)</span>
                 <p className="text-xl font-bold text-zinc-900 leading-relaxed">{selectedVoucherForPrint.mainDescription || '---'}</p>
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-zinc-900 border-y-2 border-zinc-900">
                  <th className="py-4 px-4 text-right text-xs font-black uppercase border-l border-zinc-200">الحساب المحاسبي</th>
                  <th className="py-4 px-4 text-center text-xs font-black uppercase w-32 border-l border-zinc-200">مدين (+)</th>
                  <th className="py-4 px-4 text-center text-xs font-black uppercase w-32 border-l border-zinc-200">دائن (-)</th>
                  <th className="py-4 px-4 text-right text-xs font-black uppercase">ملاحظات السطر</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b-2 border-zinc-900">
                {selectedVoucherForPrint.rows.map((r, i) => (
                  <tr key={i} className="h-12">
                    <td className="py-4 px-4 text-sm font-black text-zinc-900 border-l border-zinc-100">{r.accountName}</td>
                    <td className="py-4 px-4 text-center text-lg font-mono font-black text-emerald-700 border-l border-zinc-100">{r.debit > 0 ? r.debit.toLocaleString() : '-'}</td>
                    <td className="py-4 px-4 text-center text-lg font-mono font-black text-rose-700 border-l border-zinc-100">{r.credit > 0 ? r.credit.toLocaleString() : '-'}</td>
                    <td className="py-4 px-4 text-xs font-bold text-zinc-500 italic leading-tight">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-50 font-black text-lg">
                  <td className="py-6 px-4 text-right">إجمالي القيد الموزون</td>
                  <td className="py-6 px-4 text-center font-mono text-emerald-700 border-l border-zinc-200">{selectedVoucherForPrint.rows.reduce((s, r) => s + r.debit, 0).toLocaleString()}</td>
                  <td className="py-6 px-4 text-center font-mono text-rose-700 border-l border-zinc-200">{selectedVoucherForPrint.rows.reduce((s, r) => s + r.credit, 0).toLocaleString()}</td>
                  <td className="bg-white"></td>
                </tr>
              </tfoot>
            </table>

            <div className="grid grid-cols-3 gap-8 pt-20">
              <div className="text-center border-t border-zinc-200 pt-4">
                <span className="text-xs font-black text-zinc-400 uppercase">توقيع المحاسب</span>
              </div>
              <div className="text-center border-t border-zinc-200 pt-4">
                <span className="text-xs font-black text-zinc-400 uppercase">توقيع المدير</span>
              </div>
              <div className="text-center border-t border-zinc-200 pt-4">
                <span className="text-xs font-black text-zinc-400 uppercase">ختم الشركة</span>
              </div>
            </div>
            
            <div className="pt-10 text-center">
              <p className="text-[8px] text-zinc-300 font-bold uppercase tracking-[0.2em]">تم الإنشاء بواسطة نظام Finexa المحاسبي الذكي</p>
            </div>
          </div>
        </div>
      )}

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
                                         <div key={i} onClick={() => { setRows(rows.map(r => r.id === row.id ? { ...r, accountName: acc.name, accountId: acc.id } : r)); setShowResults(false); setActiveRowId(null); setAccountSearch(''); }} className="p-3 border-b dark:border-zinc-800 hover:bg-primary/10 cursor-pointer flex justify-between items-center group transition-colors">
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