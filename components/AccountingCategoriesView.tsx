
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Save, X, Tags, TrendingDown, TrendingUp, Search, Calendar, FileText, Printer, FileDown, FileSpreadsheet, ImageIcon, Landmark, ChevronDown, Calculator, Building2, MapPin, Phone, Check } from 'lucide-react';
import { AccountingCategory, CashEntry, AppSettings, AccountNode } from '../types';
import { exportToCSV } from '../utils/export';
import { ImageExportService } from '../utils/ImageExportService';
import { loadChartAccounts } from '../utils/accountUtils';

interface AccountingCategoriesViewProps {
  onBack: () => void;
}

const AccountingCategoriesView: React.FC<AccountingCategoriesViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [chartAccounts, setChartAccounts] = useState<AccountNode[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<AccountingCategory | null>(null);

  // حالات البحث عن حساب من الدليل
  const [chartSearch, setChartSearch] = useState('');
  const [showChartResults, setShowChartResults] = useState(false);

  const [formData, setFormData] = useState<Partial<AccountingCategory>>({
    name: '',
    accountCode: '',
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
    
    if (savedCats) setCategories(JSON.parse(savedCats));
    if (savedJournal) setJournal(JSON.parse(savedJournal));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    
    setChartAccounts(loadChartAccounts());
  };

  const handleSelectChartAccount = (acc: AccountNode) => {
    setFormData({
      ...formData,
      name: acc.name,
      accountCode: acc.code,
      linkedAccountId: acc.id,
      type: acc.parentId === '5' ? 'مصروفات' : acc.parentId === '4' ? 'إيرادات' : (formData.type as any)
    });
    setChartSearch(acc.name);
    setShowChartResults(false);
  };

  const syncToChart = (category: AccountingCategory, isDelete: boolean = false, oldName?: string) => {
    const savedChart = localStorage.getItem('sheno_chart_accounts');
    if (!savedChart) return;
    
    let chart: AccountNode[] = JSON.parse(savedChart);
    const parentId = category.type === 'مصروفات' ? '5' : '6'; // استخدام مجلد الإيرادات الأخرى

    if (isDelete) {
      chart = chart.filter(acc => acc.name !== category.name);
    } else {
      const searchName = oldName || category.name;
      const existingIdx = chart.findIndex(acc => acc.id === category.linkedAccountId || acc.name === searchName);
      const node: AccountNode = {
        id: (existingIdx > -1) ? chart[existingIdx].id : (category.linkedAccountId || crypto.randomUUID()),
        code: category.accountCode || `CAT-${Math.floor(Math.random() * 1000)}`,
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
    let oldName = undefined;

    if (editingId) {
      const oldCat = categories.find(c => c.id === editingId);
      oldName = oldCat?.name;
      updated = categories.map(c => c.id === editingId ? categoryToSave : c);
    } else {
      updated = [categoryToSave, ...categories];
    }

    setCategories(updated);
    localStorage.setItem('sheno_accounting_categories', JSON.stringify(updated));
    syncToChart(categoryToSave, false, oldName);
    
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', accountCode: '', type: 'مصروفات', notes: '', linkedAccountId: '' });
    setChartSearch('');
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

  const filteredChartAccounts = chartAccounts.filter(acc => 
    acc.type === 'ACCOUNT' && (
      acc.name.toLowerCase().includes(chartSearch.toLowerCase()) || 
      acc.code.toLowerCase().includes(chartSearch.toLowerCase())
    )
  );

  const categoryMovements = selectedCategory 
    ? journal.filter(j => j.categoryId === selectedCategory.id)
    : [];

  const handleExportMainExcel = () => {
    const data = categories.map(c => ({
      'اسم البند': c.name,
      'كود الحساب': c.accountCode || '-',
      'النوع': c.type,
      'عدد الحركات': journal.filter(j => j.categoryId === c.id).length,
      'ملاحظات': c.notes || '-'
    }));
    exportToCSV(data, 'accounting_categories');
  };

  const handleExportMovementExcel = () => {
    if (!selectedCategory) return;
    const data = categoryMovements.map(m => ({
      'التاريخ': m.date,
      'البيان': m.statement,
      'القيمة': (m.receivedSYP || m.paidSYP || 0),
      'ملاحظات': m.notes || '-'
    }));
    exportToCSV(data, `movements_${selectedCategory.name}`);
  };

  const handleExportImage = async () => {
    if (!reportRef.current || isProcessing) return;
    setIsProcessing(true);
    try {
      await ImageExportService.exportAsPng(
        reportRef.current,
        `accounting_${selectedCategory ? selectedCategory.name : 'categories'}_${new Date().getTime()}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all shadow-sm">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-readable leading-tight">إدارة البنود والأقسام المحاسبية</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">تصنيف المصاريف والإيرادات التشغيلية</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedCategory ? (
             <>
               <button onClick={handleExportMovementExcel} className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-emerald-500">
                  <FileSpreadsheet className="w-5 h-5" /> تصدير Excel
               </button>
               <button onClick={handleExportImage} disabled={isProcessing} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
                  {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ImageIcon className="w-5 h-5" />} حفظ كصورة
               </button>
               <button onClick={() => window.print()} className="bg-zinc-900 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
                  <Printer className="w-5 h-5" /> طباعة الكشف
               </button>
               <button onClick={() => setSelectedCategory(null)} className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2">
                  <ArrowRight className="w-5 h-5" /> رجوع للقائمة
               </button>
             </>
          ) : (
             <>
               <button onClick={handleExportMainExcel} className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
                  <FileSpreadsheet className="w-5 h-5" /> تصدير الأقسام
               </button>
               <button onClick={handleExportImage} disabled={isProcessing} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
                  {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ImageIcon className="w-5 h-5" />} حفظ كصورة
               </button>
               <button onClick={() => window.print()} className="bg-zinc-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
                  <Printer className="w-5 h-5" /> طباعة الكل
               </button>
               <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: '', accountCode: '', type: 'مصروفات', notes: '', linkedAccountId: '' }); setChartSearch(''); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all">
                  <Plus className="w-5 h-5" /> إضافة قسم جديد
               </button>
             </>
          )}
        </div>
      </div>

      <div ref={reportRef} className="space-y-6 export-fix">
        <div className="hidden print:flex flex-row justify-between items-start mb-6 border-b-4 border-primary pb-6 bg-white text-zinc-900 mx-4">
          <div className="flex items-center gap-4">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="w-20 h-20 object-contain bg-white rounded-xl p-1 shadow-sm border" alt="Logo" />
            ) : (
               <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">SH</div>
            )}
            <div>
              <h1 className="text-3xl font-black text-primary leading-none">{settings?.companyName || 'SAMLATOR SYSTEM'}</h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{settings?.companyType}</p>
            </div>
          </div>
          <div className="text-center pt-2">
            <h2 className="text-3xl font-black text-zinc-900 underline decoration-primary/20 underline-offset-8">
               {selectedCategory ? `كشف حركات قسم: ${selectedCategory.name}` : 'سجل البنود والأقسام المحاسبية'}
            </h2>
            <p className="text-[10px] mt-4 font-bold text-zinc-400 uppercase tracking-widest">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>
          <div className="text-left space-y-1 pt-2">
             <div className="flex items-center justify-end gap-2 text-zinc-500 text-xs font-bold">
                <span>{settings?.address}</span>
                <MapPin className="w-3 h-3 text-primary" />
             </div>
             <div className="flex items-center justify-end gap-2 text-zinc-500 text-xs font-bold" dir="ltr">
                <span>{settings?.phone}</span>
                <Phone className="w-3 h-3 text-primary" />
             </div>
          </div>
        </div>

        {!selectedCategory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(isAdding || editingId) && (
              <div className="col-span-full bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 mb-6 no-print animate-in zoom-in-95">
                 <h3 className="text-lg font-black text-readable flex items-center gap-2">
                    <Tags className="w-5 h-5 text-primary" /> {editingId ? 'تعديل بيانات القسم' : 'تعريف بند جديد ومزامنته مع الدليل'}
                 </h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1 relative">
                       <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">ابحث في الدليل (اختياري)</label>
                       <div className="relative">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input 
                             type="text" 
                             placeholder="بحث باسم حساب..." 
                             className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 text-readable p-3 pr-10 rounded-2xl font-bold outline-none w-full focus:border-primary transition-all text-xs"
                             value={chartSearch}
                             onFocus={() => setShowChartResults(true)}
                             onChange={(e) => { setChartSearch(e.target.value); setShowChartResults(true); }}
                          />
                          {showChartResults && chartSearch.length > 0 && (
                             <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto">
                                {filteredChartAccounts.length === 0 ? (
                                   <div className="p-3 text-center text-[10px] text-zinc-400 italic">لا يوجد حساب مطابق</div>
                                ) : (
                                   filteredChartAccounts.map(acc => (
                                      <div 
                                         key={acc.id} 
                                         onClick={() => handleSelectChartAccount(acc)}
                                         className="p-3 border-b dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer flex justify-between items-center group transition-colors"
                                      >
                                         <div className="flex flex-col text-right">
                                            <span className="font-bold text-xs group-hover:text-primary">{acc.name}</span>
                                            <span className="text-[8px] text-zinc-400 font-mono">#{acc.code}</span>
                                         </div>
                                         <Check className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100" />
                                      </div>
                                   ))
                                )}
                             </div>
                          )}
                       </div>
                    </div>

                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">اسم البند</label>
                       <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border dark:border-zinc-700 font-bold outline-none focus:border-primary text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>

                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">كود الحساب</label>
                       <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border dark:border-zinc-700 font-mono font-black outline-none focus:border-primary text-sm" value={formData.accountCode} onChange={e => setFormData({...formData, accountCode: e.target.value})} placeholder="CODE-001" />
                    </div>

                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">نوع البند</label>
                       <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border dark:border-zinc-700 font-bold outline-none text-sm" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                          <option value="مصروفات">بند مصروفات</option>
                          <option value="إيرادات">بند إيرادات</option>
                       </select>
                    </div>
                 </div>

                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">ملاحظات إضافية</label>
                    <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border dark:border-zinc-700 font-bold outline-none focus:border-primary text-sm" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                 </div>

                 <div className="flex justify-end gap-3 pt-4 border-t dark:border-zinc-800">
                    <button onClick={handleSave} className="bg-primary text-white px-10 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">حفظ ومزامنة مع الدليل</button>
                    <button onClick={() => { setIsAdding(false); setEditingId(null); setChartSearch(''); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-8 py-3 rounded-2xl font-bold">إلغاء</button>
                 </div>
              </div>
            )}

            {categories.map(cat => (
               <div key={cat.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cat.type === 'مصروفات' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                  <div className="flex justify-between items-start mb-4">
                     <div className={`p-3 rounded-2xl ${cat.type === 'مصروفات' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {cat.type === 'مصروفات' ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                     </div>
                     <div className="flex gap-1 no-print">
                        <button onClick={() => { setEditingId(cat.id); setFormData(cat); setIsAdding(true); setChartSearch(cat.name); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(cat.id)} className="p-2 hover:bg-rose-500/10 rounded-xl text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </div>
                  <div className="flex-1">
                     <h3 className="text-xl font-black text-readable mb-1 leading-tight">{cat.name}</h3>
                     <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-mono font-black text-zinc-400">#{cat.accountCode || 'N/A'}</span>
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${cat.type === 'مصروفات' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                           {cat.type}
                        </span>
                     </div>
                  </div>
                  <div className="mt-6 pt-4 border-t dark:border-zinc-800 flex justify-between items-center">
                     <button onClick={() => setSelectedCategory(cat)} className="text-xs font-black text-primary hover:underline flex items-center gap-1 no-print">
                        <FileText className="w-3 h-3" /> عرض كشف حركات
                     </button>
                     <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3"/> {journal.filter(j => j.categoryId === cat.id).length} حركة مسجلة
                     </span>
                  </div>
               </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
             <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                   <div className={`p-5 rounded-[2rem] shadow-xl ${selectedCategory.type === 'مصروفات' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {selectedCategory.type === 'مصروفات' ? <TrendingDown className="w-10 h-10" /> : <TrendingUp className="w-10 h-10" />}
                   </div>
                   <div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1 block">كشف حركات القسم</span>
                      <h3 className="text-4xl font-black text-readable italic">{selectedCategory.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs font-mono font-black text-zinc-400">كود: {selectedCategory.accountCode || '---'}</span>
                         <span className="text-zinc-300">|</span>
                         <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{selectedCategory.type}</p>
                      </div>
                   </div>
                </div>
                <div className="flex flex-col items-center md:items-end bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border dark:border-zinc-700 min-w-[240px]">
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">إجمالي رصيد البند المالي</span>
                   <div className={`text-5xl font-mono font-black ${selectedCategory.type === 'مصروفات' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {categoryMovements.reduce((s,c) => s + (c.receivedSYP || c.paidSYP || 0), 0).toLocaleString()}
                   </div>
                   <span className="text-[9px] font-bold text-zinc-400 mt-1 uppercase">{settings?.currencySymbol}</span>
                </div>
             </div>

             <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border dark:border-zinc-800 overflow-hidden shadow-2xl print:border-zinc-200">
                <div className="overflow-x-auto">
                   <table className="w-full text-right border-collapse text-sm">
                      <thead>
                         <tr className="bg-zinc-900 text-white font-black text-[10px] uppercase tracking-widest h-14 border-b dark:border-zinc-800 print:bg-zinc-100 print:text-black">
                            <th className="p-4 border-l border-zinc-800 print:border-zinc-200">التاريخ</th>
                            <th className="p-4 border-l border-zinc-800 print:border-zinc-200">البيان الرسمي للعملية</th>
                            <th className="p-4 text-center border-l border-zinc-800 print:border-zinc-200 bg-zinc-800/50">القيمة المسجلة</th>
                            <th className="p-4 border-l border-zinc-800 print:border-zinc-200">المرجع</th>
                            <th className="p-4">ملاحظات</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-zinc-800 font-bold print:text-zinc-900">
                         {categoryMovements.length === 0 ? (
                            <tr><td colSpan={5} className="p-32 text-center italic text-zinc-400 font-black text-xl">لا توجد حركات مالية مسجلة لهذا القسم حالياً</td></tr>
                         ) : (
                           categoryMovements.map(m => (
                              <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 h-16 transition-colors border-b dark:border-zinc-800/50">
                                 <td className="p-4 font-mono text-zinc-400 border-l dark:border-zinc-800 print:border-zinc-200">{m.date}</td>
                                 <td className="p-4 text-readable border-l dark:border-zinc-800 print:border-zinc-200">{m.statement}</td>
                                 <td className={`p-4 text-center border-l dark:border-zinc-800 print:border-zinc-200 text-2xl font-mono ${selectedCategory.type === 'مصروفات' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    { (m.receivedSYP || m.paidSYP || 0).toLocaleString() }
                                 </td>
                                 <td className="p-4 text-center font-mono text-[10px] text-zinc-400 uppercase border-l dark:border-zinc-800 print:border-zinc-200">
                                    {m.voucherNumber || '---'}
                                 </td>
                                 <td className="p-4 text-zinc-500 font-normal italic text-xs truncate max-w-[200px]">{m.notes || '-'}</td>
                              </tr>
                           ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
             
             <div className="hidden print:flex justify-between items-end mt-12 pt-8 border-t-2 border-zinc-100 text-[10px] font-black text-zinc-400 mx-4">
                <div className="flex flex-col gap-1">
                   <span>SAMLATOR SYSTEM | FINANCIAL LOGS TERMINAL</span>
                   <span>تاريخ استخراج هذا التقرير: {new Date().toLocaleString('ar-SA')}</span>
                </div>
                <div className="text-center">
                   <div className="w-48 border-b-2 border-zinc-200 mb-2 mx-auto"></div>
                   <span>توقيع المدير المالي / والختم الرسمي</span>
                </div>
                <div className="text-left italic opacity-50">
                   {settings?.companyName} Accounting Terminal v4.1
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingCategoriesView;
