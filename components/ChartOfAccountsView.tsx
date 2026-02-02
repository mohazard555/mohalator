
import React, { useState, useEffect } from 'react';
import { 
  Folder, FolderPlus, FilePlus, ChevronRight, ChevronDown, 
  Search, Eye, Plus, Trash2, Edit2, X, Landmark, 
  ArrowLeftRight, Calculator, Calendar
} from 'lucide-react';
import { AccountNode, CashEntry, OpeningEntry, AppSettings } from '../types';

interface ChartOfAccountsViewProps {
  onBack?: () => void;
}

const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({ onBack }) => {
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<AccountNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [formData, setFormData] = useState<Partial<AccountNode>>({
    name: '', code: '', type: 'ACCOUNT', reportType: 'الميزانية', parentId: null
  });

  // البيانات الافتراضية بناءً على الصور
  const defaultAccounts: AccountNode[] = [
    { id: '1', code: '1', name: 'الموجودات', parentId: null, type: 'FOLDER', reportType: 'الميزانية' },
    { id: '12', code: '12', name: 'الموجودات المتداولة', parentId: '1', type: 'FOLDER', reportType: 'الميزانية' },
    { id: '121', code: '121', name: 'الزبائن', parentId: '12', type: 'FOLDER', reportType: 'الميزانية' },
    { id: '121001', code: '121001', name: 'زبون رقم 1', parentId: '121', type: 'ACCOUNT', reportType: 'الميزانية' },
    { id: '122', code: '122', name: 'مدينون مختلفون', parentId: '12', type: 'ACCOUNT', reportType: 'الميزانية' },
    { id: '123', code: '123', name: 'مسحوبات الشركاء', parentId: '12', type: 'FOLDER', reportType: 'الميزانية' },
    { id: '124', code: '124', name: 'المخزون', parentId: '12', type: 'FOLDER', reportType: 'الميزانية' },
    { id: '13', code: '13', name: 'الأموال الجاهزة', parentId: '1', type: 'FOLDER', reportType: 'الميزانية' },
    { id: '131', code: '131', name: 'الصندوق', parentId: '13', type: 'ACCOUNT', reportType: 'الميزانية' },
    
    { id: '2', code: '2', name: 'المطاليب', parentId: null, type: 'FOLDER', reportType: 'الميزانية' },
    { id: '21', code: '21', name: 'المطاليب الثابتة', parentId: '2', type: 'FOLDER', reportType: 'الميزانية' },
    { id: '211', code: '211', name: 'رأس المال', parentId: '21', type: 'FOLDER', reportType: 'الميزانية' },
    
    { id: '3', code: '3', name: 'صافي المشتريات', parentId: null, type: 'FOLDER', reportType: 'المتاجرة' },
    { id: '31', code: '31', name: 'المشتريات', parentId: '3', type: 'ACCOUNT', reportType: 'المتاجرة' },
    
    { id: '4', code: '4', name: 'صافي المبيعات', parentId: null, type: 'FOLDER', reportType: 'المتاجرة' },
    { id: '41', code: '41', name: 'المبيعات', parentId: '4', type: 'ACCOUNT', reportType: 'المتاجرة' },
    
    { id: '5', code: '5', name: 'المصاريف', parentId: null, type: 'FOLDER', reportType: 'الأرباح والخسائر' },
    { id: '501', code: '501', name: 'رواتب واجور', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
    { id: '502', code: '502', name: 'كهرباء وماء', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
  ];

  useEffect(() => {
    const savedAccounts = localStorage.getItem('sheno_chart_accounts');
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    } else {
      setAccounts(defaultAccounts);
      localStorage.setItem('sheno_chart_accounts', JSON.stringify(defaultAccounts));
    }

    const sJou = localStorage.getItem('sheno_cash_journal');
    const sOp = localStorage.getItem('sheno_opening_entries');
    const sSett = localStorage.getItem('sheno_settings');

    if (sJou) setJournal(JSON.parse(sJou));
    if (sOp) setOpeningEntries(JSON.parse(sOp));
    if (sSett) setSettings(JSON.parse(sSett));
  }, []);

  const toggleNode = (id: string) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedNodes(newSet);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) return;
    
    let updated: AccountNode[];
    if (modalMode === 'EDIT' && selectedAccount) {
      updated = accounts.map(a => a.id === selectedAccount.id ? { ...a, ...formData } as AccountNode : a);
    } else {
      const newNode = { ...formData, id: crypto.randomUUID() } as AccountNode;
      updated = [...accounts, newNode];
    }

    setAccounts(updated);
    localStorage.setItem('sheno_chart_accounts', JSON.stringify(updated));
    setIsModalOpen(false);
    setFormData({ name: '', code: '', type: 'ACCOUNT', reportType: 'الميزانية', parentId: null });
  };

  const calculateBalance = (account: AccountNode) => {
    // حساب الرصيد من القيود الافتتاحية
    const opDebit = openingEntries.filter(e => e.accountName === account.name).reduce((s, c) => s + c.debit, 0);
    const opCredit = openingEntries.filter(e => e.accountName === account.name).reduce((s, c) => s + c.credit, 0);
    
    // حساب الرصيد من دفتر اليومية
    const jouDebit = journal.filter(j => j.partyName === account.name || j.statement.includes(account.name)).reduce((s, c) => s + (c.receivedSYP + c.receivedUSD), 0);
    const jouCredit = journal.filter(j => j.partyName === account.name || j.statement.includes(account.name)).reduce((s, c) => s + (c.paidSYP + c.paidUSD), 0);

    return (opDebit + jouDebit) - (opCredit + jouCredit);
  };

  const renderTree = (parentId: string | null = null, level: number = 0) => {
    return accounts
      .filter(a => a.parentId === parentId)
      .sort((a, b) => a.code.localeCompare(b.code))
      .map(node => {
        const isExpanded = expandedNodes.has(node.id);
        const children = accounts.filter(a => a.parentId === node.id);
        const hasChildren = children.length > 0;
        const balance = calculateBalance(node);

        return (
          <div key={node.id} className="select-none">
            <div 
              className={`flex items-center py-2 px-3 rounded-xl transition-all cursor-pointer group ${selectedAccount?.id === node.id ? 'bg-primary/10 border-primary/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              onClick={() => setSelectedAccount(node)}
            >
              <div style={{ width: `${level * 24}px` }}></div>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                className="p-1 text-zinc-400 hover:text-zinc-600"
              >
                {node.type === 'FOLDER' ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <div className="w-4" />}
              </button>
              
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                {node.type === 'FOLDER' ? <Folder className="w-5 h-5 text-amber-500 shrink-0" /> : <Landmark className="w-4 h-4 text-primary shrink-0 opacity-40" />}
                <div className="flex items-center gap-2 truncate">
                   <span className="font-mono text-zinc-400 text-xs">{node.code}-</span>
                   <span className="font-black text-readable truncate">{node.name}</span>
                   <span className="text-[10px] font-black text-rose-600 shrink-0">-{node.reportType}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, parentId: node.id }); setIsModalOpen(true); setModalMode('ADD'); }} className="p-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-zinc-500 hover:text-primary transition-all" title="إضافة فرعي"><Plus className="w-3.5 h-3.5"/></button>
                 <button onClick={(e) => { e.stopPropagation(); setModalMode('EDIT'); setFormData(node); setSelectedAccount(node); setIsModalOpen(true); }} className="p-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-zinc-500 hover:text-amber-500 transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                 {balance === 0 && !hasChildren && (
                   <button onClick={(e) => { e.stopPropagation(); if(window.confirm('حذف الحساب؟')) { setAccounts(accounts.filter(x => x.id !== node.id)); } }} className="p-1.5 bg-rose-500/10 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                 )}
              </div>
            </div>
            {isExpanded && node.type === 'FOLDER' && (
              <div className="border-r-2 border-zinc-100 dark:border-zinc-800 mr-4">
                {renderTree(node.id, level + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* الجانب الأيمن: شجرة الحسابات */}
      <div className="lg:col-span-5 bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-[750px]">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-xl font-black text-readable flex items-center gap-2">
             <Landmark className="w-6 h-6 text-primary" /> دليل الحسابات الشجري
           </h3>
           <button onClick={() => { setModalMode('ADD'); setFormData({ name: '', code: '', type: 'FOLDER', reportType: 'الميزانية', parentId: null }); setIsModalOpen(true); }} className="p-2 bg-primary text-white rounded-xl shadow-lg hover:scale-105 transition-all">
              <FolderPlus className="w-5 h-5" />
           </button>
        </div>

        <div className="relative mb-4">
           <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
           <input 
             type="text" 
             placeholder="بحث في الدليل..." 
             className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 pr-10 rounded-2xl font-bold outline-none focus:border-primary transition-all shadow-inner text-sm"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
           {renderTree(null, 0)}
        </div>
      </div>

      {/* الجانب الأيسر: تفاصيل الحساب المختار */}
      <div className="lg:col-span-7 space-y-6">
         {selectedAccount ? (
           <div className="space-y-6 animate-in slide-in-from-left-4">
              <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
                 <div className="flex justify-between items-start relative z-10">
                    <div>
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">تفاصيل الحساب المختار</span>
                       <h2 className="text-3xl font-black text-readable italic">{selectedAccount.name}</h2>
                       <div className="flex items-center gap-3 mt-2">
                          <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-mono font-black border dark:border-zinc-700">CODE: {selectedAccount.code}</span>
                          <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-black border border-rose-500/20">{selectedAccount.reportType}</span>
                       </div>
                    </div>
                    <div className="text-left">
                       <span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">الرصيد الجاري</span>
                       <div className={`text-4xl font-mono font-black ${calculateBalance(selectedAccount) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {calculateBalance(selectedAccount).toLocaleString()}
                       </div>
                       <span className="text-[10px] font-bold text-zinc-400 uppercase">{settings?.currencySymbol}</span>
                    </div>
                 </div>
              </div>

              <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl">
                 <div className="flex items-center justify-between mb-6 border-b dark:border-zinc-800 pb-4">
                    <h4 className="font-black text-readable flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-primary" /> حركة الحساب التفصيلية</h4>
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold">
                       <Calendar className="w-4 h-4" /> آخر حركة: {journal.filter(j => j.partyName === selectedAccount.name).sort((a,b) => b.date.localeCompare(a.date))[0]?.date || '---'}
                    </div>
                 </div>
                 
                 <div className="overflow-x-auto rounded-2xl border dark:border-zinc-800 h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-right border-collapse text-sm">
                       <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-900 text-[10px] font-black uppercase text-zinc-400 sticky top-0 z-10 h-12 border-b dark:border-zinc-800">
                             <th className="p-4">التاريخ</th>
                             <th className="p-4">البيان الرسمي</th>
                             <th className="p-4 text-center">مدين (+)</th>
                             <th className="p-4 text-center">دائن (-)</th>
                             <th className="p-4 text-center">المرجع</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y dark:divide-zinc-800 font-bold">
                          {journal.filter(j => j.partyName === selectedAccount.name || j.statement.includes(selectedAccount.name)).map(move => (
                             <tr key={move.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                <td className="p-4 font-mono text-zinc-400">{move.date}</td>
                                <td className="p-4 text-readable">{move.statement}</td>
                                <td className="p-4 text-center font-mono text-emerald-600">{(move.receivedSYP + move.receivedUSD) > 0 ? (move.receivedSYP + move.receivedUSD).toLocaleString() : '-'}</td>
                                <td className="p-4 text-center font-mono text-rose-500">{(move.paidSYP + move.paidUSD) > 0 ? (move.paidSYP + move.paidUSD).toLocaleString() : '-'}</td>
                                <td className="p-4 text-center font-mono text-[10px] text-zinc-400">#{move.voucherNumber || move.id.slice(0,4)}</td>
                             </tr>
                          ))}
                          {journal.filter(j => j.partyName === selectedAccount.name).length === 0 && (
                            <tr><td colSpan={5} className="p-20 text-center text-zinc-300 italic">لا توجد حركات مسجلة لهذا الحساب حالياً</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
         ) : (
           <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-[3rem] h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center animate-pulse">
              <Landmark className="w-20 h-20 text-zinc-200 dark:text-zinc-800 mb-6" />
              <h3 className="text-2xl font-black text-zinc-400">يرجى اختيار حساب من الدليل</h3>
              <p className="text-zinc-400 font-bold mt-2 max-w-sm text-sm">بمجرد النقر على أي حساب من القائمة اليمنى، ستظهر هنا كآفة الأرصدة والحركات والتقارير المرتبطة به.</p>
           </div>
         )}
      </div>

      {/* Modal إضافة/تعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8 animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-8 border-b dark:border-zinc-800 pb-4">
                 <h3 className="text-xl font-black text-readable">{modalMode === 'EDIT' ? 'تعديل بيانات حساب' : 'إضافة حساب جديد بالدليل'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-rose-500"><X className="w-6 h-6"/></button>
              </div>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-500 uppercase mr-2">كود الحساب</label>
                       <input type="text" className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-mono font-black" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="مثلاً: 121001" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-500 uppercase mr-2">نوع الحساب</label>
                       <select className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                          <option value="FOLDER">مجلد (رئيسي)</option>
                          <option value="ACCOUNT">حساب (فرعي/حركة)</option>
                       </select>
                    </div>
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase mr-2">اسم الحساب</label>
                    <input type="text" className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-black" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="اسم الحساب..." />
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase mr-2">توجيه التقرير الختامي</label>
                    <select className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-bold" value={formData.reportType} onChange={e => setFormData({...formData, reportType: e.target.value as any})}>
                       <option value="الميزانية">الميزانية العمومية</option>
                       <option value="المتاجرة">حساب المتاجرة</option>
                       <option value="الأرباح والخسائر">قائمة الأرباح والخسائر</option>
                    </select>
                 </div>
                 <button onClick={handleSave} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all text-lg mt-4">تثبيت البيانات بالدليل</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccountsView;
