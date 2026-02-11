
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
    const salesRaw = localStorage.getItem('sheno_sales_invoices');
    const salesReturnsRaw = localStorage.getItem('sheno_sales_returns');
    const purchaseRaw = localStorage.getItem('sheno_purchases');
    const purchaseReturnsRaw = localStorage.getItem('sheno_purchase_returns');
    const catRaw = localStorage.getItem('sheno_accounting_categories');
    
    const journal: CashEntry[] = journalRaw ? JSON.parse(journalRaw) : [];
    const opening: OpeningEntry[] = openingRaw ? JSON.parse(openingRaw) : [];
    const salesInvoices: SalesInvoice[] = salesRaw ? JSON.parse(salesRaw) : [];
    const salesReturns: any[] = salesReturnsRaw ? JSON.parse(salesReturnsRaw) : [];
    const purchaseInvoices: PurchaseInvoice[] = purchaseRaw ? JSON.parse(purchaseRaw) : [];
    const purchaseReturns: any[] = purchaseReturnsRaw ? JSON.parse(purchaseReturnsRaw) : [];
    const cats: AccountingCategory[] = catRaw ? JSON.parse(catRaw) : [];

    const ledger: LedgerTransaction[] = [];

    // 1. الأرصدة الافتتاحية
    opening.forEach(e => {
      ledger.push({
        id: e.id, date: e.date, statement: `قيد افتتاحي: ${e.notes || e.accountName}`,
        debit: e.debit, credit: e.credit, type: 'افتتاحي', ref: 'OP', account: e.accountName
      });
    });

    // 2. معالجة حركات المبيعات (الاستحقاق + الحسم)
    salesInvoices.forEach(inv => {
       const gross = inv.items.reduce((s,i) => s + i.total, 0);
       // حركة الاستحقاق للزبون
       ledger.push({
         id: inv.id, date: inv.date, statement: `فاتورة مبيعات رقم ${inv.invoiceNumber}`,
         debit: gross, credit: 0, type: 'مبيع', ref: inv.invoiceNumber, account: inv.customerName
       });
       // حركة الحسم الممنوح (تسوية)
       if (inv.discountAmount > 0) {
          ledger.push({
            id: inv.id + '-disc', date: inv.date, statement: `حسم ممنوح للفاتورة #${inv.invoiceNumber}`,
            debit: 0, credit: inv.discountAmount, type: 'حسم', ref: inv.invoiceNumber, account: inv.customerName
          });
       }
    });

    // 3. معالجة حركات المشتريات (الاستحقاق + الحسم)
    purchaseInvoices.forEach(inv => {
       const gross = inv.items.reduce((s,i) => s + i.total, 0) + (inv.transportExpenses || 0);
       ledger.push({
         id: inv.id, date: inv.date, statement: `فاتورة مشتريات رقم ${inv.invoiceNumber}`,
         debit: 0, credit: gross, type: 'شراء', ref: inv.invoiceNumber, account: inv.supplierName
       });
       if (inv.discountAmount > 0) {
          ledger.push({
            id: inv.id + '-disc', date: inv.date, statement: `حسم مكتسب من فاتورة #${inv.invoiceNumber}`,
            debit: inv.discountAmount, credit: 0, type: 'حسم', ref: inv.invoiceNumber, account: inv.supplierName
          });
       }
    });

    // 4. معالجة المرتجعات
    salesReturns.forEach(ret => {
       ledger.push({
         id: ret.id, date: ret.date, statement: `مرتجع مبيع فاتورة #${ret.invoiceNumber}`,
         debit: 0, credit: ret.totalReturnAmount, type: 'مرتجع', ref: ret.invoiceNumber, account: ret.customerName
       });
    });
    purchaseReturns.forEach(ret => {
       ledger.push({
         id: ret.id, date: ret.date, statement: `مرتجع شراء فاتورة #${ret.invoiceNumber}`,
         debit: ret.totalReturnAmount, credit: 0, type: 'مرتجع', ref: ret.invoiceNumber, account: ret.supplierName
       });
    });

    // 5. حركات اليومية (المقبوضات والمدفوعات النقدية فقط)
    journal.filter(j => j.type !== 'حسم').forEach(j => {
      let accountName = j.partyName || 'الصندوق العام';
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

  const filteredTransactions = transactions.filter(t => {
    const matchSearch = t.statement.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       t.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       t.ref.includes(searchTerm);
    const matchAccount = accountFilter === 'الكل' || t.account === accountFilter;
    const matchDate = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
    return matchSearch && matchAccount && matchDate;
  });

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

  const uniqueAccountNamesFromTransactions = Array.from(new Set(transactions.map(t => t.account)));
  
  const filteredAccountSearch = uniqueAccountNamesFromTransactions.filter(name => 
    name.toLowerCase().includes(accountSearchTerm.toLowerCase())
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
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">تحليل كامل للاستحقاقات والخصومات والسيولة</p>
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

      <div className="bg-zinc-100 dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-wrap items-end gap-6 no-print relative">
        <div className="flex-1 min-w-[250px] space-y-1 relative z-10">
           <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">بحث في العمليات</label>
           <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="ابحث بالبيان أو رقم السند..." 
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3.5 pr-12 pl-4 outline-none font-bold text-readable focus:border-primary transition-all shadow-inner"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="flex-1 min-w-[250px] space-y-1 relative z-10">
           <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">تحديد الحساب المفلتر</label>
           <div className="relative">
              <input 
                type="text" 
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3.5 px-6 outline-none font-black text-readable focus:border-primary transition-all shadow-lg text-sm"
                value={accountSearchTerm}
                onChange={(e) => {
                  setAccountSearchTerm(e.target.value);
                  setShowAccountResults(true);
                }}
                onFocus={() => setShowAccountResults(true)}
                placeholder="اختر حساباً..."
              />
              {showAccountResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl z-[200] max-h-64 overflow-y-auto">
                   <div onClick={() => { setAccountFilter('الكل'); setAccountSearchTerm(''); setShowAccountResults(false); }} className="p-4 border-b hover:bg-zinc-50 cursor-pointer font-black text-primary">عرض الكل</div>
                   {filteredAccountSearch.map((name, i) => (
                     <div key={i} onClick={() => { setAccountFilter(name); setAccountSearchTerm(name); setShowAccountResults(false); }} className="p-4 border-b hover:bg-zinc-50 cursor-pointer font-bold">{name}</div>
                   ))}
                </div>
              )}
           </div>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-6 py-2.5 rounded-2xl h-[58px] z-10 shadow-sm">
           <Calendar className="w-4 h-4 text-zinc-400" />
           <div className="flex items-center gap-3">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono text-readable outline-none" />
              <span className="text-zinc-300">←</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono text-readable outline-none" />
           </div>
        </div>
      </div>

      <div ref={reportRef} className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-2xl export-fix p-4 md:p-10">
         <div className="flex justify-between items-start mb-8 border-b-4 border-zinc-900 pb-8 bg-white text-zinc-900">
            <div className="flex items-center gap-4">
               {settings?.logoUrl ? <img src={settings.logoUrl} className="w-20 h-20 object-contain" alt="Logo" /> : <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg">SH</div>}
               <div>
                  <h1 className="text-3xl font-black text-zinc-900 leading-none mb-1">{settings?.companyName}</h1>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{settings?.companyType}</p>
               </div>
            </div>
            <div className="text-center">
               <h2 className="text-3xl font-black border-b-2 border-zinc-100 inline-block px-10 pb-2 mb-4 tracking-tighter">كشف حساب الأستاذ العام</h2>
               <div className="bg-zinc-900 text-white px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">{accountFilter}</div>
            </div>
            <div className="text-left text-[10px] font-black text-zinc-400">
               <p>{settings?.address}</p><p dir="ltr">{settings?.phone}</p>
               <p className="mt-4 uppercase tracking-[0.2em]">SAMLATOR SECURED SYSTEM</p>
            </div>
         </div>

         <div className="overflow-x-auto rounded-[2rem] border border-zinc-200 shadow-sm bg-white">
            <table className="w-full text-right border-collapse text-sm">
               <thead>
                  <tr className="bg-zinc-900 text-white font-black text-[10px] uppercase h-16">
                     <th className="p-4 border-l border-zinc-800 w-32 text-center">التاريخ</th>
                     <th className="p-4 border-l border-zinc-800">الحساب الرسمي / البند</th>
                     <th className="p-4 border-l border-zinc-800 w-64">البيان الرسمي للعملية</th>
                     <th className="p-4 border-l border-zinc-800 text-center w-32 bg-emerald-900/20">مدين (+)</th>
                     <th className="p-4 border-l border-zinc-800 text-center w-32 bg-rose-900/20">دائن (-)</th>
                     <th className="p-4 border-l border-zinc-800 text-center w-44 font-black text-base bg-zinc-900/30">الرصيد الجاري</th>
                     <th className="p-4 text-center w-24">المرجع</th>
                  </tr>
               </thead>
               <tbody className="divide-y font-bold text-zinc-800">
                  {ledgerWithBalance.map((t, idx) => (
                    <tr key={idx} className={`h-14 transition-colors hover:bg-zinc-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}>
                      <td className="p-4 font-mono text-zinc-400 border-l border-zinc-100 text-center">{t.date}</td>
                      <td className="p-4 border-l border-zinc-100 font-black text-zinc-900">{t.account}</td>
                      <td className="p-4 border-l border-zinc-100 text-zinc-500 font-normal text-xs">{t.statement}</td>
                      <td className="p-4 text-center font-mono text-emerald-600 border-l border-zinc-100">{t.debit > 0 ? t.debit.toLocaleString() : '-'}</td>
                      <td className="p-4 text-center font-mono text-rose-600 border-l border-zinc-100">{t.credit > 0 ? t.credit.toLocaleString() : '-'}</td>
                      <td className={`p-4 text-center font-mono font-black text-xl border-l border-zinc-100 ${t.runningBalance >= 0 ? 'text-zinc-900' : 'text-rose-700'}`}>{t.runningBalance.toLocaleString()}</td>
                      <td className="p-4 text-center font-mono text-[10px] text-zinc-400 uppercase tracking-tighter">{t.ref}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default GeneralLedgerView;
