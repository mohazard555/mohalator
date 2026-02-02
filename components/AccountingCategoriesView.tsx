
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

  // Added logic to filter category movements based on selectedCategory
  const categoryMovements = selectedCategory 
    ? journal.filter(j => j.categoryId === selectedCategory.id)
    : [];

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
        reportType: 'الأرباح والخسائر'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all"><ArrowRight className="w-6 h-6" /></button>
          <h2 className="text-2xl font-black text-readable">إدارة البنود والأقسام المحاسبية</h2>
        </div>
        <div className="flex gap-2">
          {!selectedCategory && (
             <button onClick={() => setIsAdding(true)} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all"><Plus className="w-5 h-5" /> إضافة قسم جديد</button>
          )}
          {selectedCategory && (
             <button onClick={() => setSelectedCategory(null)} className="bg-zinc-800 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2"><ArrowRight className="w-5 h-5" /> العودة للقائمة</button>
          )}
        </div>
      </div>

      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
           {(isAdding || editingId) && (
            <div className="col-span-full bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 shadow-2xl space-y-6 mb-6">
               <h3 className="text-lg font-black text-readable flex items-center gap-2"><Tags className="w-5 h-5 text-primary" /> تعريف بند جديد ومزامنته مع الدليل</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase">اسم البند</label><input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border font-bold outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase">نوع البند</label><select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border font-bold outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}><option value="مصروفات">بند مصروفات</option><option value="إيرادات">بند إيرادات</option></select></div>
                  <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase">ملاحظات</label><input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border font-bold outline-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t"><button onClick={handleSave} className="bg-primary text-white px-10 py-3 rounded-2xl font-black shadow-lg">حفظ ومزامنة</button><button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-8 py-3 rounded-2xl font-bold">إلغاء</button></div>
            </div>
           )}

           {categories.map(cat => (
             <div key={cat.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cat.type === 'مصروفات' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                <div className="flex justify-between items-start mb-4">
                   <div className={`p-3 rounded-2xl ${cat.type === 'مصروفات' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{cat.type === 'مصروفات' ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}</div>
                   <div className="flex gap-1">
                      <button onClick={() => { setEditingId(cat.id); setFormData(cat); setIsAdding(true); }} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-primary transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(cat.id)} className="p-2 hover:bg-rose-500/10 rounded-xl text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
                <h3 className="text-xl font-black text-readable mb-1">{cat.name}</h3>
                <div className="mt-6 pt-4 border-t flex justify-between items-center"><button onClick={() => setSelectedCategory(cat)} className="text-xs font-black text-primary hover:underline flex items-center gap-1"><FileText className="w-3 h-3" /> كشف حركات</button><span className="text-[10px] font-bold text-zinc-400">{journal.filter(j => j.categoryId === cat.id).length} حركات</span></div>
             </div>
           ))}
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
           <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className={`p-4 rounded-3xl ${selectedCategory.type === 'مصروفات' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>{selectedCategory.type === 'مصروفات' ? <TrendingDown className="w-8 h-8" /> : <TrendingUp className="w-8 h-8" />}</div>
                 <div><h3 className="text-3xl font-black text-readable">{selectedCategory.name}</h3><p className="text-sm font-bold text-zinc-500">{selectedCategory.type}</p></div>
              </div>
              <div className="text-center"><span className="text-[10px] font-black text-zinc-500 uppercase">إجمالي الرصيد</span><div className={`text-4xl font-mono font-black ${selectedCategory.type === 'مصروفات' ? 'text-rose-500' : 'text-emerald-500'}`}>{categoryMovements.reduce((s,c) => s + (c.receivedSYP || c.paidSYP || 0), 0).toLocaleString()}</div></div>
           </div>
           <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border overflow-hidden shadow-xl">
              <table className="w-full text-right border-collapse text-sm">
                 <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase text-zinc-500 h-14 border-b">
                       <th className="p-4 border-l">التاريخ</th><th className="p-4 border-l">البيان</th><th className="p-4 text-center border-l">القيمة</th><th className="p-4">ملاحظات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y font-bold">
                    {categoryMovements.map(m => (
                       <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 h-14">
                          <td className="p-4 font-mono text-zinc-400 border-l">{m.date}</td><td className="p-4 text-readable border-l">{m.statement}</td><td className={`p-4 text-center border-l ${selectedCategory.type === 'مصروفات' ? 'text-rose-600' : 'text-emerald-600'}`}>{ (m.receivedSYP || m.paidSYP || 0).toLocaleString() }</td><td className="p-4 text-zinc-400 font-normal italic">{m.notes || '-'}</td>
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
