
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Save, X, TrendingUp, TrendingDown, Search, Calendar, Filter, Coins, CreditCard, Printer } from 'lucide-react';
import { CashEntry, AppSettings } from '../types';

interface CashJournalViewProps {
  onBack: () => void;
}

const CashJournalView: React.FC<CashJournalViewProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
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
    notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('sheno_cash_journal');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved entries");
      }
    }
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
    if (window.confirm('هل أنت متأكد من حذف هذا السند؟')) {
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
      notes: ''
    });
  };

  const filteredEntries = entries.filter(e => {
    const matchStatement = e.statement.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
    return matchStatement && matchDate;
  });

  const totalPrimary = filteredEntries.reduce((acc, curr) => acc + (curr.receivedSYP - curr.paidSYP), 0);
  const totalSecondary = filteredEntries.reduce((acc, curr) => acc + (curr.receivedUSD - curr.paidUSD), 0);

  return (
    <div className="space-y-6">
      {/* Print Header */}
      <div className="print-only print-header flex justify-between items-center bg-blue-800 p-6 rounded-t-xl text-white mb-0 border-b-0">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
          <div>
            <h1 className="text-2xl font-black">{settings?.companyName}</h1>
            <p className="text-xs opacity-80">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black underline decoration-white/30 underline-offset-8">دفتر اليومية المالي التفصيلي</h2>
          <p className="text-xs mt-2 opacity-80 flex items-center justify-center gap-1"><Calendar className="w-3 h-3"/> تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        <div className="text-left text-xs font-bold space-y-1">
          <p>{settings?.address}</p>
          <p>{settings?.phone}</p>
        </div>
      </div>

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-blue-800">دفتر اليومية الشامل</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-primary hover:brightness-110 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary/20"
          >
            <Plus className="w-5 h-5" /> إضافة حركة مالية
          </button>
          <button onClick={() => window.print()} className="bg-blue-100 text-blue-800 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2">
             <Printer className="w-5 h-5" /> طباعة
          </button>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-4 no-print shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="تصفية حسب البيان أو الملاحظات..."
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-2.5 pr-12 pl-4 outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700">
           <Calendar className="w-4 h-4 text-zinc-400" />
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-500">من</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none" />
              <span className="text-[10px] font-black text-zinc-500">إلى</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none" />
           </div>
        </div>
      </div>

      {(isAdding) && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 no-print space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h3 className="text-xl font-black text-readable flex items-center gap-2">
              {editingId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-primary" />}
              {editingId ? 'تعديل الحركة المالية' : 'إضافة حركة مالية جديدة'}
            </h3>
            <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="text-zinc-400 hover:text-rose-500"><X className="w-6 h-6"/></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">تاريخ العملية</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-primary p-3 rounded-2xl font-bold outline-none transition-all" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">البيان / الوصف</label>
              <input type="text" value={formData.statement} onChange={e => setFormData({...formData, statement: e.target.value})} placeholder="مثلاً: دفعة من حساب زبون، مصاريف نثرية..." className="bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-primary p-3 rounded-2xl font-bold outline-none transition-all" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">ملاحظات إضافية</label>
              <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-primary p-3 rounded-2xl font-bold outline-none transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Primary Currency Section */}
             <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/20 space-y-4">
                <div className="flex items-center gap-3 text-primary border-b border-primary/10 pb-3">
                   <div className="bg-primary text-white p-2 rounded-xl shadow-lg"><Coins className="w-5 h-5"/></div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-70">العملة الأساسية</span>
                      <span className="text-lg font-black">{settings?.currency} ({settings?.currencySymbol})</span>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1">
                     <label className="text-[10px] text-primary/70 font-black uppercase mr-1">مقبوضات (داخل)</label>
                     <input type="number" value={formData.receivedSYP} onChange={e => setFormData({...formData, receivedSYP: Number(e.target.value)})} className="bg-white dark:bg-zinc-800 border-2 border-emerald-500/30 p-3 rounded-2xl font-black text-emerald-500 text-xl outline-none focus:border-emerald-500 transition-all" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <label className="text-[10px] text-rose-500/70 font-black uppercase mr-1">مدفوعات (خارج)</label>
                     <input type="number" value={formData.paidSYP} onChange={e => setFormData({...formData, paidSYP: Number(e.target.value)})} className="bg-white dark:bg-zinc-800 border-2 border-rose-500/30 p-3 rounded-2xl font-black text-rose-500 text-xl outline-none focus:border-rose-500 transition-all" />
                   </div>
                </div>
             </div>

             {/* Secondary Currency Section */}
             <div className="bg-amber-500/5 p-6 rounded-3xl border-2 border-amber-500/20 space-y-4">
                <div className="flex items-center gap-3 text-amber-600 border-b border-amber-500/10 pb-3">
                   <div className="bg-amber-500 text-white p-2 rounded-xl shadow-lg"><CreditCard className="w-5 h-5"/></div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-70">العملة الثانوية</span>
                      <span className="text-lg font-black">{settings?.secondaryCurrency} ({settings?.secondaryCurrencySymbol})</span>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1">
                     <label className="text-[10px] text-amber-600/70 font-black uppercase mr-1">مقبوضات (داخل)</label>
                     <input type="number" value={formData.receivedUSD} onChange={e => setFormData({...formData, receivedUSD: Number(e.target.value)})} className="bg-white dark:bg-zinc-800 border-2 border-amber-500/30 p-3 rounded-2xl font-black text-amber-600 text-xl outline-none focus:border-amber-600 transition-all" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">مدفوعات (خارج)</label>
                     <input type="number" value={formData.paidUSD} onChange={e => setFormData({...formData, paidUSD: Number(e.target.value)})} className="bg-white dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 p-3 rounded-2xl font-black text-zinc-600 text-xl outline-none focus:border-zinc-400 transition-all" />
                   </div>
                </div>
             </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              onClick={editingId ? handleSaveEdit : handleAdd}
              className="bg-primary text-white px-12 py-4 rounded-2xl font-black shadow-2xl shadow-primary/30 flex items-center gap-3 hover:brightness-110 active:scale-95 transition-all text-lg"
            >
              <Save className="w-6 h-6" /> {editingId ? 'تحديث بيانات الحركة' : 'تثبيت الحركة المالية'}
            </button>
            <button 
              onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-10 py-4 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Summary Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <div className="bg-emerald-500/5 p-8 rounded-3xl border-2 border-emerald-500/20 flex flex-col items-center text-center shadow-sm">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/20">
             <TrendingUp className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">صافي الرصيد - {settings?.currency}</span>
          <div className="text-4xl font-mono font-black text-emerald-600">{totalPrimary.toLocaleString()} <span className="text-xl font-bold opacity-60">{settings?.currencySymbol}</span></div>
        </div>

        <div className="bg-amber-500/5 p-8 rounded-3xl border-2 border-amber-500/20 flex flex-col items-center text-center shadow-sm">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-amber-500/20">
             <TrendingDown className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">صافي الرصيد - {settings?.secondaryCurrency}</span>
          <div className="text-4xl font-mono font-black text-amber-600">{totalSecondary.toLocaleString()} <span className="text-xl font-bold opacity-60">{settings?.secondaryCurrencySymbol}</span></div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl print:border-blue-800 print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-blue-800 text-white text-[10px] font-black uppercase tracking-widest border-b border-blue-900">
                <th rowSpan={2} className="p-4 border-l border-blue-900">التاريخ</th>
                <th rowSpan={2} className="p-4 border-l border-blue-900">البيان</th>
                <th rowSpan={2} className="p-4 border-l border-blue-900">الملاحظات</th>
                <th colSpan={2} className="p-3 border-l border-blue-900 text-center bg-blue-900/20">الأساسية: {settings?.currency} ({settings?.currencySymbol})</th>
                <th colSpan={2} className="p-3 border-l border-blue-900 text-center bg-amber-900/20">الثانوية: {settings?.secondaryCurrency} ({settings?.secondaryCurrencySymbol})</th>
                <th rowSpan={2} className="p-4 text-center no-print">إجراءات</th>
              </tr>
              <tr className="text-[9px] text-zinc-200 font-black border-b border-blue-900 bg-blue-900/50">
                <th className="p-3 border-l border-blue-900 text-center bg-emerald-500/20">مقبوض (داخل)</th>
                <th className="p-3 border-l border-blue-900 text-center bg-rose-500/20">مدفوع (خارج)</th>
                <th className="p-3 border-l border-blue-900 text-center bg-amber-500/20">مقبوض (داخل)</th>
                <th className="p-3 text-center bg-zinc-500/20">مدفوع (خارج)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold print:divide-zinc-300">
              {filteredEntries.length === 0 ? (
                <tr><td colSpan={8} className="p-20 text-center italic text-zinc-400 font-bold">لا توجد حركات مالية مسجلة تتوافق مع البحث</td></tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-blue-50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-4 font-mono text-zinc-400 border-l border-zinc-100 dark:border-zinc-800">{entry.date}</td>
                    <td className="p-4 border-l border-zinc-100 dark:border-zinc-800">{entry.statement}</td>
                    <td className="p-4 text-zinc-500 font-normal italic border-l border-zinc-100 dark:border-zinc-800">{entry.notes || '-'}</td>
                    <td className="p-4 text-center text-emerald-600 font-mono border-l border-zinc-100 dark:border-zinc-800 bg-emerald-50/30 print:bg-transparent">{entry.receivedSYP > 0 ? entry.receivedSYP.toLocaleString() : '-'}</td>
                    <td className="p-4 text-center text-rose-500 font-mono border-l border-zinc-100 dark:border-zinc-800 bg-rose-50/30 print:bg-transparent">{entry.paidSYP > 0 ? entry.paidSYP.toLocaleString() : '-'}</td>
                    <td className="p-4 text-center text-amber-600 font-mono border-l border-zinc-100 dark:border-zinc-800 bg-amber-500/5 print:bg-transparent">{entry.receivedUSD > 0 ? entry.receivedUSD.toLocaleString() : '-'}</td>
                    <td className="p-4 text-center text-zinc-500 font-mono border-l border-zinc-100 dark:border-zinc-800">{entry.paidUSD > 0 ? entry.paidUSD.toLocaleString() : '-'}</td>
                    <td className="p-4 no-print">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(entry)} className="p-2 text-zinc-400 hover:text-primary transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(entry.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashJournalView;