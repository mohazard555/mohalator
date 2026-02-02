
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Save, X, Tags, TrendingDown, TrendingUp, Search, Calendar, FileText, Printer, FileDown, FileSpreadsheet, Landmark, ChevronDown } from 'lucide-react';
import { AccountingCategory, CashEntry, AppSettings, AccountNode } from '../types';
import { exportToCSV } from '../utils/export';

interface AccountingCategoriesViewProps {
  onBack: () => void;
}

const AccountingCategoriesView: React.FC<AccountingCategoriesViewProps> = ({ onBack }) => {
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [chartAccounts, setChartAccounts] = useState<AccountNode[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showChartSearch, setShowChartSearch] = useState(false);
  const [chartSearchTerm, setChartSearchTerm] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState<AccountingCategory | null>(null);

  const [formData, setFormData] = useState<Partial<AccountingCategory>>({
    name: '',
    type: 'مصروفات',
    notes: '',
    linkedAccountId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedCats = localStorage.getItem('sheno_accounting_categories');
    const savedJournal = localStorage.getItem('sheno_cash_journal');
    const savedSettings = localStorage.getItem('sheno_settings');
    const savedChart = localStorage.getItem('sheno_chart_accounts');
    
    if (savedCats) setCategories(JSON.parse(savedCats));
    if (savedJournal) setJournal(JSON.parse(savedJournal));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedChart) setChartAccounts(JSON.parse(savedChart));
  };

  const syncToChart = (category: AccountingCategory, isDelete: boolean = false) => {
    const savedChart = localStorage.getItem('sheno_chart_accounts');
    if (!savedChart) return;
    
    let chart: AccountNode[] = JSON.parse(savedChart);
    const parentId = category.type === 'مصروفات' ? '5' : '4';
    const reportType = category.type === 'مصروفات' ? 'الأرباح والخسائر' : 'الأرباح والخسائر';

    if (isDelete) {
      chart = chart.filter(acc => acc.name !== category.name);
    } else {
      const existingIdx = chart.findIndex(acc => acc.name === category.name);
      const node: AccountNode = {
        id: editingId ? (chart[existingIdx]?.id || crypto.randomUUID()) : crypto.randomUUID(),
        code: `CAT-${Math.floor(Math.random() * 1000)}`,
        name: category.name,
        parentId: parentId,
        type: 'ACCOUNT',
        reportType: reportType as any
      };
      if (existingIdx > -1) chart[existingIdx] = node;
      else chart.push(node);
    }
    localStorage.setItem('sheno_chart_accounts', JSON.stringify(chart));
  };

  const handleSave = () => {
    if (!formData.name) return;
    
    let updated: AccountingCategory[];
    const categoryToSave = { ...formData, id: editingId || crypto.randomUUID() } as AccountingCategory;

    if (editingId) {
      updated = categories.map(c => c.id === editingId ? categoryToSave : c);
    } else {
      updated = [categoryToSave, ...categories];
    }

    setCategories(updated);
    localStorage.setItem('sheno_accounting_categories', JSON.stringify(updated));
    syncToChart(categoryToSave);
    
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', type: 'مصروفات', notes: '', linkedAccountId: '' });
    loadData();
  };

  const handleDelete = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat && window.confirm('حذف هذا القسم؟ سيتم حذفه من الدليل أيضاً.')) {
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      localStorage.setItem('sheno_accounting_categories', JSON.stringify(updated));
      syncToChart(cat, true);
    }
  };

  const handleSelectFromChart = (acc: AccountNode) => {
    setFormData({
      ...formData,
      name: acc.name,
      linkedAccountId: acc.id,
      type: acc.parentId?.startsWith('5') ? 'مصروفات' : (acc.parentId?.startsWith('4') ? 'إيرادات' : (formData.type || 'مصروفات'))
    });
    setShowChartSearch(false);
    setChartSearchTerm('');
  };

  const filteredChart = chartAccounts.filter(acc => 
    acc.type === 'ACCOUNT' && 
    (acc.name.includes(chartSearchTerm) || acc.code.includes(chartSearchTerm))
  );

  const categoryMovements = selectedCategory 
    ? journal.filter(j => j.categoryId === selectedCategory.id) 
    : [];

  const handleExportCategoryExcel = () => {
    if (!selectedCategory) return;
    const exportData = categoryMovements.map(m => ({
      'التاريخ': m.date,
      'البيان': m.statement,
      'مقبوض (ل.س)': m.receivedSYP,
      'مدفوع (ل.س)': m.paidSYP,
      'مقبوض ($)': m.receivedUSD,
      'مدفوع ($)': m.paidUSD,
      'الملاحظات': m.notes || '-'
    }));
    exportToCSV(exportData, `كشف_حركات_${selectedCategory.name}`);
  };

  const totalPrimary = categoryMovements.reduce((acc, curr) => acc + (curr.receivedSYP - curr.paidSYP), 0);
  const totalSecondary = categoryMovements.reduce((acc, curr) => acc + (curr.receivedUSD - curr.paidUSD), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">إدارة البنود والأقسام المحاسبية</h2>
        </div>
        <div className="flex gap-2">
          {!selectedCategory ? (
            <>
              <button onClick={() => exportToCSV(categories, 'accounting_categories')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 hover:bg-zinc-700 transition-all"><FileDown className="w-5 h-5" /> تصدير XLSX</button>
              <button onClick={() => window.print()} className="bg-zinc-100 dark:bg-zinc-800 text-readable border border-zinc-200 dark:border-zinc-700 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2"><Printer className="w-5 h-5" /> طباعة القائمة</button>
              <button onClick={() => setIsAdding(true)} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all"><Plus className="w-5 h-5" /> إضافة قسم جديد</button>
            </>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleExportCategoryExcel} className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 hover:brightness-110 shadow-lg transition-all"><FileSpreadsheet className="w-5 h-5" /> تصدير كشف القسم (Excel)</button>
              <button onClick={() => setSelectedCategory(null)} className="bg-zinc-800 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2"><ArrowRight className="w-5 h-5" /> العودة للقائمة</button>
            </div>
          )}
        </div>
      </div>

      {!selectedCategory ? (
        <>
          {(isAdding || editingId) && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95 no-print relative">
               <h3 className="text-lg font-black text-readable border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                 <Tags className="w-5 h-5 text-primary" /> تعريف بند / قسم محاسبي جديد
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-1 md:col-span-1">
                     <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">دليل الحسابات (بحث واختيار)</label>
                     <div className="relative">
                        <button 
                          onClick={() => setShowChartSearch(!showChartSearch)}
                          className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl border-2 border-dashed dark:border-zinc-700 font-black text-xs text-readable flex items-center justify-between hover:border-primary transition-all"
                        >
                           <div className="flex items-center gap-2"><Landmark className="w-4 h-4 text-primary" /> بحث في الدليل...</div>
                           <ChevronDown className="w-4 h-4" />
                        </button>
                        {showChartSearch && (
                          <div className="absolute top-full right-0 left-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl z-[100] max-h-64 overflow-y-auto p-3 animate-in fade-in zoom-in-95">
                             <input 
                               type="text" 
                               placeholder="اسم الحساب أو الكود..." 
                               className="w-full bg-zinc-50 dark:bg-zinc-800 border p-2 rounded-xl mb-2 text-xs font-bold outline-none"
                               value={chartSearchTerm}
                               onChange={e => setChartSearchTerm(e.target.value)}
                               autoFocus
                             />
                             {filteredChart.map(acc => (
                               <div key={acc.id} onClick={() => handleSelectFromChart(acc)} className="p-2 border-b dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer flex justify-between items-center group">
                                  <span className="text-xs font-black group-hover:text-primary">{acc.name}</span>
                                  <span className="text-[10px] font-mono text-zinc-400">{acc.code}</span>
                               </div>
                             ))}
                          </div>
                        )}
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 md:col-span-1">
                     <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">اسم البند المحاسبي</label>
                     <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">نوع البند</label>
                     <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                        <option value="مصروفات">بند مصروفات</option>
                        <option value="إيرادات">بند إيرادات</option>
                     </select>
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">ملاحظات</label>
                     <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                  </div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button onClick={handleSave} className="bg-primary text-white px-10 py-3 rounded-2xl font-black shadow-lg">حفظ البند</button>
                  <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-8 py-3 rounded-2xl font-bold">إلغاء</button>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
             {categories.map(cat => (
               <div key={cat.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cat.type === 'مصروفات' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                  <div className="flex justify-between items-start mb-4">
                     <div className={`p-3 rounded-2xl ${cat.type === 'مصروفات' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {cat.type === 'مصروفات' ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                     </div>
                     <div className="flex gap-1">
                        <button onClick={() => { setEditingId(cat.id); setFormData(cat); setIsAdding(true); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(cat.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </div>
                  <h3 className="text-xl font-black text-readable mb-1">{cat.name}</h3>
                  <div className="flex items-center gap-2">
                     <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cat.type === 'مصروفات' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{cat.type}</span>
                     {cat.linkedAccountId && <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">مرتبط بالدليل</span>}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <button onClick={() => setSelectedCategory(cat)} className="text-xs font-black text-primary hover:underline flex items-center gap-1"><FileText className="w-3 h-3" /> عرض حركات البند</button>
                    <span className="text-[10px] font-bold text-zinc-400">{journal.filter(j => j.categoryId === cat.id).length} حركات مسجلة</span>
                  </div>
               </div>
             ))}
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
           <div className={`bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden print:border-zinc-300 print:shadow-none print:rounded-2xl`}>
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-3xl ${selectedCategory.type === 'مصروفات' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'} no-print`}>{selectedCategory.type === 'مصروفات' ? <TrendingDown className="w-8 h-8" /> : <TrendingUp className="w-8 h-8" />}</div>
                    <div><h3 className="text-3xl font-black text-readable">{selectedCategory.name}</h3><p className="text-sm font-bold text-zinc-500">{selectedCategory.type} - كشف حركات القسم</p></div>
                 </div>
                 <div className="flex gap-8">
                    <div className="text-center"><span className="text-[10px] font-black text-zinc-500 uppercase">إجمالي الرصيد ({settings?.currencySymbol})</span><div className={`text-3xl font-mono font-black ${totalPrimary >= 0 ? 'text-emerald-500' : 'text-rose-500'} print:text-black`}>{totalPrimary.toLocaleString()}</div></div>
                    <div className="text-center"><span className="text-[10px] font-black text-zinc-500 uppercase">إجمالي الرصيد ($)</span><div className={`text-3xl font-mono font-black ${totalSecondary >= 0 ? 'text-emerald-500' : 'text-rose-500'} print:text-black`}>{totalSecondary.toLocaleString()}</div></div>
                 </div>
              </div>
           </div>
           <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
              <table className="w-full text-right border-collapse text-sm">
                 <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800/50 text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b h-14">
                       <th className="p-4 border-l">التاريخ</th>
                       <th className="p-4 border-l">البيان</th>
                       <th className="p-4 text-center border-l">مقبوض (ل.س)</th>
                       <th className="p-4 text-center border-l">مدفوع (ل.س)</th>
                       <th className="p-4 text-center border-l">مقبوض ($)</th>
                       <th className="p-4 text-center border-l">مدفوع ($)</th>
                       <th className="p-4">ملاحظات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y font-bold">
                    {categoryMovements.map(m => (
                       <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 h-14">
                          <td className="p-4 font-mono text-zinc-400 border-l">{m.date}</td>
                          <td className="p-4 text-readable border-l">{m.statement}</td>
                          <td className="p-4 text-center text-emerald-600 font-mono border-l">{m.receivedSYP > 0 ? m.receivedSYP.toLocaleString() : '-'}</td>
                          <td className="p-4 text-center text-rose-600 font-mono border-l">{m.paidSYP > 0 ? m.paidSYP.toLocaleString() : '-'}</td>
                          <td className="p-4 text-center text-amber-600 font-mono border-l">{m.receivedUSD > 0 ? m.receivedUSD.toLocaleString() : '-'}</td>
                          <td className="p-4 text-center text-zinc-500 font-mono border-l">{m.paidUSD > 0 ? m.paidUSD.toLocaleString() : '-'}</td>
                          <td className="p-4 text-zinc-400 font-normal italic">{m.notes || '-'}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default AccountingCategoriesView;
