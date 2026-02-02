
import React, { useState, useEffect } from 'react';
import { 
  Folder, FolderPlus, ChevronRight, ChevronDown, 
  Search, Plus, Trash2, Edit2, X, Landmark, 
  ArrowLeftRight, Calendar, Calculator, Info, FileText
} from 'lucide-react';
import { AccountNode, CashEntry, OpeningEntry, AppSettings, SalesInvoice, PurchaseInvoice, AccountingCategory, Party } from '../types';

interface ChartOfAccountsViewProps {
  onBack?: () => void;
}

const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({ onBack }) => {
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '2', '3', '4', '5', '121', '221']));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<AccountNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [formData, setFormData] = useState<Partial<AccountNode>>({
    name: '', code: '', type: 'ACCOUNT', reportType: 'الميزانية', parentId: null
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    const savedAccountsRaw = localStorage.getItem('sheno_chart_accounts');
    const sJou = localStorage.getItem('sheno_cash_journal');
    const sOp = localStorage.getItem('sheno_opening_entries');
    const sSal = localStorage.getItem('sheno_sales_invoices');
    const sPur = localStorage.getItem('sheno_purchases');
    const sCat = localStorage.getItem('sheno_accounting_categories');
    const sPar = localStorage.getItem('sheno_parties');
    const sSett = localStorage.getItem('sheno_settings');

    let savedAccounts: AccountNode[] = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : [];

    const defaultRoots: AccountNode[] = [
      { id: '1', code: '1', name: 'الأصول (الموجودات)', parentId: null, type: 'FOLDER', reportType: 'الميزانية' },
      { id: '121', code: '121', name: 'الزبائن (المدينون)', parentId: '1', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '2', code: '2', name: 'الخصوم (المطاليب)', parentId: null, type: 'FOLDER', reportType: 'الميزانية' },
      { id: '221', code: '221', name: 'الموردون (الدائنون)', parentId: '2', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '3', code: '3', name: 'حقوق الملكية', parentId: null, type: 'FOLDER', reportType: 'الميزانية' },
      { id: '4', code: '4', name: 'الإيرادات', parentId: null, type: 'FOLDER', reportType: 'الأرباح والخسائر' },
      { id: '5', code: '5', name: 'المصاريف', parentId: null, type: 'FOLDER', reportType: 'الأرباح والخسائر' }
    ];

    if (savedAccounts.length === 0) {
      savedAccounts = defaultRoots;
      localStorage.setItem('sheno_chart_accounts', JSON.stringify(savedAccounts));
    } else {
      defaultRoots.forEach(root => {
        if (!savedAccounts.some(acc => acc.id === root.id)) {
          savedAccounts.push(root);
        }
      });
    }

    setAccounts(savedAccounts);
    if (sJou) setJournal(JSON.parse(sJou));
    if (sOp) setOpeningEntries(JSON.parse(sOp));
    // Fix: replaced setAllSales with setSales to match state hook definition
    if (sSal) setSales(JSON.parse(sSal));
    // Fix: replaced setAllPurchases with setPurchases to match state hook definition
    if (sPur) setPurchases(JSON.parse(sPur));
    if (sCat) setCategories(JSON.parse(sCat));
    if (sPar) setParties(JSON.parse(sPar));
    if (sSett) setSettings(JSON.parse(sSett));
  };

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedNodes(newExpanded);
  };

  const calculateBalance = (account: AccountNode): number => {
    if (account.type === 'FOLDER') {
      const children = accounts.filter(a => a.parentId === account.id);
      return children.reduce((s, c) => s + calculateBalance(c), 0);
    }

    // 1. القيد الافتتاحي
    const op = openingEntries.filter(e => e.accountName === account.name);
    const opVal = op.reduce((s, c) => s + (Number(c.debit) - Number(c.credit)), 0);
    
    // 2. حركات اليومية (قبض/صرف)
    // المقبوض (received) يقلل رصيد الزبون (دائن له)
    // المدفوع (paid) يقلل رصيد المورد (مدين له)
    const jou = journal.filter(j => 
      j.partyName === account.name || 
      j.statement.includes(account.name) ||
      (categories.find(c => c.name === account.name)?.id === j.categoryId)
    );
    
    const jouDebit = jou.reduce((s, c) => s + Number(c.paidSYP) + (Number(c.paidUSD) * 12000), 0);
    const jouCredit = jou.reduce((s, c) => s + Number(c.receivedSYP) + (Number(c.receivedUSD) * 12000), 0);

    // 3. الفواتير
    const salesVal = sales.filter(s => s.customerName === account.name).reduce((s, c) => s + Number(c.totalAmount), 0);
    const purchVal = purchases.filter(p => p.supplierName === account.name).reduce((s, c) => s + Number(c.totalAmount), 0);

    // المعادلة المحاسبية: (افتتاحي مدين + مبيعات + مدفوعات) - (افتتاحي دائن + مشتريات + مقبوضات)
    return opVal + salesVal + jouDebit - purchVal - jouCredit;
  };

  const getAccountMovements = (account: AccountNode) => {
    const moves: any[] = [];
    const accountName = account.name;
    const catId = categories.find(c => c.name === accountName)?.id;
    
    // حركات اليومية
    journal.filter(j => 
      j.partyName === accountName || 
      (catId && j.categoryId === catId) ||
      j.statement.includes(accountName)
    ).forEach(j => {
      moves.push({ 
        date: j.date, 
        statement: j.statement, 
        debit: Number(j.paidSYP) || Number(j.paidUSD), 
        credit: Number(j.receivedSYP) || Number(j.receivedUSD), 
        type: j.type || 'سند نقدية' 
      });
    });

    // المبيعات
    sales.filter(s => s.customerName === accountName).forEach(s => {
      moves.push({ date: s.date, statement: `فاتورة مبيع رقم #${s.invoiceNumber}`, debit: Number(s.totalAmount), credit: 0, type: 'مبيعات' });
    });

    // المشتريات
    purchases.filter(p => p.supplierName === accountName).forEach(p => {
      moves.push({ date: p.date, statement: `فاتورة شراء رقم #${p.invoiceNumber}`, debit: 0, credit: Number(p.totalAmount), type: 'مشتريات' });
    });

    return moves.sort((a, b) => b.date.localeCompare(a.date));
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
  };

  const renderTree = (parentId: string | null = null, level: number = 0) => {
    const nodes = accounts.filter(a => a.parentId === parentId)
      .sort((a, b) => a.code.localeCompare(b.code));

    return nodes.map(node => {
        const isExpanded = expandedNodes.has(node.id);
        const children = accounts.filter(a => a.parentId === node.id);
        const balance = calculateBalance(node);

        if (searchTerm && !node.name.includes(searchTerm) && !node.code.includes(searchTerm) && !children.some(c => c.name.includes(searchTerm))) {
          return null;
        }

        return (
          <div key={node.id} className="select-none">
            <div 
              className={`flex items-center py-2 px-3 rounded-xl transition-all cursor-pointer group ${selectedAccount?.id === node.id ? 'bg-primary/10 border-primary/20 ring-1 ring-primary/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
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
                   <span className="font-mono text-zinc-400 text-[10px]">{node.code}</span>
                   <span className="font-black text-readable truncate text-sm">{node.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <span className={`font-mono text-[11px] font-black ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {balance !== 0 ? balance.toLocaleString() : ''}
                 </span>
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, parentId: node.id, type: 'ACCOUNT' }); setIsModalOpen(true); setModalMode('ADD'); }} className="p-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-zinc-500 hover:text-primary transition-all"><Plus className="w-3 h-3"/></button>
                    <button onClick={(e) => { e.stopPropagation(); setModalMode('EDIT'); setFormData(node); setSelectedAccount(node); setIsModalOpen(true); }} className="p-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-zinc-500 hover:text-amber-500 transition-all"><Edit2 className="w-3 h-3"/></button>
                 </div>
              </div>
            </div>
            {isExpanded && (
              <div className="mr-4 border-r-2 border-zinc-100 dark:border-zinc-800">
                {renderTree(node.id, level + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  const accountMoves = selectedAccount ? getAccountMovements(selectedAccount) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 h-[calc(100vh-200px)]">
      {/* الجانب الأيمن: الشجرة */}
      <div className="lg:col-span-5 bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
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
           <input type="text" placeholder="بحث سريع في الحسابات..." className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 pr-10 rounded-2xl font-bold outline-none focus:border-primary shadow-inner text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
           {renderTree(null, 0)}
        </div>
      </div>

      {/* الجانب الأيسر: الحركات */}
      <div className="lg:col-span-7 flex flex-col space-y-6">
         {selectedAccount ? (
           <div className="flex flex-col h-full space-y-6 animate-in slide-in-from-left-4">
              <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden shrink-0">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
                 <div className="flex justify-between items-start relative z-10">
                    <div>
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">تفاصيل الحساب</span>
                       <h2 className="text-3xl font-black text-readable italic">{selectedAccount.name}</h2>
                       <div className="flex items-center gap-3 mt-2">
                          <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-mono font-black border dark:border-zinc-700">الكود: {selectedAccount.code}</span>
                          <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-black border border-rose-500/20">{selectedAccount.reportType}</span>
                       </div>
                    </div>
                    <div className="text-left">
                       <span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">الرصيد اللحظي</span>
                       <div className={`text-4xl font-mono font-black ${calculateBalance(selectedAccount) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {calculateBalance(selectedAccount).toLocaleString()}
                       </div>
                       <span className="text-[10px] font-bold text-zinc-400 uppercase">{settings?.currencySymbol}</span>
                    </div>
                 </div>
              </div>

              <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl flex-1 flex flex-col overflow-hidden">
                 <div className="flex items-center justify-between mb-6 border-b dark:border-zinc-800 pb-4">
                    <h4 className="font-black text-readable flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-primary" /> كشف حركات الحساب المالي</h4>
                    <span className="text-[10px] font-bold text-zinc-400">{accountMoves.length} حركة مسجلة</span>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-right border-collapse text-sm">
                       <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-900 text-[10px] font-black uppercase text-zinc-400 sticky top-0 z-10 h-12 border-b dark:border-zinc-800">
                             <th className="p-4">التاريخ</th>
                             <th className="p-4">البيان الرسمي للعملية</th>
                             <th className="p-4 text-center">مدين (+)</th>
                             <th className="p-4 text-center">دائن (-)</th>
                             <th className="p-4 text-center">النوع</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y dark:divide-zinc-800 font-bold">
                          {accountMoves.map((move, i) => (
                             <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 h-14 transition-colors">
                                <td className="p-4 font-mono text-zinc-400">{move.date}</td>
                                <td className="p-4 text-readable">{move.statement}</td>
                                <td className="p-4 text-center font-mono text-emerald-600">{move.debit > 0 ? move.debit.toLocaleString() : '-'}</td>
                                <td className="p-4 text-center font-mono text-rose-500">{move.credit > 0 ? move.credit.toLocaleString() : '-'}</td>
                                <td className="p-4 text-center">
                                   <span className="text-[8px] px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md font-black uppercase">{move.type}</span>
                                </td>
                             </tr>
                          ))}
                          {accountMoves.length === 0 && (
                            <tr><td colSpan={5} className="p-20 text-center text-zinc-300 italic font-bold">لا توجد حركات مسجلة لهذا الحساب حالياً</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
         ) : (
           <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-[3rem] h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center animate-pulse">
              <Landmark className="w-20 h-20 text-zinc-200 dark:text-zinc-800 mb-6" />
              <h3 className="text-2xl font-black text-zinc-400 uppercase tracking-widest">يرجى اختيار حساب من الدليل</h3>
              <p className="text-zinc-400 mt-2 font-bold">بمجرد اختيار أي حساب أو عميل، ستظهر كافة حركاته وتفاصيله هنا تلقائياً.</p>
           </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8 animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-8 border-b dark:border-zinc-800 pb-4">
                 <h3 className="text-xl font-black text-readable">{modalMode === 'EDIT' ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد بالدليل'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-rose-500"><X className="w-6 h-6"/></button>
              </div>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase mr-2">الكود المحاسبي</label><input type="text" className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-mono font-black" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase mr-2">نوع البند</label><select className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}><option value="FOLDER">مجلد رئيسي</option><option value="ACCOUNT">حساب فرعي</option></select></div>
                 </div>
                 <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase mr-2">اسم الحساب الرسمي</label><input type="text" className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-black" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                 <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase mr-2">نوع التقرير الختامي</label><select className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-bold" value={formData.reportType} onChange={e => setFormData({...formData, reportType: e.target.value as any})}><option value="الميزانية">الميزانية العمومية</option><option value="المتاجرة">حساب المتاجرة</option><option value="الأرباح والخسائر">الأرباح والخسائر</option></select></div>
                 <button onClick={handleSave} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all text-lg mt-4">حفظ الحساب</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccountsView;
