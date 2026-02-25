
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Plus, Save, X, Search, Scale, Check, 
  Trash2, Edit2, Printer, ChevronRight, ChevronLeft, 
  LayoutList, Calculator, Hash, MessageSquare, Folder, ArrowUpRight, ArrowDownLeft,
  ChevronDown, RotateCcw, Info, PlusCircle
} from 'lucide-react';
import { OpeningEntry, AccountNode, AppSettings, CashEntry, Party, AccountingCategory } from '../types';
import { loadChartAccounts, getPrefix, normalizeArabic } from '../src/utils/accountUtils';

interface JournalRow {
  id: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
  statement: string;
}

interface OpeningEntriesViewProps {
  onBack: () => void;
}

const OpeningEntriesView: React.FC<OpeningEntriesViewProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [chartAccounts, setChartAccounts] = useState<AccountNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  const [viewMode, setViewMode] = useState<'NEW' | 'LIST'>('NEW');
  const [savedOpeningEntries, setSavedOpeningEntries] = useState<OpeningEntry[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const [rows, setRows] = useState<JournalRow[]>(
    Array.from({ length: 8 }, () => ({
      id: crypto.randomUUID(),
      accountId: '',
      accountName: '',
      accountCode: '',
      debit: 0,
      credit: 0,
      statement: ''
    }))
  );

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPosting, setIsPosting] = useState(false);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [accountSearch, setAccountSearch] = useState('');

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    code: '',
    parentId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const prefix = getPrefix();
    
    const sSett = localStorage.getItem(`${prefix}_settings`);
    if (sSett) setSettings(JSON.parse(sSett));

    const accounts = loadChartAccounts();
    setChartAccounts(accounts);
    const roots = accounts.filter((a: any) => !a.parentId).map((a: any) => a.id);
    setExpandedNodes(new Set(roots));

    const sOp = localStorage.getItem(`${prefix}_opening_entries`);
    if (sOp) setSavedOpeningEntries(JSON.parse(sOp));
  };

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(expandedNodes);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedNodes(newSet);
  };

  const handleOpenSearch = (rowId: string) => {
    setActiveRowId(rowId);
    setAccountSearch('');
    setIsSearchOpen(true);
    setIsQuickAddOpen(false);
    loadData(); // إعادة التحميل لضمان مزامنة أي حسابات مضافة حديثاً
  };

  const handleSelectAccount = (acc: AccountNode) => {
    if (acc.type === 'FOLDER') return; // لا يسمح باختيار المجلدات كأطراف قيد

    setRows(prev => prev.map(r => 
      r.id === activeRowId ? { ...r, accountId: acc.id, accountName: acc.name, accountCode: acc.code } : r
    ));
    setIsSearchOpen(false);
    setActiveRowId(null);
  };

  const updateRowValue = (id: string, field: 'debit' | 'credit' | 'statement', value: any) => {
    setRows(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value };
        if (field === 'debit' && Number(value) > 0) updated.credit = 0;
        if (field === 'credit' && Number(value) > 0) updated.debit = 0;
        return updated;
      }
      return r;
    }));
  };

  const addNewRow = () => {
    setRows([...rows, {
      id: crypto.randomUUID(),
      accountId: '',
      accountName: '',
      accountCode: '',
      debit: 0,
      credit: 0,
      statement: ''
    }]);
  };

  const totalDebit = rows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalCredit = rows.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  const difference = Number((totalDebit - totalCredit).toFixed(2));
  const isBalanced = Math.abs(difference) === 0 && (totalDebit > 0);

  const handleQuickAddAccount = () => {
    if (!quickAddForm.name || !quickAddForm.code || !quickAddForm.parentId) {
      alert('يرجى ملء كافة حقول الحساب الجديد');
      return;
    }

    const prefix = getPrefix();
    const newNode: AccountNode = {
      id: crypto.randomUUID(),
      code: quickAddForm.code,
      name: quickAddForm.name,
      parentId: quickAddForm.parentId,
      type: 'ACCOUNT',
      reportType: chartAccounts.find(a => a.id === quickAddForm.parentId)?.reportType || 'الميزانية'
    };

    const updatedChart = [...chartAccounts, newNode];
    localStorage.setItem(`${prefix}_chart_accounts`, JSON.stringify(updatedChart));
    setChartAccounts(updatedChart);

    handleSelectAccount(newNode);
    setIsQuickAddOpen(false);
  };

  const handleSaveOpeningEntry = () => {
    if (!isBalanced) {
      alert('لا يمكن حفظ القيد الافتتاحي لأنه غير متوازن.');
      return;
    }

    const validRows = rows.filter(r => r.accountId && (r.debit > 0 || r.credit > 0));
    if (validRows.length < 2) {
      alert('يجب إدخال حسابين على الأقل لتسجيل القيد.');
      return;
    }

    setIsPosting(true);
    const activeId = localStorage.getItem('sheno_active_company_id') || 'default';
    const prefix = activeId === 'default' ? 'sheno' : `sheno_${activeId}`;
    
    const savedJou = localStorage.getItem(`${prefix}_cash_journal`);
    let jou: CashEntry[] = savedJou ? JSON.parse(savedJou) : [];

    const voucherNum = editingEntryId ? `OP-EDIT-${editingEntryId}` : 'OP-' + new Date().getFullYear();

    // منع التكرار: حذف أي قيود افتتاحية سابقة للحسابات المتأثرة بهذا القيد
    // هذا يمنع التكرار الناتج عن وجود رصيد افتتاحي في بطاقة العميل/المورد وقيد افتتاحي في هذه الشاشة
    const affectedAccountIds = validRows.map(r => r.accountId);
    const affectedAccountNames = validRows.map(r => r.accountName);
    
    jou = jou.filter(j => {
      // 1. حذف القيود القديمة لنفس رقم السند (في حال التعديل)
      const isOldVoucher = j.voucherNumber === voucherNum || j.voucherNumber === `OP-${new Date().getFullYear()}`;
      
      // 2. حذف أي قيد افتتاحي سابق لنفس الحسابات المتأثرة (لمنع التكرار بين الشاشات)
      const isOldOpeningForAffectedAccount = j.type === 'افتتاحي' && (
        (j.linkedAccountId && affectedAccountIds.includes(j.linkedAccountId)) ||
        (j.partyName && affectedAccountNames.includes(j.partyName))
      );
      
      return !isOldVoucher && !isOldOpeningForAffectedAccount;
    });

    const journalEntries: CashEntry[] = validRows.map(r => {
      // تحديد الحساب المقابل لتحسين البيان ومنع التكرار الذهني للمستخدم
      let oppositeInfo = '';
      if (validRows.length === 2) {
        // إذا كان القيد من طرفين فقط، نذكر الحساب الآخر
        const opposite = validRows.find(row => row.accountId !== r.accountId);
        if (opposite) oppositeInfo = ` - مقابل: ${opposite.accountName}`;
      } else if (validRows.length > 2) {
        // إذا كان القيد مركباً، نذكر "مذكورين"
        oppositeInfo = ` - مقابل: مذكورين`;
      }

      return {
        id: crypto.randomUUID(),
        date,
        statement: (r.statement || 'قيد افتتاح السنة المالية') + oppositeInfo,
        receivedSYP: r.debit, 
        paidSYP: r.credit,    
        receivedUSD: 0,
        paidUSD: 0,
        notes: 'قيد افتتاحي معتمد',
        type: 'افتتاحي',
        voucherNumber: voucherNum,
        partyName: r.accountName,
        linkedAccountId: r.accountId,
        linkedAccountCode: r.accountCode
      };
    });

    localStorage.setItem(`${prefix}_cash_journal`, JSON.stringify([...journalEntries, ...jou]));

    const savedOp = localStorage.getItem(`${prefix}_opening_entries`);
    let opEntries: OpeningEntry[] = savedOp ? JSON.parse(savedOp) : [];
    
    if (editingEntryId) {
       opEntries = opEntries.filter(e => e.id !== editingEntryId);
    }

    const newEntryId = editingEntryId || crypto.randomUUID();
    const newOpeningEntries: OpeningEntry[] = validRows.map(r => ({
      id: newEntryId,
      accountName: r.accountName,
      accountType: chartAccounts.find(a => a.id === r.accountId)?.reportType === 'الميزانية' ? 'أصول' : 'حقوق ملكية',
      debit: r.debit,
      credit: r.credit,
      date,
      notes: r.statement || 'قيد افتتاحي'
    }));

    localStorage.setItem(`${prefix}_opening_entries`, JSON.stringify([...newOpeningEntries, ...opEntries]));

    alert('تم حفظ وترحيل القيد بنجاح.');
    setIsPosting(false);
    loadData();
    setViewMode('LIST');
    setEditingEntryId(null);
  };

  const handleDeleteEntry = (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القيد الافتتاحي؟')) return;
    
    const activeId = localStorage.getItem('sheno_active_company_id') || 'default';
    const prefix = activeId === 'default' ? 'sheno' : `sheno_${activeId}`;
    
    const savedOp = localStorage.getItem(`${prefix}_opening_entries`);
    const savedJou = localStorage.getItem(`${prefix}_cash_journal`);
    
    if (savedOp) {
      const opEntries: OpeningEntry[] = JSON.parse(savedOp);
      localStorage.setItem(`${prefix}_opening_entries`, JSON.stringify(opEntries.filter(e => e.id !== id)));
    }
    
    if (savedJou) {
      const jou: CashEntry[] = JSON.parse(savedJou);
      localStorage.setItem(`${prefix}_cash_journal`, JSON.stringify(jou.filter(j => j.voucherNumber !== `OP-EDIT-${id}` && j.voucherNumber !== `OP-${new Date().getFullYear()}`)));
    }
    
    loadData();
  };

  const handleEditEntry = (id: string) => {
    const entryRows = savedOpeningEntries.filter(e => e.id === id);
    if (entryRows.length === 0) return;
    
    const first = entryRows[0];
    setDate(first.date);
    setEditingEntryId(id);
    
    const newRows: JournalRow[] = entryRows.map(e => {
       const acc = chartAccounts.find(a => a.name === e.accountName);
       return {
          id: crypto.randomUUID(),
          accountId: acc?.id || '',
          accountName: e.accountName,
          accountCode: acc?.code || '',
          debit: e.debit,
          credit: e.credit,
          statement: e.notes
       };
    });
    
    // إكمال الصفوف لتبدو كجدول
    while (newRows.length < 8) {
       newRows.push({
          id: crypto.randomUUID(),
          accountId: '',
          accountName: '',
          accountCode: '',
          debit: 0,
          credit: 0,
          statement: ''
       });
    }
    
    setRows(newRows);
    setViewMode('NEW');
  };

  // وظيفة رندر الشجرة داخل المودال
  const renderSearchTree = (parentId: string | null = null, level: number = 0) => {
    const nodes = chartAccounts.filter(a => a.parentId === parentId).sort((a, b) => a.code.localeCompare(b.code));
    
    return nodes.map(node => {
      const isExpanded = expandedNodes.has(node.id);
      const children = chartAccounts.filter(a => a.parentId === node.id);
      const hasChildren = children.length > 0;
      const isSelectable = node.type === 'ACCOUNT';

      return (
        <div key={node.id} className="select-none">
          <div 
            onClick={() => isSelectable ? handleSelectAccount(node) : null}
            className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-all ${isSelectable ? 'cursor-pointer hover:bg-primary/10' : 'cursor-default opacity-80'} group`}
          >
            <div style={{ width: `${level * 20}px` }}></div>
            
            {hasChildren ? (
              <button 
                onClick={(e) => toggleNode(node.id, e)}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-zinc-500"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
              </button>
            ) : (
              <div className="w-5"></div>
            )}

            <div className="flex items-center gap-3 flex-1 overflow-hidden">
              {node.type === 'FOLDER' ? (
                <Folder className="w-4 h-4 text-amber-500 fill-amber-500/10" />
              ) : (
                <Calculator className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100" />
              )}
              <div className="flex flex-col truncate">
                <span className={`text-xs ${isSelectable ? 'font-black text-zinc-800' : 'font-bold text-zinc-400'}`}>{node.name}</span>
                <span className="text-[8px] font-mono text-zinc-400">#{node.code}</span>
              </div>
            </div>

            {isSelectable && (
              <button className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded">اختيار</button>
            )}
          </div>
          
          {isExpanded && (
            <div className="mr-4 border-r border-zinc-100 dark:border-zinc-800">
              {renderSearchTree(node.id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const searchTerm = normalizeArabic(accountSearch);
  const filteredFlatResults = chartAccounts.filter(acc => 
    normalizeArabic(acc.name || '').includes(searchTerm) || 
    normalizeArabic(acc.code || '').includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900 p-3 flex flex-col gap-3 animate-in fade-in" dir="rtl">
      {/* Title Bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2 no-print">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 bg-white hover:bg-zinc-100 rounded-lg border shadow-sm transition-all">
            <ArrowRight className="w-5 h-5 text-zinc-500" />
          </button>
          <div>
            <h1 className="text-lg font-black text-zinc-800 flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" /> القيد الافتتاحي العام
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={() => {
                setViewMode(viewMode === 'NEW' ? 'LIST' : 'NEW');
                if (viewMode === 'LIST') {
                   setEditingEntryId(null);
                   setRows(Array.from({ length: 8 }, () => ({
                      id: crypto.randomUUID(),
                      accountId: '',
                      accountName: '',
                      accountCode: '',
                      debit: 0,
                      credit: 0,
                      statement: ''
                   })));
                }
             }}
             className="px-4 py-1.5 bg-white border rounded-lg font-black text-[10px] text-zinc-600 hover:bg-zinc-50 transition-all shadow-sm flex items-center gap-2"
           >
              {viewMode === 'NEW' ? <LayoutList className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {viewMode === 'NEW' ? 'عرض القيود المحفوظة' : 'إنشاء قيد جديد'}
           </button>
           <div className="bg-white border rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
              <span className="text-[9px] font-black text-zinc-400 uppercase">تاريخ القيد</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="font-mono font-black text-xs outline-none text-primary bg-transparent" />
           </div>
        </div>
      </div>

      {viewMode === 'LIST' ? (
         <div className="flex-1 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-zinc-50 flex justify-between items-center">
               <h3 className="font-black text-sm text-zinc-800">سجل القيود الافتتاحية المحفوظة</h3>
               <span className="text-[10px] font-bold text-zinc-400">إجمالي القيود: {Array.from(new Set(savedOpeningEntries.map(e => e.id))).length}</span>
            </div>
            <div className="overflow-auto flex-1">
               <table className="w-full text-right border-collapse">
                  <thead>
                     <tr className="bg-zinc-900 text-white font-black text-[10px] uppercase h-10">
                        <th className="p-3 border-l border-zinc-800">التاريخ</th>
                        <th className="p-3 border-l border-zinc-800">معرف القيد</th>
                        <th className="p-3 border-l border-zinc-800">عدد الحسابات</th>
                        <th className="p-3 border-l border-zinc-800">إجمالي القيمة</th>
                        <th className="p-3 text-center">إجراءات</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                     {Array.from(new Set(savedOpeningEntries.map(e => e.id))).map(id => {
                        const entryRows = savedOpeningEntries.filter(e => e.id === id);
                        const total = entryRows.reduce((s, r) => s + r.debit, 0);
                        return (
                           <tr key={id} className="hover:bg-zinc-50 transition-colors">
                              <td className="p-3 font-mono text-xs">{entryRows[0].date}</td>
                              <td className="p-3 font-mono text-[10px] text-zinc-400">{id.substring(0, 8)}...</td>
                              <td className="p-3 font-bold text-xs">{entryRows.length} حسابات</td>
                              <td className="p-3 font-black text-sm text-primary">{total.toLocaleString()}</td>
                              <td className="p-3">
                                 <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => handleEditEntry(id)} className="p-1.5 bg-zinc-100 hover:bg-primary hover:text-white rounded-lg transition-all"><Edit2 className="w-4 h-4"/></button>
                                    <button onClick={() => handleDeleteEntry(id)} className="p-1.5 bg-zinc-100 hover:bg-rose-500 hover:text-white rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                     {savedOpeningEntries.length === 0 && (
                        <tr>
                           <td colSpan={5} className="p-20 text-center text-zinc-400 italic font-bold">لا توجد قيود افتتاحية مسجلة حالياً</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      ) : (
         <>
      {/* Main Grid */}
      <div className="flex-1 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden flex flex-col relative">
         <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-right border-collapse table-fixed">
               <thead className="sticky top-0 z-30">
                  <tr className="bg-zinc-900 text-white font-black text-[9px] uppercase tracking-widest h-10 shadow-md">
                     <th className="w-12 text-center border-l border-zinc-800">#</th>
                     <th className="border-l border-zinc-800 pr-6">الحساب المحاسبي الرسمي</th>
                     <th className="w-32 text-center border-l border-zinc-800 bg-emerald-900/10">مدين (+)</th>
                     <th className="w-32 text-center border-l border-zinc-800 bg-rose-900/10">دائن (-)</th>
                     <th className="w-64 border-l border-zinc-800 pr-4">البيان الرسمي</th>
                     <th className="w-10 text-center no-print">---</th>
                  </tr>
               </thead>
               <tbody className="text-zinc-800 font-bold">
                  {rows.map((row, idx) => (
                    <tr key={row.id} className={`h-9 border-b border-zinc-100 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'} hover:bg-primary/5`}>
                       <td className="text-center font-mono text-[10px] text-zinc-300 border-l border-zinc-50">{idx + 1}</td>
                       <td className="relative border-l border-zinc-50 px-3">
                          <div 
                            onClick={() => handleOpenSearch(row.id)}
                            className={`w-full h-full flex items-center cursor-pointer min-h-[36px] transition-all text-sm ${row.accountName ? 'text-zinc-900 font-black' : 'text-zinc-300 italic font-normal text-xs'}`}
                          >
                             {row.accountName || "اختر حساباً من الدليل..."}
                             <ChevronDown className="w-3 h-3 mr-auto text-zinc-300 opacity-0 group-hover:opacity-100" />
                          </div>
                       </td>
                       <td className="border-l border-zinc-50 bg-emerald-50/10">
                          <input 
                            type="number" 
                            className={`w-full h-full bg-transparent text-center font-mono font-black text-sm outline-none ${row.credit > 0 ? 'opacity-20 pointer-events-none' : 'text-emerald-600'}`}
                            value={row.debit || ''}
                            onChange={e => updateRowValue(row.id, 'debit', Number(e.target.value))}
                            placeholder="0"
                          />
                       </td>
                       <td className="border-l border-zinc-50 bg-rose-50/10">
                          <input 
                            type="number" 
                            className={`w-full h-full bg-transparent text-center font-mono font-black text-sm outline-none ${row.debit > 0 ? 'opacity-20 pointer-events-none' : 'text-rose-600'}`}
                            value={row.credit || ''}
                            onChange={e => updateRowValue(row.id, 'credit', Number(e.target.value))}
                            placeholder="0"
                          />
                       </td>
                       <td className="border-l border-zinc-50 px-3">
                          <input 
                            type="text" 
                            className="w-full h-full bg-transparent outline-none font-normal italic text-xs text-zinc-500 focus:text-zinc-900"
                            value={row.statement}
                            onChange={e => updateRowValue(row.id, 'statement', e.target.value)}
                            placeholder="تفاصيل القيد..."
                          />
                       </td>
                       <td className="text-center no-print">
                          <button 
                            onClick={() => setRows(rows.filter(r => r.id !== row.id))}
                            className="p-1 text-zinc-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                             <Trash2 className="w-3.5 h-3.5" />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <div className="bg-zinc-50 border-t p-2 px-4 flex items-center justify-between no-print">
            <button onClick={addNewRow} className="flex items-center gap-1.5 px-4 py-1.5 bg-white border-2 border-dashed border-zinc-300 rounded-lg font-black text-[10px] text-zinc-500 hover:border-primary hover:text-primary transition-all shadow-sm">
               <Plus className="w-3.5 h-3.5" /> إضافة سطر
            </button>
            <div className="flex items-center gap-2 text-[8px] font-black text-zinc-400 uppercase tracking-widest italic">
               <Info className="w-3 h-3" /> النظام يغذي دليل الحسابات وأرصدة الأطراف آلياً
            </div>
         </div>
      </div>

      {/* Summary Bar */}
      {viewMode === 'NEW' && (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-3 no-print">
         <div className="md:col-span-8 bg-zinc-900 p-1 rounded-2xl shadow-lg flex items-center">
            <div className="grid grid-cols-3 w-full divide-x divide-x-reverse divide-zinc-800">
               <div className="p-2 flex flex-col items-center border-l border-zinc-800">
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">إجمالي المدين (+)</span>
                  <span className="text-lg font-mono font-black text-white">{totalDebit.toLocaleString()}</span>
               </div>
               <div className="p-2 flex flex-col items-center border-l border-zinc-800">
                  <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-0.5">إجمالي الدائن (-)</span>
                  <span className="text-lg font-mono font-black text-white">{totalCredit.toLocaleString()}</span>
               </div>
               <div className={`p-2 flex flex-col items-center transition-colors ${difference === 0 ? 'bg-emerald-600/10' : 'bg-rose-600/10'}`}>
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">الفرق</span>
                  <span className={`text-xl font-mono font-black ${difference === 0 ? 'text-emerald-400' : 'text-rose-500 animate-pulse'}`}>
                     {Math.abs(difference).toLocaleString()}
                  </span>
               </div>
            </div>
         </div>

         <div className="md:col-span-4 flex flex-wrap gap-2 justify-end items-center h-full">
            <button onClick={() => window.print()} className="bg-white hover:bg-zinc-50 px-4 py-2 rounded-xl flex items-center gap-1.5 font-black text-[11px] shadow-sm border border-zinc-200"><Printer className="w-4 h-4" /> طباعة</button>
            <button 
              onClick={handleSaveOpeningEntry}
              disabled={!isBalanced || isPosting}
              className={`px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-xl transition-all ${isBalanced ? 'bg-primary text-white hover:scale-105 active:scale-95' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed grayscale'}`}
            >
               <Save className="w-4 h-4" /> {isPosting ? 'جاري الحفظ...' : editingEntryId ? 'تحديث القيد' : 'ترحيل القيد'}
            </button>
         </div>
      </div>
      )}
      </>
      )}

      {/* Account Selector Modal (Dynamic Tree) */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-5 bg-zinc-900 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/20"><Search className="w-5 h-5"/></div>
                    <div>
                       <h3 className="text-lg font-black tracking-tight">محرك دليل الحسابات</h3>
                       <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">Chart of Accounts Linker</p>
                    </div>
                 </div>
                 <button onClick={() => setIsSearchOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-zinc-400"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-4">
                 {isQuickAddOpen ? (
                    <div className="space-y-4 p-5 border-2 border-emerald-500/20 rounded-2xl bg-emerald-500/5 animate-in slide-in-from-bottom-2">
                       <h4 className="font-black text-emerald-600 flex items-center gap-2 text-sm"><PlusCircle className="w-5 h-5" /> تعريف حساب جديد فورياً</h4>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                             <label className="text-[9px] font-black text-zinc-400 uppercase">اسم الحساب</label>
                             <input type="text" value={quickAddForm.name} onChange={e=>setQuickAddForm({...quickAddForm, name: e.target.value})} className="bg-white border rounded-xl p-2.5 font-bold text-xs outline-none focus:border-emerald-500 shadow-sm" placeholder="الاسم..." />
                          </div>
                          <div className="flex flex-col gap-1">
                             <label className="text-[9px] font-black text-zinc-400 uppercase">كود الحساب</label>
                             <input type="text" value={quickAddForm.code} onChange={e=>setQuickAddForm({...quickAddForm, code: e.target.value})} className="bg-white border rounded-xl p-2.5 font-mono font-bold text-xs outline-none focus:border-emerald-500 shadow-sm" placeholder="131001" />
                          </div>
                          <div className="col-span-2 flex flex-col gap-1">
                             <label className="text-[9px] font-black text-zinc-400 uppercase">يتبع للمجموعة</label>
                             <select value={quickAddForm.parentId} onChange={e=>setQuickAddForm({...quickAddForm, parentId: e.target.value})} className="bg-white border rounded-xl p-2.5 font-bold text-xs outline-none appearance-none cursor-pointer">
                                <option value="">-- اختر المجموعة الأب --</option>
                                {chartAccounts.filter(a=>a.type==='FOLDER').map(f => <option key={f.id} value={f.id}>{f.name} (#{f.code})</option>)}
                             </select>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={handleQuickAddAccount} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-xs shadow-lg">حفظ وإدراج الحساب</button>
                          <button onClick={() => setIsQuickAddOpen(false)} className="px-6 py-3 bg-zinc-200 text-zinc-500 rounded-xl font-bold text-xs">إلغاء</button>
                       </div>
                    </div>
                 ) : (
                    <>
                       <div className="relative mb-4">
                          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                          <input 
                            type="text" 
                            autoFocus
                            className="w-full bg-zinc-50 border-2 border-zinc-100 py-3 pr-12 pl-4 rounded-2xl outline-none font-black text-base focus:border-primary transition-all shadow-inner"
                            placeholder="بحث بالاسم أو الكود..."
                            value={accountSearch}
                            onChange={e => setAccountSearch(e.target.value)}
                          />
                       </div>

                       <div className="max-h-[350px] overflow-y-auto custom-scrollbar space-y-1 pr-1 border border-zinc-50 rounded-xl p-1">
                          {accountSearch.length > 0 ? (
                            // عرض مسطح في حال البحث لسرعة الوصول
                            <div className="space-y-1">
                               {filteredFlatResults.length === 0 ? (
                                 <div className="p-10 text-center flex flex-col items-center gap-3">
                                   <Search className="w-8 h-8 text-zinc-100" />
                                   <p className="text-zinc-400 font-black text-xs italic">لا توجد نتائج</p>
                                   <button 
                                     onClick={() => { setQuickAddForm({ ...quickAddForm, name: accountSearch }); setIsQuickAddOpen(true); }}
                                     className="mt-2 text-primary font-black text-[10px] flex items-center gap-1.5 hover:underline"
                                   >
                                      <PlusCircle className="w-3 h-3" /> إضافة "{accountSearch}" كحساب جديد؟
                                   </button>
                                 </div>
                               ) : filteredFlatResults.map(acc => (
                                 <div key={acc.id} onClick={() => handleSelectAccount(acc)} className="p-3 bg-zinc-50 hover:bg-primary hover:text-white rounded-xl cursor-pointer transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                       <Calculator className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                                       <div className="flex flex-col">
                                          <span className="font-black text-xs leading-none">{acc.name}</span>
                                          <span className="text-[8px] font-mono opacity-50 group-hover:opacity-100 mt-0.5">#{acc.code}</span>
                                       </div>
                                    </div>
                                    <Check className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                 </div>
                               ))}
                            </div>
                          ) : (
                            // عرض شجري في الوضع الافتراضي
                            renderSearchTree(null, 0)
                          )}
                       </div>
                       
                       <div className="mt-4 pt-4 border-t flex justify-between items-center no-print">
                          <p className="text-[8px] text-zinc-400 font-black flex items-center gap-1.5">
                             <Info className="w-3 h-3" /> يسمح فقط باختيار الحسابات الفرعية القابلة للقيد
                          </p>
                          <button onClick={() => setIsQuickAddOpen(true)} className="text-[10px] font-black text-emerald-600 flex items-center gap-1.5 hover:text-emerald-700">
                             <PlusCircle className="w-3.5 h-3.5" /> حساب جديد
                          </button>
                       </div>
                    </>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Note */}
      <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center gap-3 no-print shadow-sm">
         <Scale className="w-8 h-8 text-primary shrink-0 opacity-30" />
         <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">
            • ملاحظة: محرك الحسابات مربوط مباشرة بشجرة الدليل. اختيار الحساب سيؤدي لتثبيت رصيد أول مدة له في السجلات الختامية للميزانية العمومية.
         </p>
      </div>
    </div>
  );
};

export default OpeningEntriesView;