
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Save, X, Search, Scale, Check } from 'lucide-react';
import { OpeningEntry, AccountNode, AppSettings } from '../types';
import OpeningEntriesManager from './OpeningEntriesManager';

interface OpeningEntriesViewProps {
  onBack: () => void;
}

const OpeningEntriesView: React.FC<OpeningEntriesViewProps> = ({ onBack }) => {
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);
  const [chartAccounts, setChartAccounts] = useState<AccountNode[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const [form, setForm] = useState<Partial<OpeningEntry>>({
    accountName: '', accountType: 'أصول', debit: 0, credit: 0, date: new Date().toISOString().split('T')[0], notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const sOp = localStorage.getItem('sheno_opening_entries');
    const sChart = localStorage.getItem('sheno_chart_accounts');
    if (sOp) setOpeningEntries(JSON.parse(sOp));
    if (sChart) setChartAccounts(JSON.parse(sChart));
  };

  const handleSave = () => {
    if (!form.accountName) { alert('يرجى اختيار الحساب'); return; }
    const newEntry = { ...form, id: crypto.randomUUID() } as OpeningEntry;
    const updated = [newEntry, ...openingEntries];
    localStorage.setItem('sheno_opening_entries', JSON.stringify(updated));
    setIsAdding(false);
    setForm({ accountName: '', accountType: 'أصول', debit: 0, credit: 0, date: new Date().toISOString().split('T')[0], notes: '' });
    setAccountSearch('');
    loadData();
  };

  // تحسين منطق البحث ليكون أكثر مرونة
  const filteredAccounts = chartAccounts.filter(a => 
    a.type === 'ACCOUNT' && (
      (a.name || '').toLowerCase().includes(accountSearch.toLowerCase()) || 
      (a.code || '').toLowerCase().includes(accountSearch.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl shadow-sm transition-all">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
             <Scale className="w-8 h-8 text-primary" />
             <h2 className="text-2xl font-black text-readable">إدارة القيود الافتتاحية</h2>
          </div>
        </div>
        <button onClick={() => { setIsAdding(true); setAccountSearch(''); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 transition-all">
          <Plus className="w-5 h-5" /> إضافة قيد ميزانية
        </button>
      </div>

      <OpeningEntriesManager 
        openingEntries={openingEntries} 
        onDelete={(id) => {
          if(window.confirm('حذف القيد؟')) {
            const updated = openingEntries.filter(x => x.id !== id);
            localStorage.setItem('sheno_opening_entries', JSON.stringify(updated));
            loadData();
          }
        }} 
      />

      {isAdding && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[250] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] border border-zinc-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-8 space-y-6 text-right" dir="rtl">
                 <div className="flex items-center justify-between border-b pb-5 dark:border-zinc-800">
                    <h3 className="text-2xl font-black">تسجيل قيد افتتاحي جديد</h3>
                    <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"><X className="w-6 h-6 text-zinc-400" /></button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2 relative">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2 flex items-center gap-1">
                          <Search className="w-3 h-3" /> البحث عن الحساب (كود أو اسم)
                       </label>
                       <div className="relative">
                          <input 
                            type="text" 
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black outline-none focus:border-primary transition-all text-sm"
                            placeholder="اكتب كود أو اسم الحساب..."
                            value={accountSearch}
                            onChange={(e) => { setAccountSearch(e.target.value); setShowResults(true); }}
                            onFocus={() => setShowResults(true)}
                          />
                          {showResults && (
                            <div className="absolute top-full right-0 left-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl z-[300] max-h-60 overflow-y-auto animate-in fade-in">
                               {filteredAccounts.length === 0 ? (
                                 <div className="p-6 text-center text-xs text-zinc-400 italic">لا توجد نتائج تطابق بحثك</div>
                               ) : (
                                 filteredAccounts.map(acc => (
                                   <div 
                                      key={acc.id} 
                                      onClick={() => { 
                                         setForm({...form, accountName: acc.name}); 
                                         setAccountSearch(acc.name); 
                                         setShowResults(false); 
                                      }} 
                                      className="p-4 border-b dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer flex justify-between items-center transition-colors group"
                                   >
                                      <div className="flex flex-col text-right">
                                         <span className="font-black text-sm text-readable group-hover:text-primary transition-colors">{acc.name}</span>
                                         <span className="text-[8px] text-zinc-400 font-bold uppercase">{acc.reportType}</span>
                                      </div>
                                      <span className="text-[10px] font-mono font-black text-primary bg-primary/5 px-2 py-1 rounded">#{acc.code}</span>
                                   </div>
                                 ))
                               )}
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">التصنيف المحاسبي</label>
                       <select className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black outline-none appearance-none cursor-pointer text-sm" value={form.accountType} onChange={e => setForm({...form, accountType: e.target.value as any})}>
                          <option value="أصول">أصول (موجودات)</option>
                          <option value="خصوم">خصوم (مطاليب)</option>
                          <option value="حقوق ملكية">حقوق ملكية</option>
                       </select>
                    </div>

                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mr-2">مدين (+)</label>
                       <input type="number" className="bg-emerald-50/50 border-2 border-emerald-100 p-4 rounded-2xl font-mono font-black text-2xl text-emerald-600 text-center outline-none focus:border-emerald-500" value={form.debit} onChange={e => setForm({...form, debit: Number(e.target.value)})} />
                    </div>

                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest mr-2">دائن (-)</label>
                       <input type="number" className="bg-rose-50/50 border-2 border-rose-100 p-4 rounded-2xl font-mono font-black text-2xl text-rose-600 text-center outline-none focus:border-rose-500" value={form.credit} onChange={e => setForm({...form, credit: Number(e.target.value)})} />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-2">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2">ملاحظات السند</label>
                       <textarea 
                         value={form.notes} 
                         onChange={e => setForm({...form, notes: e.target.value})} 
                         placeholder="اكتب ملاحظات إضافية هنا لتظهر في الدفاتر..." 
                         className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-bold outline-none h-24 resize-none focus:border-primary transition-all text-sm text-readable shadow-inner"
                       />
                    </div>
                 </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 flex justify-end gap-3 border-t dark:border-zinc-800">
                 <button onClick={handleSave} className="bg-primary text-white px-16 py-4 rounded-2xl font-black shadow-xl text-lg flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
                    <Save className="w-6 h-6" /> تثبيت القيد الافتتاحي
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default OpeningEntriesView;
