import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Search, Printer, FileDown, Calendar, 
  Users, BookOpen, Filter, ImageIcon, ArrowUpRight, 
  ArrowDownLeft, RefreshCcw, Building2, Tag, LayoutList, X, ChevronDown
} from 'lucide-react';
import { 
  CashEntry, SalesInvoice, PurchaseInvoice, 
  Party, AppSettings, OpeningEntry, AccountingCategory, AccountNode 
} from '../types';
import { exportToCSV } from '../utils/export';
import { ImageExportService } from '../utils/ImageExportService';

interface GeneralLedgerViewProps {
  onBack: () => void;
}

interface LedgerTransaction {
  id: string;
  date: string;
  statement: string;
  debit: number;
  credit: number;
  type: string;
  ref: string;
  account: string;
}

const GeneralLedgerView: React.FC<GeneralLedgerViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [chartAccounts, setChartAccounts] = useState<AccountNode[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Account Search States
  const [accountFilter, setAccountFilter] = useState('الكل');
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [showAccountResults, setShowAccountResults] = useState(false);
  
  const [isExportingImage, setIsExportingImage] = useState(false);

  useEffect(() => {
    loadLedger();
    const savedSett = localStorage.getItem('sheno_settings');
    if (savedSett) setSettings(JSON.parse(savedSett));
  }, []);

  const loadLedger = () => {
    const journalRaw = localStorage.getItem('sheno_cash_journal');
    const openingRaw = localStorage.getItem('sheno_opening_entries');
    const catRaw = localStorage.getItem('sheno_accounting_categories');
    const chartRaw = localStorage.getItem('sheno_chart_accounts');
    
    const journal: CashEntry[] = journalRaw ? JSON.parse(journalRaw) : [];
    const opening: OpeningEntry[] = openingRaw ? JSON.parse(openingRaw) : [];
    const cats: AccountingCategory[] = catRaw ? JSON.parse(catRaw) : [];
    const chart: AccountNode[] = chartRaw ? JSON.parse(chartRaw) : [];
    
    setCategories(cats);
    setChartAccounts(chart);

    const ledger: LedgerTransaction[] = [];

    // إدراج القيود الافتتاحية
    opening.forEach(e => {
      ledger.push({
        id: e.id, date: e.date, statement: `قيد افتتاحي ميزانية: ${e.notes || e.accountName}`,
        debit: e.debit, credit: e.credit, type: 'افتتاحي', ref: 'OP', account: e.accountName
      });
    });

    // إدراج حركات اليومية وربطها بالأقسام
    journal.forEach(j => {
      let accountName = j.partyName || 'الصندوق العام';
      
      // إذا كانت الحركة مرتبطة بقسم محاسبي، نستخدم اسم القسم كحساب في الأستاذ
      if (j.categoryId) {
        const catMatch = cats.find(c => c.id === j.categoryId);
        if (catMatch) accountName = catMatch.name;
      }

      ledger.push({
        id: j.id, date: j.date, statement: j.statement,
        debit: (j.receivedSYP || 0) + (j.receivedUSD || 0), 
        credit: (j.paidSYP || 0) + (j.paidUSD || 0),
        type: j.type || 'يومية', ref: j.voucherNumber || 'VOU', account: accountName
      });
    });

    setTransactions(ledger.sort((a, b) => a.date.localeCompare(b.date)));
  };

  // تصفية العمليات بناءً على الحساب المختار والنطاق الزمني والبحث النصي
  const filteredTransactions = transactions.filter(t => {
    const matchSearch = t.statement.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       t.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       t.ref.includes(searchTerm);
    const matchAccount = accountFilter === 'الكل' || t.account === accountFilter;
    const matchDate = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
    return matchSearch && matchAccount && matchDate;
  });

  // حساب الرصيد الجاري (Running Balance)
  let currentBalance = 0;
  const ledgerWithBalance = filteredTransactions.map(t => {
    currentBalance += (t.debit - t.credit);
    return { ...t, runningBalance: currentBalance };
  });

  const totalDebit = filteredTransactions.reduce((s, c) => s + c.debit, 0);
  const totalCredit = filteredTransactions.reduce((s, c) => s + c.credit, 0);

  const handleExportExcel = () => {
    const data = ledgerWithBalance.map(t => ({
      'التاريخ': t.date,
      'الحساب': t.account,
      'البيان': t.statement,
      'مدين (+)': t.debit,
      'دائن (-)': t.credit,
      'الرصيد الجاري': t.runningBalance,
      'نوع القيد': t.type,
      'المرجع': t.ref
    }));
    exportToCSV(data, 'general_ledger_detailed');
  };

  const handleExportImage = async () => {
    if (!reportRef.current || isExportingImage) return;
    setIsExportingImage(true);
    await ImageExportService.exportAsPng(reportRef.current, `دفتر_الأستاذ_${new Date().toISOString().split('T')[0]}`);
    setIsExportingImage(false);
  };

  // قائمة الحسابات القابلة للبحث (دليل الحسابات + أي حساب ظهر في القيود)
  const uniqueAccountNamesFromTransactions = Array.from(new Set(transactions.map(t => t.account)));
  
  // Fix: Explicitly typed account info to solve 'unknown' inference (Lines 142-155, 242-252)
  type SearchableAcc = { name: string; code: string; type: "FOLDER" | "ACCOUNT" };

  // Fix: Added explicit generic type and tuple casting to Map to prevent 'unknown' results in filtering and mapping (Line 142)
  const searchableAccounts = Array.from(new Map<string, SearchableAcc>([
    // إضافة حسابات الدليل أولاً
    ...chartAccounts.map(acc => [acc.name, { name: acc.name, code: acc.code, type: acc.type }] as [string, SearchableAcc]),
    // إضافة أي حسابات ظهرت في الحركات ولم تكن في الدليل
    ...uniqueAccountNamesFromTransactions.map(name => {
      const match = chartAccounts.find(ca => ca.name === name);
      return [name, { 
        name, 
        code: match?.code || '---',
        type: (match?.type || 'ACCOUNT') as 'FOLDER' | 'ACCOUNT'
      }] as [string, SearchableAcc];
    })
  ]).values());

  // Fix: Property access error fixed by typing searchableAccounts (Lines 154, 155)
  const filteredAccountSearch = searchableAccounts.filter(acc => 
    acc.name.toLowerCase().includes(accountSearchTerm.toLowerCase()) || 
    acc.code.toLowerCase().includes(accountSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all shadow-sm">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
             <BookOpen className="w-8 h-8 text-primary" />
             <div>
                <h2 className="text-2xl font-black text-readable tracking-tight">دفتر الأستاذ العام الشامل</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">يشمل الأقسام المحاسبية، الزبائن، والموردين</p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
              <FileDown className="w-5 h-5" /> تصدير Excel
           </button>
           <button onClick={handleExportImage} disabled={isExportingImage} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
              {isExportingImage ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />} حفظ كصورة
           </button>
           <button onClick={() => window.print()} className="bg-zinc-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl">
              <Printer className="w-5 h-5" /> طباعة
           </button>
        </div>
      </div>

      <div className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-wrap items-end gap-6 no-print relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
        
        {/* البحث النصي العام */}
        <div className="flex-1 min-w-[250px] space-y-1 relative z-10">
           <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest mr-1">بحث في العمليات (البيان أو المرجع)</label>
           <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="ابحث بالبيان أو رقم السند..." 
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl py-3.5 pr-12 pl-4 outline-none font-bold text-white focus:border-primary transition-all shadow-inner"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* البحث الذكي عن الحساب */}
        <div className="flex-1 min-w-[250px] space-y-1 relative z-10">
           <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest mr-1">تحديد الحساب المفلتر (بالاسم أو الكود)</label>
           <div className="relative">
              <input 
                type="text" 
                placeholder={accountFilter === 'الكل' ? "عرض كافة الحسابات..." : `الحساب: ${accountFilter}`}
                className="w-full bg-slate-900/80 border-2 border-slate-700 rounded-2xl py-3.5 px-6 outline-none font-black text-white focus:border-primary transition-all shadow-lg text-sm"
                value={accountSearchTerm}
                onChange={(e) => {
                  setAccountSearchTerm(e.target.value);
                  setShowAccountResults(true);
                }}
                onFocus={() => setShowAccountResults(true)}
              />
              <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
              
              {showAccountResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                   <div 
                      onClick={() => {
                        setAccountFilter('الكل');
                        setAccountSearchTerm('');
                        setShowAccountResults(false);
                      }}
                      className="p-4 border-b border-slate-800 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors group"
                   >
                      <span className="font-black text-primary group-hover:text-white">عرض كافة الحسابات (الكل)</span>
                      < RefreshCcw className="w-4 h-4 text-slate-600" />
                   </div>
                   
                   {filteredAccountSearch.length === 0 ? (
                     <div className="p-6 text-center text-slate-500 italic text-xs">لا يوجد حساب يطابق هذا البحث</div>
                   ) : (
                     filteredAccountSearch.map((acc, idx) => (
                       <div 
                         key={idx}
                         onClick={() => {
                           // Fix: Property access error fixed by typing searchableAccounts (Lines 242, 243)
                           setAccountFilter(acc.name);
                           setAccountSearchTerm(acc.name);
                           setShowAccountResults(false);
                         }}
                         className="p-4 border-b border-slate-800/50 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors group"
                       >
                         <div className="flex flex-col">
                            {/* Fix: Property access error fixed by typing searchableAccounts (Line 249, 250) */}
                            <span className="font-black text-slate-200 group-hover:text-white text-sm">{acc.name}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">{acc.type === 'FOLDER' ? 'مجموعة' : 'حساب'}</span>
                         </div>
                         {/* Fix: Property access error fixed by typing searchableAccounts (Line 252) */}
                         <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded">#{acc.code}</span>
                       </div>
                     ))
                   )}
                </div>
              )}
           </div>
        </div>

        {/* فلترة التاريخ */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 px-6 py-2.5 rounded-2xl h-[58px] z-10 shadow-lg">
           <Calendar className="w-4 h-4 text-slate-500" />
           <div className="flex items-center gap-3">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono text-white outline-none" />
              <span className="text-slate-700 font-bold">←</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono text-white outline-none" />
           </div>
        </div>
      </div>

      <div ref={reportRef} className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-2xl export-fix p-4 md:p-10">
         {/* ترويسة التقرير الاحترافية */}
         <div className="flex justify-between items-start mb-8 border-b-4 border-zinc-900 pb-8 bg-white text-zinc-900">
            <div className="flex items-center gap-4">
               {settings?.logoUrl ? <img src={settings.logoUrl} className="w-20 h-20 object-contain" alt="Logo" /> : <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg">SH</div>}
               <div>
                  <h1 className="text-3xl font-black text-zinc-900 leading-none mb-1">{settings?.companyName}</h1>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{settings?.companyType}</p>
               </div>
            </div>
            <div className="text-center">
               <h2 className="text-4xl font-black border-b-2 border-zinc-100 inline-block px-10 pb-2 mb-4 tracking-tighter">كشف حساب الأستاذ العام</h2>
               <div className="flex flex-col items-center gap-1">
                  <span className="bg-zinc-900 text-white px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                    {accountFilter === 'الكل' ? 'جميع القيود والبنود المحاسبية' : accountFilter}
                  </span>
                  <p className="text-[9px] mt-4 font-bold text-zinc-400 uppercase tracking-widest">الفترة: {startDate || 'بداية السجلات'} إلى {endDate || 'اليوم الحاضر'}</p>
               </div>
            </div>
            <div className="text-left text-xs font-bold text-zinc-500 space-y-1">
               <div className="flex items-center justify-end gap-2"><span>{settings?.address}</span></div>
               <div className="flex items-center justify-end gap-2" dir="ltr"><span>{settings?.phone}</span></div>
               <p className="text-[10px] font-black text-zinc-400 opacity-50 uppercase pt-4 tracking-[0.2em]">SAMLATOR SECURED SYSTEM v4.1</p>
            </div>
         </div>

         {/* بطاقات الإجماليات */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print-visible">
            <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[2rem] flex flex-col items-center shadow-sm">
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">إجمالي الحركات المدينة (+)</span>
               <span className="text-4xl font-mono font-black text-emerald-700">{totalDebit.toLocaleString()}</span>
            </div>
            <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[2rem] flex flex-col items-center shadow-sm">
               <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">إجمالي الحركات الدائنة (-)</span>
               <span className="text-4xl font-mono font-black text-rose-700">{totalCredit.toLocaleString()}</span>
            </div>
            <div className="bg-zinc-900 p-8 rounded-[2rem] border-4 border-zinc-800 flex flex-col items-center text-white shadow-2xl transform hover:scale-105 transition-transform">
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">الرصيد الختامي للدليل</span>
               <span className="text-4xl font-mono font-black text-emerald-400">{(totalDebit - totalCredit).toLocaleString()}</span>
               <span className="text-[9px] font-bold text-zinc-500 mt-1 uppercase">{settings?.currencySymbol}</span>
            </div>
         </div>

         {/* جدول دفتر الأستاذ */}
         <div className="overflow-x-auto rounded-[2rem] border border-zinc-200 shadow-sm bg-white">
            <table className="w-full text-right border-collapse text-sm">
               <thead>
                  <tr className="bg-zinc-900 text-white font-black text-[10px] uppercase tracking-widest border-b h-16 print:bg-zinc-100 print:text-black">
                     <th className="p-4 border-l border-zinc-800 w-32 text-center">تاريخ القيد</th>
                     <th className="p-4 border-l border-zinc-800">الحساب الرسمي / البند</th>
                     <th className="p-4 border-l border-zinc-800 w-64">البيان الرسمي للعملية</th>
                     <th className="p-4 border-l border-zinc-800 text-center w-32 bg-emerald-900/20 print:bg-transparent">مدين (+)</th>
                     <th className="p-4 border-l border-zinc-800 text-center w-32 bg-rose-900/20 print:bg-transparent">دائن (-)</th>
                     <th className="p-4 border-l border-zinc-800 text-center w-44 font-black text-base bg-zinc-900/30 print:bg-zinc-50">الرصيد الجاري</th>
                     <th className="p-4 text-center w-24">المرجع</th>
                  </tr>
               </thead>
               <tbody className="divide-y font-bold text-zinc-800">
                  {ledgerWithBalance.length === 0 ? (
                    <tr><td colSpan={7} className="p-32 text-center italic text-zinc-400 font-black text-2xl uppercase tracking-tighter">لا توجد حركات مالية مسجلة لهذه الفلاتر</td></tr>
                  ) : ledgerWithBalance.map((t, idx) => {
                    const accountNode = chartAccounts.find(ca => ca.name === t.account);
                    return (
                      <tr key={idx} className={`h-14 transition-colors hover:bg-zinc-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}>
                        <td className="p-4 font-mono text-zinc-400 border-l border-zinc-100 text-center">{t.date}</td>
                        <td className="p-4 border-l border-zinc-100 font-black text-zinc-900">
                            <div className="flex flex-col">
                               <div className="flex items-center gap-2">
                                  <span>{t.account}</span>
                                  {accountNode && (
                                    <span className="text-[8px] font-mono font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 uppercase">#{accountNode.code}</span>
                                  )}
                               </div>
                               {categories.some(c => c.name === t.account) && (
                                 <span className="text-[7px] text-zinc-400 font-black uppercase tracking-widest">بند محاسبي تشغيلي</span>
                               )}
                            </div>
                        </td>
                        <td className="p-4 border-l border-zinc-100 text-zinc-500 font-normal leading-relaxed text-xs">{t.statement}</td>
                        <td className="p-4 text-center font-mono text-emerald-600 border-l border-zinc-100">{t.debit > 0 ? t.debit.toLocaleString() : '-'}</td>
                        <td className="p-4 text-center font-mono text-rose-600 border-l border-zinc-100">{t.credit > 0 ? t.credit.toLocaleString() : '-'}</td>
                        <td className={`p-4 text-center font-mono font-black text-xl border-l border-zinc-100 ${t.runningBalance >= 0 ? 'text-zinc-900 bg-emerald-50/10' : 'text-rose-700 bg-rose-50/10'}`}>{t.runningBalance.toLocaleString()}</td>
                        <td className="p-4 text-center font-mono text-[10px] text-zinc-400 uppercase tracking-tighter">{t.ref}</td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>

         {/* تذييل الطباعة */}
         <div className="hidden print:flex justify-between items-end mt-12 pt-8 border-t border-zinc-200 text-[10px] font-black text-zinc-400">
           <div className="flex flex-col gap-1">
              <span>SAMLATOR SYSTEM | SECURED FINANCIAL LOG TERMINAL</span>
              <span>تاريخ استخراج هذا الكشف: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="text-center">
              <div className="w-64 border-b-2 border-zinc-200 mb-2 mx-auto"></div>
              <span>توقيع المدير المالي / الختم الرسمي للمنشأة</span>
           </div>
           <div className="text-left italic opacity-50">
              {settings?.companyName} Accounting Terminal v4.1
           </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center no-print px-6 py-8 text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">
         <span>{settings?.companyName} Accounting Terminal v4.1</span>
         <span>SECURED DATA ENCRYPTION | SYRIA 2026</span>
      </div>
    </div>
  );
};

export default GeneralLedgerView;