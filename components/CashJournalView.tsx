
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Save, X, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { CashEntry } from '../types';

interface CashJournalViewProps {
  onBack: () => void;
}

const CashJournalView: React.FC<CashJournalViewProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CashEntry>>({
    date: new Date().toISOString().split('T')[0],
    statement: '',
    receivedSYP: 0,
    paidSYP: 0,
    receivedUSD: 0,
    paidUSD: 0,
    notes: ''
  });

  // Load entries from localStorage
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

  // Save entries to localStorage
  useEffect(() => {
    localStorage.setItem('sheno_cash_journal', JSON.stringify(entries));
  }, [entries]);

  const handleAdd = () => {
    if (!formData.statement) return;
    const newEntry: CashEntry = {
      ...formData as CashEntry,
      id: crypto.randomUUID(),
    };
    setEntries([newEntry, ...entries]);
    setIsAdding(false);
    resetForm();
  };

  const handleEdit = (entry: CashEntry) => {
    setEditingId(entry.id);
    setFormData(entry);
  };

  const handleSaveEdit = () => {
    setEntries(entries.map(e => e.id === editingId ? { ...e, ...formData } as CashEntry : e));
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السند؟')) {
      setEntries(entries.filter(e => e.id !== id));
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

  const totalSYP = entries.reduce((acc, curr) => acc + (curr.receivedSYP - curr.paidSYP), 0);
  const totalUSD = entries.reduce((acc, curr) => acc + (curr.receivedUSD - curr.paidUSD), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">دفتر اليومية</h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> إضافة سند جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-900/30 to-zinc-900 p-6 rounded-2xl border border-emerald-500/20">
          <div className="flex justify-between items-start mb-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">الرصيد الكلي بالليرة</span>
          </div>
          <div className="text-3xl font-mono font-bold text-zinc-100">{totalSYP.toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-rose-900/30 to-zinc-900 p-6 rounded-2xl border border-rose-500/20">
          <div className="flex justify-between items-start mb-2">
            <TrendingDown className="w-6 h-6 text-rose-400" />
            <span className="text-xs text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full">الرصيد الكلي بالدولار</span>
          </div>
          <div className="text-3xl font-mono font-bold text-zinc-100">{totalUSD.toLocaleString()}</div>
        </div>
      </div>

      {/* Form for adding/editing */}
      {(isAdding || editingId) && (
        <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 shadow-2xl animate-in slide-in-from-top duration-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? 'تعديل سند' : 'إضافة سند جديد'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">التاريخ</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-zinc-500">البيان</label>
              <input 
                type="text" 
                value={formData.statement}
                onChange={e => setFormData({...formData, statement: e.target.value})}
                placeholder="بيان السند..."
                className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">ملاحظات</label>
              <input 
                type="text" 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="اختياري..."
                className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-500">مقبوضات ل.س</label>
              <input 
                type="number" 
                value={formData.receivedSYP}
                onChange={e => setFormData({...formData, receivedSYP: Number(e.target.value)})}
                className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">مدفوعات ل.س</label>
              <input 
                type="number" 
                value={formData.paidSYP}
                onChange={e => setFormData({...formData, paidSYP: Number(e.target.value)})}
                className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">مقبوضات $</label>
              <input 
                type="number" 
                value={formData.receivedUSD}
                onChange={e => setFormData({...formData, receivedUSD: Number(e.target.value)})}
                className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">مدفوعات $</label>
              <input 
                type="number" 
                value={formData.paidUSD}
                onChange={e => setFormData({...formData, paidUSD: Number(e.target.value)})}
                className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button 
              onClick={editingId ? handleSaveEdit : handleAdd}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> حفظ السند
            </button>
            <button 
              onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-6 py-2 rounded-lg font-bold flex items-center gap-2"
            >
              <X className="w-5 h-5" /> إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-700 shadow-lg bg-zinc-800">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-zinc-700 text-white text-xs">
              <th rowSpan={2} className="p-3 border border-zinc-600">التاريخ</th>
              <th rowSpan={2} className="p-3 border border-zinc-600">البيان</th>
              <th colSpan={2} className="p-2 border border-zinc-600 text-center bg-zinc-600">رصيد الليرة السورية</th>
              <th colSpan={2} className="p-2 border border-zinc-600 text-center bg-zinc-800">رصيد الدولار $</th>
              <th rowSpan={2} className="p-3 border border-zinc-600">الإجراءات</th>
            </tr>
            <tr className="bg-zinc-800 text-[10px] text-zinc-400">
              <th className="p-2 border border-zinc-700 text-center">مقبوضات</th>
              <th className="p-2 border border-zinc-700 text-center">مدفوعات</th>
              <th className="p-2 border border-zinc-700 text-center">مقبوضات</th>
              <th className="p-2 border border-zinc-700 text-center">مدفوعات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700 text-sm">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-zinc-500">لا يوجد بيانات حالياً، قم بإضافة سند جديد.</td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-700/30 transition-colors">
                  <td className="p-3 text-zinc-400 font-mono whitespace-nowrap">{entry.date}</td>
                  <td className="p-3 font-medium text-zinc-200">{entry.statement}</td>
                  <td className="p-3 text-center text-emerald-400 font-mono">{entry.receivedSYP > 0 ? entry.receivedSYP.toLocaleString() : '-'}</td>
                  <td className="p-3 text-center text-rose-400 font-mono">{entry.paidSYP > 0 ? entry.paidSYP.toLocaleString() : '-'}</td>
                  <td className="p-3 text-center text-emerald-500 font-mono">{entry.receivedUSD > 0 ? entry.receivedUSD.toLocaleString() : '-'}</td>
                  <td className="p-3 text-center text-rose-500 font-mono">{entry.paidUSD > 0 ? entry.paidUSD.toLocaleString() : '-'}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(entry)} className="p-1 hover:text-blue-400 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="p-1 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashJournalView;
