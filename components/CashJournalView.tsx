import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Save, X, TrendingUp, TrendingDown, Search, Calendar, Filter, Coins, CreditCard, Printer, Tags, ImageIcon, FileSpreadsheet, User, FileDown, FileText } from 'lucide-react';
import { CashEntry, AppSettings, AccountingCategory, Party } from '../types';
import { ImageExportService } from '../utils/ImageExportService';
import { exportToCSV } from '../utils/export';

interface CashJournalViewProps {
  onBack: () => void;
}

const CashJournalView: React.FC<CashJournalViewProps> = ({ onBack }) => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState<Partial<CashEntry>>({
    date: new Date().toISOString().split('T')[0],
    statement: '',
    receivedSYP: 0,
    paidSYP: 0,
    receivedUSD: 0,
    paidUSD: 0,
    notes: '',
    categoryId: '',
    partyName: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('sheno_cash_journal');
    const savedCats = localStorage.getItem('sheno_accounting_categories');
    const savedParties = localStorage.getItem('sheno_parties');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (saved) setEntries(JSON.parse(saved));
    if (savedCats) setCategories(JSON.parse(savedCats));
    if (savedParties) setParties(JSON.parse(savedParties));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const handleSaveToStorage = (updatedEntries: CashEntry[]) => {
    setEntries(updatedEntries);
    localStorage.setItem('sheno_cash_journal', JSON.stringify(updatedEntries));
  };

  const handleAdd = () => {
    if (!formData.statement) return;
    const newEntry: CashEntry = {
      ...formData as CashEntry,
      id: crypto.randomUUID(),
    };
    handleSaveToStorage([newEntry, ...entries]);
    setIsAdding(false);
    resetForm();
  };

  const handleEdit = (entry: CashEntry) => {
    setEditingId(entry.id);
    setFormData(entry);
    setIsAdding(true);
  };

  const handleSaveEdit = () => {
    const updated = entries.map(e => e.id === editingId ? { ...e, ...formData } as CashEntry : e);
    handleSaveToStorage(updated);
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الحركة المالية؟')) {
      handleSaveToStorage(entries.filter(e => e.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      statement: '',
      receivedSYP: 0,
      paidSYP: 0,
      receivedUSD: 0,
      paidUSD: 0,
      notes: '',
      categoryId: '',
      partyName: ''
    });
  };

  const handleExportExcel = () => {
    const data = filteredEntries.map(e => {
      const category = categories.find(c => c.id === e.categoryId);
      return {
        'التاريخ': e.date,
        'الحساب / القسم': e.partyName || category?.name || '-',
        'البيان': e.statement,
        [`مقبوض (${settings?.currencySymbol || 'ل.س'})`]: e.receivedSYP,
        [`مدفوع (${settings?.currencySymbol || 'ل.س'})`]: e.paidSYP,
        'مقبوض ($)': e.receivedUSD,
        'مدفوع ($)': e.paidUSD,
        'ملاحظات': e.notes
      };
    });
    exportToCSV(data, 'daily_journal_report');
  };

  const handleExportImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    await ImageExportService.exportAsPng(exportRef.current, `دفتر_اليومية_${new Date().toISOString().split('T')[0]}`);
    setIsExporting(false);
  };

  const filteredEntries = entries.filter(e => {
    const matchSearch = e.statement.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (e.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.partyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.counterPartyName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
    return matchSearch && matchDate;
  });

  // Logic to avoid repeating both sides of simple journal entries in the view
  // We will group by voucherNumber and date, and for simple 2-row entries, we only show one row
  const displayEntries = (() => {
    const journalGroups: { [key: string]: CashEntry[] } = {};
    const others: CashEntry[] = [];

    filteredEntries.forEach(e => {
      if (e.type === 'قيد' && e.voucherNumber) {
        const key = `${e.voucherNumber}_${e.date}`;
        if (!journalGroups[key]) journalGroups[key] = [];
        journalGroups[key].push(e);
      } else {
        others.push(e);
      }
    });

    const processedJournal: CashEntry[] = [];
    Object.values(journalGroups).forEach(group => {
      if (group.length === 2) {
        // For simple 2-row entries, show the one that is NOT the main cash/box account if possible
        // or just show the first one but with counter account info
        // Actually, let's show the one that is NOT 'الصندوق' or 'المصرف' if one of them is
        const cashKeywords = ['صندوق', 'مصرف', 'بنك', 'cash', 'bank'];
        const isCashSide = (name: string) => cashKeywords.some(k => name.toLowerCase().includes(k));
        
        const cashSide = group.find(e => isCashSide(e.partyName || '') || e.cashAccount);
        const nonCashSide = group.find(e => !isCashSide(e.partyName || '') && !e.cashAccount);

        if (cashSide) {
          processedJournal.push(cashSide);
        } else if (nonCashSide) {
          processedJournal.push(nonCashSide);
        } else {
          processedJournal.push(group[0]);
        }
      } else {
        // For complex entries, show all rows
        processedJournal.push(...group);
      }
    });

    return [...others, ...processedJournal].sort((a, b) => b.date.localeCompare(a.date));
  })();

  const totalPrimary = displayEntries.reduce((acc, curr) => acc + (curr.receivedSYP - curr.paidSYP), 0);
  const totalSecondary = displayEntries.reduce((acc, curr) => acc + (curr.receivedUSD - curr.paidUSD), 0);

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          .bg-zinc-800, .bg-zinc-900, .bg-zinc-950, .bg-emerald-500\\/5, .bg-amber-500\\/5 {
            background-color: white !important;
            color: #0f172a !important;
            border: 1px solid #e2e8f0 !important;
          }
          .text-white {
            color: #0f172a !important;
          }
          .bg-emerald-900\\/10, .bg-rose-900\\/10, .bg-amber-900\\/10, .bg-emerald-50\\/20, .bg-rose-50\\/20, .bg-amber-500\\/5 {
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
          .border-primary {
            border-color: #e2e8f0 !important;
          }
          .shadow-2xl, .shadow-xl, .shadow-lg, .shadow-sm {
            shadow: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors shadow-sm">
            <ArrowRight className="w-6 h-6 text-primary" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-readable leading-tight">دفتر اليومية الشامل (صندوق)</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">تتبع العمليات المالية والتدفقات النقدية</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={() => setIsAdding(true)} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 transition-all">
            <Plus className="w-5 h-5" /> إضافة حركة مالية
          </button>
          <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-emerald-500 transition-all">
            <FileSpreadsheet className="w-5 h-5" /> تصدير Excel
          </button>
          <button onClick={handleExportImage} disabled={isExporting} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg disabled:opacity-50">
            {isExporting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <ImageIcon className="w-5 h-5" />} حفظ كصورة
          </button>
          <button onClick={() => window.print()} className="bg-zinc-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-zinc-800 transition-all">
            <Printer className="w-5 h-5" /> طباعة
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-4 no-print shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input type="text" placeholder="البحث في البيان أو اسم الحساب..." className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-2.5 pr-12 outline-none font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700">
           <Calendar className="w-4 h-4 text-zinc-400" />
           <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase text-zinc-500">من</span><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-readable" /><span className="text-[10px] font-black uppercase text-zinc-500">إلى</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-readable" /></div>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 shadow-2xl animate-in zoom-in-95 no-print space-y-8">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-xl font-black text-readable flex items-center gap-2">
              {editingId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-primary" />}
              {editingId ? 'تعديل الحركة المالية' : 'إضافة حركة مالية جديدة'}
            </h3>
            <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="text-zinc-400 hover:text-rose-500"><X className="w-6 h-6"/></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">تاريخ العملية</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl font-bold outline-none" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">البيان / الوصف</label>
              <input type="text" value={formData.statement} onChange={e => setFormData({...formData, statement: e.target.value})} placeholder="مثلاً: دفعة من حساب زبون، مصاريف..." className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl font-bold outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">البند المحاسبي (اختياري)</label>
              <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl font-bold outline-none appearance-none">
                 <option value="">-- اختر القسم --</option>
                 {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name} ({cat.type})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">اختيار الحساب / العميل / المورد</label>
                <div className="relative">
                   <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                   <select value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border p-3 pr-10 rounded-2xl font-black outline-none appearance-none">
                      <option value="">-- ربط بحساب من الدليل --</option>
                      {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                   </select>
                </div>
             </div>
             <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">ملاحظات إضافية</label>
                <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl font-bold outline-none" />
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/20 space-y-4">
                <div className="flex items-center gap-3 text-primary border-b pb-3">
                   <div className="bg-primary text-white p-2 rounded-xl shadow-lg"><Coins className="w-5 h-5"/></div>
                   <span className="text-lg font-black">{settings?.currency} ({settings?.currencySymbol})</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1"><label className="text-[10px] font-black uppercase text-emerald-600">مقبوض (داخل)</label><input type="number" value={formData.receivedSYP} onChange={e => setFormData({...formData, receivedSYP: Number(e.target.value)})} className="bg-white dark:bg-zinc-800 border-2 border-emerald-500/20 p-3 rounded-2xl font-black text-emerald-500 text-xl outline-none" /></div>
                   <div className="flex flex-col gap-1"><label className="text-[10px] font-black uppercase text-rose-600">مدفوع (خارج)</label><input type="number" value={formData.paidSYP} onChange={e => setFormData({...formData, paidSYP: Number(e.target.value)})} className="bg-white dark:bg-zinc-800 border-2 border-rose-500/20 p-3 rounded-2xl font-black text-rose-500 text-xl outline-none" /></div>
                </div>
             </div>

             <div className="bg-amber-500/5 p-6 rounded-3xl border-2 border-amber-500/20 space-y-4">
                <div className="flex items-center gap-3 text-amber-600 border-b pb-3">
                   <div className="bg-amber-500 text-white p-2 rounded-xl shadow-lg"><CreditCard className="w-5 h-5"/></div>
                   <span className="text-lg font-black">{settings?.secondaryCurrency} ($)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1"><label className="text-[10px] font-black uppercase text-amber-600">مقبوض (داخل)</label><input type="number" value={formData.receivedUSD} onChange={e => setFormData({...formData, receivedUSD: Number(e.target.value)})} className="bg-white dark:bg-zinc-800 border-2 border-amber-500/20 p-3 rounded-2xl font-black text-amber-600 text-xl outline-none" /></div>
                   <div className="flex flex-col gap-1"><label className="text-[10px] font-black uppercase text-zinc-500">مدفوع (خارج)</label><input type="number" value={formData.paidUSD} onChange={e => setFormData({...formData, paidUSD: Number(e.target.value)})} className="bg-white dark:bg-zinc-800 border p-3 rounded-2xl font-black text-zinc-500 text-xl outline-none" /></div>
                </div>
             </div>
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <button onClick={editingId ? handleSaveEdit : handleAdd} className="bg-primary text-white px-12 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all text-xl"><Save className="w-6 h-6" /> {editingId ? 'تعديل البيانات' : 'حفظ الحركة المالية'}</button>
            <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-10 py-4 rounded-2xl font-bold">إلغاء</button>
          </div>
        </div>
      )}

      <div ref={exportRef} className="space-y-6 bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] shadow-sm export-fix print:p-0">
        
        {/* Professional Print Header (Visible only in print/export) */}
        <div className="hidden print:flex flex-col mb-8 bg-white text-zinc-900 mx-auto w-full">
          <div className="flex justify-between items-center border-b-4 border-rose-700 pb-4">
            <div className="text-right flex flex-col gap-1">
              <span className="text-sm font-black text-zinc-600">سوريا</span>
              <span className="text-xs font-bold text-zinc-500">تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</span>
            </div>
            <div className="text-center flex flex-col items-center">
              <h2 className="text-3xl font-black text-black">دفتر اليومية الشامل (صندوق)</h2>
              <span className="text-sm font-black text-rose-700 mt-1">الفترة: {startDate || 'البداية'} إلى {endDate || 'اليوم'}</span>
            </div>
            <div className="text-left flex items-center gap-3">
              <div className="flex flex-col items-end">
                <h1 className="text-2xl font-black text-rose-700 leading-none">SAMLATOR2026</h1>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">نظام إدارة محاسبية متطور</p>
              </div>
              <div className="w-12 h-12 bg-rose-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm">SH</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4 no-print-visible">
          <div className="bg-emerald-500/5 p-8 rounded-3xl border-2 border-emerald-500/10 flex flex-col items-center text-center">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">الرصيد الصافي ({settings?.currencySymbol})</span>
            <div className="text-4xl font-mono font-black text-emerald-600">{totalPrimary.toLocaleString()}</div>
          </div>
          <div className="bg-amber-500/5 p-8 rounded-3xl border-2 border-amber-500/10 flex flex-col items-center text-center">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">الرصيد الصافي ({settings?.secondaryCurrencySymbol})</span>
            <div className="text-4xl font-mono font-black text-amber-600">{totalSecondary.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border overflow-hidden shadow-2xl print:border-zinc-300 print:rounded-none">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest border-b h-14 print:bg-zinc-100 print:text-black">
                  <th className="p-4 border-l">التاريخ</th>
                  <th className="p-4 border-l">الحساب / القسم</th>
                  <th className="p-4 border-l">الحساب المقابل</th>
                  <th className="p-4 border-l">البيان الرسمي</th>
                  <th className="p-4 border-l text-center bg-emerald-900/10 print:bg-transparent">مقبوض ({settings?.currencySymbol})</th>
                  <th className="p-4 border-l text-center bg-rose-900/10 print:bg-transparent">مدفوع ({settings?.currencySymbol})</th>
                  <th className="p-4 border-l text-center bg-amber-900/10 print:bg-transparent">مقبوض ($)</th>
                  <th className="p-4 border-l text-center">مدفوع ($)</th>
                  <th className="p-4 text-center no-print">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold">
                {displayEntries.map((entry) => {
                  const category = categories.find(c => c.id === entry.categoryId);
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                      <td className="p-4 font-mono text-zinc-400 border-l">{entry.date}</td>
                      <td className="p-4 border-l">
                         <div className="flex flex-col">
                            <span className="text-readable">{entry.partyName || category?.name || '-'}</span>
                            {category && <span className="text-[8px] text-zinc-400 font-black uppercase">{category.type}</span>}
                         </div>
                      </td>
                      <td className="p-4 border-l text-primary font-black text-xs">{entry.counterPartyName || '-'}</td>
                      <td className="p-4 border-l text-zinc-500 font-normal">{entry.statement}</td>
                      <td className="p-4 text-center text-emerald-600 font-mono border-l bg-emerald-50/20">{entry.receivedSYP > 0 ? entry.receivedSYP.toLocaleString() : '-'}</td>
                      <td className="p-4 text-center text-rose-500 font-mono border-l bg-rose-50/20">{entry.paidSYP > 0 ? entry.paidSYP.toLocaleString() : '-'}</td>
                      <td className="p-4 text-center text-amber-600 font-mono border-l bg-amber-500/5">{entry.receivedUSD > 0 ? entry.receivedUSD.toLocaleString() : '-'}</td>
                      <td className="p-4 text-center text-zinc-400 font-mono border-l">{entry.paidUSD > 0 ? entry.paidUSD.toLocaleString() : '-'}</td>
                      <td className="p-4 no-print">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {entry.voucherNumber && (
                             <button onClick={() => setSelectedVoucher(entry.voucherNumber!)} className="p-2 text-zinc-400 hover:text-emerald-500 transition-all" title="عرض التفاصيل"><Search className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => handleEdit(entry)} className="p-2 text-zinc-400 hover:text-primary transition-all"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(entry.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
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

      {/* Voucher Details Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95">
              <div className="p-6 bg-zinc-900 text-white flex justify-between items-center border-b border-white/10">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/20 rounded-xl text-primary">
                       <FileText className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black tracking-tight">تفاصيل السند / القيد</h3>
                       <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">رقم المرجع: {selectedVoucher}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedVoucher(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-6 h-6 text-zinc-400" />
                 </button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 <table className="w-full text-right border-collapse text-sm">
                    <thead>
                       <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black uppercase text-[10px]">
                          <th className="p-3 border-l dark:border-zinc-700">الحساب</th>
                          <th className="p-3 border-l dark:border-zinc-700">البيان</th>
                          <th className="p-3 border-l dark:border-zinc-700 text-center">مدين</th>
                          <th className="p-3 border-l dark:border-zinc-700 text-center">دائن</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-zinc-800 font-bold">
                       {entries.filter(e => e.voucherNumber === selectedVoucher).map(e => (
                          <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                             <td className="p-3 border-l dark:border-zinc-800 text-primary">{e.partyName || e.cashAccount || '-'}</td>
                             <td className="p-3 border-l dark:border-zinc-800">{e.statement}</td>
                             <td className="p-3 border-l dark:border-zinc-800 text-center text-emerald-600 font-mono">{e.receivedSYP > 0 ? e.receivedSYP.toLocaleString() : '-'}</td>
                             <td className="p-3 border-l dark:border-zinc-800 text-center text-rose-600 font-mono">{e.paidSYP > 0 ? e.paidSYP.toLocaleString() : '-'}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-t dark:border-zinc-800 flex gap-2">
                 <button onClick={() => setSelectedVoucher(null)} className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all">إغلاق</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CashJournalView;