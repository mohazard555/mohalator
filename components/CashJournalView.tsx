
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Save, X, TrendingUp, TrendingDown, Search, Calendar, Filter } from 'lucide-react';
import { CashEntry } from '../types';

interface CashJournalViewProps {
  onBack: () => void;
}

const CashJournalView: React.FC<CashJournalViewProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved entries");
      }
    }
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

  const totalSYP = filteredEntries.reduce((acc, curr) => acc + (curr.receivedSYP - curr.paidSYP), 0);
  const totalUSD = filteredEntries.reduce((acc, curr) => acc + (curr.receivedUSD - curr.paidUSD), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">دفتر اليومية الشامل</h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary hover:brightness-110 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> إضافة حركة مالية
        </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <div className="bg-emerald-500/10 p-8 rounded-3xl border border-emerald-500/20 flex flex-col items-center text-center">
          <TrendingUp className="w-8 h-8 text-emerald-500 mb-2" />
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">رصيد الفلترة بالليرة</span>
          <div className="text-3xl font-mono font-black text-emerald-600">{totalSYP.toLocaleString()}</div>
        </div>

        <div className="bg-amber-500/10 p-8 rounded-3xl border border-amber-500/20 flex flex-col items-center text-center">
          <TrendingDown className="w-8 h-8 text-amber-500 mb-2" />
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">رصيد الفلترة بالدولار</span>
          <div className="text-3xl font-mono font-black text-amber-600">{totalUSD.toLocaleString()}</div>
        </div>
      </div>

      {(isAdding) && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 no-print space-y-6">
          <h3 className="text-lg font-black border-b border-zinc-100 dark:border-zinc-800 pb-3">
            {editingId ? 'تعديل الحركة المالية' : 'إضافة حركة مالية جديدة'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">التاريخ</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl font-bold outline-none" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">البيان</label>
              <input type="text" value={formData.statement} onChange={e => setFormData({...formData, statement: e.target.value})} placeholder="وصف العملية..." className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl font-bold outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">ملاحظات</label>
              <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl font-bold outline-none" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">مقبوضات ل.س</label>
              <input type="number" value={formData.receivedSYP} onChange={e => setFormData({...formData, receivedSYP: Number(e.target.value)})} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl font-black text-emerald-500 outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">مدفوعات ل.س</label>
              <input type="number" value={formData.paidSYP} onChange={e => setFormData({...formData, paidSYP: Number(e.target.value)})} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl font-black text-rose-500 outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">مقبوضات $</label>
              <input type="number" value={formData.receivedUSD} onChange={e => setFormData({...formData, receivedUSD: Number(e.target.value)})} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl font-black text-emerald-600 outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">مدفوعات $</label>
              <input type="number" value={formData.paidUSD} onChange={e => setFormData({...formData, paidUSD: Number(e.target.value)})} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl font-black text-rose-600 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              onClick={editingId ? handleSaveEdit : handleAdd}
              className="bg-primary text-white px-10 py-3 rounded-2xl font-black shadow-xl"
            >
              <Save className="w-5 h-5 inline mr-2" /> حفظ الحركة
            </button>
            <button 
              onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-8 py-3 rounded-2xl font-bold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                <th rowSpan={2} className="p-4 border-l border-zinc-100 dark:border-zinc-800">التاريخ</th>
                <th rowSpan={2} className="p-4 border-l border-zinc-100 dark:border-zinc-800">البيان</th>
                <th rowSpan={2} className="p-4 border-l border-zinc-100 dark:border-zinc-800">الملاحظات</th>
                <th colSpan={2} className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center bg-zinc-100/30 dark:bg-zinc-800/20">الليرة السورية ({formData.receivedSYP !== undefined ? 'ل.س' : ''})</th>
                <th colSpan={2} className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center">الدولار ($)</th>
                <th rowSpan={2} className="p-4 text-center no-print">إجراءات</th>
              </tr>
              <tr className="text-[9px] text-zinc-400 font-black border-b border-zinc-200 dark:border-zinc-800">
                <th className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center">مقبوض</th>
                <th className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center">مدفوع</th>
                <th className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center">مقبوض</th>
                <th className="p-2 text-center">مدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                  <td className="p-4 font-mono text-zinc-400">{entry.date}</td>
                  <td className="p-4">{entry.statement}</td>
                  <td className="p-4 text-zinc-500 font-normal italic">{entry.notes || '-'}</td>
                  <td className="p-4 text-center text-emerald-600 font-mono">{entry.receivedSYP > 0 ? entry.receivedSYP.toLocaleString() : '-'}</td>
                  <td className="p-4 text-center text-rose-500 font-mono">{entry.paidSYP > 0 ? entry.paidSYP.toLocaleString() : '-'}</td>
                  <td className="p-4 text-center text-emerald-600 font-mono">{entry.receivedUSD > 0 ? entry.receivedUSD.toLocaleString() : '-'}</td>
                  <td className="p-4 text-center text-rose-500 font-mono">{entry.paidUSD > 0 ? entry.paidUSD.toLocaleString() : '-'}</td>
                  <td className="p-4 no-print">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(entry)} className="p-2 text-zinc-400 hover:text-primary transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(entry.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
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

export default CashJournalView;
