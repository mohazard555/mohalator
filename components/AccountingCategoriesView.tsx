
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Save, X, Tags, TrendingDown, TrendingUp, Search, Calendar, FileText, Printer, FileDown, FileSpreadsheet } from 'lucide-react';
import { AccountingCategory, CashEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

interface AccountingCategoriesViewProps {
  onBack: () => void;
}

const AccountingCategoriesView: React.FC<AccountingCategoriesViewProps> = ({ onBack }) => {
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Detail View State
  const [selectedCategory, setSelectedCategory] = useState<AccountingCategory | null>(null);

  const [formData, setFormData] = useState<Partial<AccountingCategory>>({
    name: '',
    type: 'مصروفات',
    notes: ''
  });

  useEffect(() => {
    const savedCats = localStorage.getItem('sheno_accounting_categories');
    const savedJournal = localStorage.getItem('sheno_cash_journal');
    const savedSettings = localStorage.getItem('sheno_settings');
    
    if (savedCats) setCategories(JSON.parse(savedCats));
    if (savedJournal) setJournal(JSON.parse(savedJournal));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const handleSave = () => {
    if (!formData.name) return;
    
    let updated: AccountingCategory[];
    if (editingId) {
      updated = categories.map(c => c.id === editingId ? { ...c, ...formData } as AccountingCategory : c);
    } else {
      updated = [{ ...formData, id: crypto.randomUUID() } as AccountingCategory, ...categories];
    }

    setCategories(updated);
    localStorage.setItem('sheno_accounting_categories', JSON.stringify(updated));
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', type: 'مصروفات', notes: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟ الحركات المرتبطة به ستبقى ولكن بدون تصنيف.')) {
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      localStorage.setItem('sheno_accounting_categories', JSON.stringify(updated));
    }
  };

  // Get Movements for selected category
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
      {/* Professional Print Header */}
      <div className="print-only print-header flex justify-between items-center bg-zinc-900 p-6 rounded-t-xl text-white mb-0 border-b-4 border-primary">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
          <div>
            <h1 className="text-2xl font-black">{settings?.companyName}</h1>
            <p className="text-xs opacity-80">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black underline decoration-white/30 underline-offset-8">
            {selectedCategory ? `كشف حركات: ${selectedCategory.name}` : 'دليل بنود المصاريف والإيرادات'}
          </h2>
          <p className="text-xs mt-2 opacity-80 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3"/> تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}
          </p>
        </div>
        <div className="text-left text-xs font-bold space-y-1">
          <p>{settings?.address}</p>
          <p>{settings?.phone}</p>
        </div>
      </div>

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
              <button 
                onClick={() => exportToCSV(categories, 'accounting_categories')}
                className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 hover:bg-zinc-700 transition-all"
              >
                <FileDown className="w-5 h-5" /> تصدير XLSX
              </button>
              <button 
                onClick={() => window.print()}
                className="bg-zinc-100 dark:bg-zinc-800 text-readable border border-zinc-200 dark:border-zinc-700 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2"
              >
                <Printer className="w-5 h-5" /> طباعة القائمة
              </button>
              <button 
                onClick={() => setIsAdding(true)} 
                className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" /> إضافة قسم جديد
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={handleExportCategoryExcel}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 hover:brightness-110 shadow-lg transition-all"
              >
                <FileSpreadsheet className="w-5 h-5" /> تصدير كشف القسم (Excel)
              </button>
              <button 
                onClick={() => setSelectedCategory(null)} 
                className="bg-zinc-800 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2"
              >
                <ArrowRight className="w-5 h-5" /> العودة للقائمة
              </button>
            </div>
          )}
        </div>
      </div>

      {!selectedCategory ? (
        <>
          {(isAdding || editingId) && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95 no-print">
               <h3 className="text-lg font-black text-readable border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                 <Tags className="w-5 h-5 text-primary" /> تعريف بند / قسم محاسبي جديد
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1">
                     <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">اسم البند (مثلاً: رواتب موظفين)</label>
                     <input 
                       type="text" 
                       className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" 
                       value={formData.name} 
                       onChange={e => setFormData({...formData, name: e.target.value})} 
                     />
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">نوع البند</label>
                     <select 
                       className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" 
                       value={formData.type} 
                       onChange={e => setFormData({...formData, type: e.target.value as any})}
                     >
                        <option value="مصروفات">بند مصروفات</option>
                        <option value="إيرادات">بند إيرادات</option>
                     </select>
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">ملاحظات</label>
                     <input 
                       type="text" 
                       className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" 
                       value={formData.notes} 
                       onChange={e => setFormData({...formData, notes: e.target.value})} 
                     />
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
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cat.type === 'مصروفات' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {cat.type}
                  </span>
                  
                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <button 
                      onClick={() => setSelectedCategory(cat)}
                      className="text-xs font-black text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" /> عرض حركات البند
                    </button>
                    <span className="text-[10px] font-bold text-zinc-400">
                      {journal.filter(j => j.categoryId === cat.id).length} حركات مسجلة
                    </span>
                  </div>
               </div>
             ))}
             {categories.length === 0 && !isAdding && (
               <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
                  <Tags className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
                  <p className="text-zinc-500 font-bold">لا يوجد أقسام معرفة حالياً، ابدأ بإضافة بنود المصاريف والإيرادات.</p>
               </div>
             )}
          </div>

          {/* Table for printing the categories list */}
          <div className="print-only">
             <table className="w-full text-right border-collapse text-sm">
                <thead>
                   <tr className="bg-zinc-100 font-black text-xs border-y-2 border-zinc-800 h-12">
                      <th className="p-3 border">م</th>
                      <th className="p-3 border">اسم البند المحاسبي</th>
                      <th className="p-3 border text-center">النوع</th>
                      <th className="p-3 border">ملاحظات</th>
                      <th className="p-3 border text-center">عدد الحركات</th>
                   </tr>
                </thead>
                <tbody className="text-sm font-bold">
                   {categories.map((cat, idx) => (
                      <tr key={cat.id} className="h-10">
                         <td className="p-3 border text-center font-mono">{idx + 1}</td>
                         <td className="p-3 border">{cat.name}</td>
                         <td className="p-3 border text-center">{cat.type}</td>
                         <td className="p-3 border font-normal italic">{cat.notes || '-'}</td>
                         <td className="p-3 border text-center font-mono">
                            {journal.filter(j => j.categoryId === cat.id).length}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
           {/* Detailed Category View */}
           <div className={`bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden print:border-zinc-300 print:shadow-none print:rounded-2xl`}>
              <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 ${selectedCategory.type === 'مصروفات' ? 'bg-rose-500' : 'bg-emerald-500'} no-print`}></div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-3xl ${selectedCategory.type === 'مصروفات' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'} no-print`}>
                       {selectedCategory.type === 'مصروفات' ? <TrendingDown className="w-8 h-8" /> : <TrendingUp className="w-8 h-8" />}
                    </div>
                    <div>
                       <h3 className="text-3xl font-black text-readable">{selectedCategory.name}</h3>
                       <p className="text-sm font-bold text-zinc-500">{selectedCategory.type} - كشف حركات القسم</p>
                    </div>
                 </div>
                 <div className="flex gap-8">
                    <div className="text-center">
                       <span className="text-[10px] font-black text-zinc-500 uppercase">إجمالي الرصيد ({settings?.currencySymbol})</span>
                       <div className={`text-3xl font-mono font-black ${totalPrimary >= 0 ? 'text-emerald-500' : 'text-rose-500'} print:text-black`}>
                          {totalPrimary.toLocaleString()}
                       </div>
                    </div>
                    <div className="text-center">
                       <span className="text-[10px] font-black text-zinc-500 uppercase">إجمالي الرصيد ($)</span>
                       <div className={`text-3xl font-mono font-black ${totalSecondary >= 0 ? 'text-emerald-500' : 'text-rose-500'} print:text-black`}>
                          {totalSecondary.toLocaleString()}
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl print:border-zinc-300 print:shadow-none print:rounded-none">
              <table className="w-full text-right border-collapse text-sm">
                 <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800/50 text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b h-14 print:bg-zinc-50 print:text-zinc-900">
                       <th className="p-4 border-l print:border-zinc-300">التاريخ</th>
                       <th className="p-4 border-l print:border-zinc-300">البيان</th>
                       <th className="p-4 text-center border-l print:border-zinc-300">مقبوض (ل.س)</th>
                       <th className="p-4 text-center border-l print:border-zinc-300">مدفوع (ل.س)</th>
                       <th className="p-4 text-center border-l print:border-zinc-300">مقبوض ($)</th>
                       <th className="p-4 text-center border-l print:border-zinc-300">مدفوع ($)</th>
                       <th className="p-4">ملاحظات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y font-bold print:divide-zinc-200">
                    {categoryMovements.map(m => (
                       <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors h-14">
                          <td className="p-4 font-mono text-zinc-400 border-l print:border-zinc-300 print:text-black">{m.date}</td>
                          <td className="p-4 text-readable border-l print:border-zinc-300">{m.statement}</td>
                          <td className="p-4 text-center text-emerald-600 font-mono border-l print:border-zinc-300 print:text-emerald-700">{m.receivedSYP > 0 ? m.receivedSYP.toLocaleString() : '-'}</td>
                          <td className="p-4 text-center text-rose-600 font-mono border-l print:border-zinc-300 print:text-rose-700">{m.paidSYP > 0 ? m.paidSYP.toLocaleString() : '-'}</td>
                          <td className="p-4 text-center text-amber-600 font-mono border-l print:border-zinc-300 print:text-amber-700">{m.receivedUSD > 0 ? m.receivedUSD.toLocaleString() : '-'}</td>
                          <td className="p-4 text-center text-zinc-500 font-mono border-l print:border-zinc-300 print:text-black">{m.paidUSD > 0 ? m.paidUSD.toLocaleString() : '-'}</td>
                          <td className="p-4 text-zinc-400 font-normal italic print:text-zinc-600">{m.notes || '-'}</td>
                       </tr>
                    ))}
                    {categoryMovements.length === 0 && (
                       <tr><td colSpan={7} className="p-20 text-center italic text-zinc-400 font-bold">لا يوجد حركات مسجلة لهذا القسم حالياً.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
           
           <div className="flex justify-center no-print pb-10 gap-4">
              <button 
                onClick={handleExportCategoryExcel}
                className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
              >
                 <FileSpreadsheet className="w-5 h-5" /> تصدير حركات القسم Excel
              </button>
              <button 
                onClick={() => window.print()} 
                className="bg-zinc-900 text-white px-12 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
              >
                 <Printer className="w-5 h-5" /> طباعة كشف حركات البند
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AccountingCategoriesView;
