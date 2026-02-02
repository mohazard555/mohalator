
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Search, Printer, FileDown, Calendar, 
  Users, BookOpen, Filter, ImageIcon, ArrowUpRight, 
  ArrowDownLeft, RefreshCcw, Building2, Tag, LayoutList
} from 'lucide-react';
import { 
  CashEntry, SalesInvoice, PurchaseInvoice, 
  Party, AppSettings, OpeningEntry 
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
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountFilter, setAccountFilter] = useState('الكل');
  
  const [isExportingImage, setIsExportingImage] = useState(false);

  useEffect(() => {
    loadLedger();
    const savedSett = localStorage.getItem('sheno_settings');
    if (savedSett) setSettings(JSON.parse(savedSett));
  }, []);

  const loadLedger = () => {
    const journalRaw = localStorage.getItem('sheno_cash_journal');
    const openingRaw = localStorage.getItem('sheno_opening_entries');
    
    const journal: CashEntry[] = journalRaw ? JSON.parse(journalRaw) : [];
    const opening: OpeningEntry[] = openingRaw ? JSON.parse(openingRaw) : [];

    const ledger: LedgerTransaction[] = [];

    // إدراج القيود الافتتاحية
    opening.forEach(e => {
      ledger.push({
        id: e.id, date: e.date, statement: `قيد افتتاحي: ${e.notes || e.accountName}`,
        debit: e.debit, credit: e.credit, type: 'افتتاحي', ref: 'OP', account: e.accountName
      });
    });

    // إدراج كافة حركات اليومية
    journal.forEach(j => {
      ledger.push({
        id: j.id, date: j.date, statement: j.statement,
        debit: j.receivedSYP + (j.receivedUSD || 0), // تبسيط للعملة الموحدة في الدفتر العام
        credit: j.paidSYP + (j.paidUSD || 0),
        type: j.type || 'يومية', ref: j.voucherNumber || 'VOU', account: j.partyName || 'الصندوق العام'
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
    exportToCSV(data, 'general_ledger_report');
  };

  const handleExportImage = async () => {
    if (!reportRef.current || isExportingImage) return;
    setIsExportingImage(true);
    await ImageExportService.exportAsPng(reportRef.current, `دفتر_الأستاذ_${new Date().toISOString().split('T')[0]}`);
    setIsExportingImage(false);
  };

  const uniqueAccounts = Array.from(new Set(transactions.map(t => t.account))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
             <BookOpen className="w-8 h-8 text-primary" />
             <h2 className="text-2xl font-black text-readable tracking-tight">دفتر الأستاذ العام (General Ledger)</h2>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
              <FileDown className="w-5 h-5" /> تصدير XLSX
           </button>
           <button onClick={handleExportImage} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
              <ImageIcon className="w-5 h-5" /> حفظ كصورة
           </button>
           <button onClick={() => window.print()} className="bg-zinc-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl">
              <Printer className="w-5 h-5" /> طباعة الدفتر
           </button>
        </div>
      </div>

      {/* Modern Filter Engine */}
      <div className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-wrap items-end gap-6 no-print relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
        
        <div className="flex-1 min-w-[250px] space-y-1 relative z-10">
           <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest mr-1">البحث الشامل</label>
           <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="ابحث بالبيان، المرجع، أو الحساب..." 
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl py-3.5 pr-12 pl-4 outline-none font-bold text-white focus:border-primary transition-all shadow-inner"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="w-64 space-y-1 relative z-10">
           <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest mr-1">تحديد الحساب</label>
           <select 
             value={accountFilter} 
             onChange={e => setAccountFilter(e.target.value)}
             className="w-full bg-slate-900 border border-slate-700 text-white p-3.5 rounded-2xl font-black text-sm outline-none focus:border-primary transition-all appearance-none cursor-pointer text-center"
           >
              <option value="الكل">جميع الحسابات</option>
              {uniqueAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
           </select>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 px-6 py-2.5 rounded-2xl h-[58px] z-10">
           <Calendar className="w-4 h-4 text-slate-500" />
           <div className="flex items-center gap-3">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono text-white outline-none" />
              <span className="text-slate-700 font-bold">←</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono text-white outline-none" />
           </div>
        </div>
      </div>

      {/* Ledger Report Canvas */}
      <div ref={reportRef} className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-2xl export-fix p-4 md:p-10">
         {/* Professional Header */}
         <div className="flex justify-between items-start mb-8 border-b-4 border-zinc-900 pb-8 bg-white text-zinc-900">
            <div className="flex items-center gap-4">
               {settings?.logoUrl ? <img src={settings.logoUrl} className="w-20 h-20 object-contain" /> : <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl">SH</div>}
               <div>
                  <h1 className="text-3xl font-black text-zinc-900 leading-none mb-1">{settings?.companyName}</h1>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{settings?.companyType}</p>
               </div>
            </div>
            <div className="text-center">
               <h2 className="text-4xl font-black border-b-2 border-zinc-100 inline-block px-10 pb-2 mb-4">دفتر الأستاذ العام التفصيلي</h2>
               <div className="flex flex-col items-center gap-1">
                  <span className="bg-zinc-900 text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{accountFilter === 'الكل' ? 'جميع السجلات المعتمدة' : accountFilter}</span>
                  <p className="text-[9px] mt-2 font-bold text-zinc-400">الفترة: {startDate || 'الأول'} إلى {endDate || 'اليوم'}</p>
               </div>
            </div>
            <div className="text-left text-xs font-bold text-zinc-500 space-y-1">
               <p className="flex items-center justify-end gap-2">{settings?.address} <Building2 className="w-3 h-3"/></p>
               <p dir="ltr" className="flex items-center justify-end gap-2">{settings?.phone} <Tag className="w-3 h-3"/></p>
               <p className="text-[10px] font-black text-zinc-400 opacity-50 uppercase pt-4">SAMLATOR SECURED LEDGER TERMINAL</p>
            </div>
         </div>

         {/* Summary Row */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print-visible">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex flex-col items-center">
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">إجمالي المدين (+)</span>
               <span className="text-3xl font-mono font-black text-emerald-700">{totalDebit.toLocaleString()}</span>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex flex-col items-center">
               <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">إجمالي الدائن (-)</span>
               <span className="text-3xl font-mono font-black text-rose-700">{totalCredit.toLocaleString()}</span>
            </div>
            <div className="bg-zinc-900 p-6 rounded-3xl flex flex-col items-center text-white shadow-xl">
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">صافي رصيد الدفتر</span>
               <span className="text-3xl font-mono font-black text-emerald-400">{(totalDebit - totalCredit).toLocaleString()}</span>
            </div>
         </div>

         {/* Ledger Table */}
         <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
               <thead>
                  <tr className="bg-zinc-900 text-white font-black text-[10px] uppercase tracking-widest border-b h-14 print:bg-zinc-100 print:text-black">
                     <th className="p-4 border-l border-zinc-800 w-32">تاريخ القيد</th>
                     <th className="p-4 border-l border-zinc-800">الحساب الرئيسي</th>
                     <th className="p-4 border-l border-zinc-800 w-64">البيان الرسمي للعملية</th>
                     <th className="p-4 border-l border-zinc-800 text-center w-32 bg-emerald-900/20 print:bg-transparent">مدين (+)</th>
                     <th className="p-4 border-l border-zinc-800 text-center w-32 bg-rose-900/20 print:bg-transparent">دائن (-)</th>
                     <th className="p-4 border-l border-zinc-800 text-center w-40 font-black text-base bg-zinc-900/40 print:bg-zinc-50">الرصيد الجاري</th>
                     <th className="p-4 text-center w-24">المرجع</th>
                  </tr>
               </thead>
               <tbody className="divide-y font-bold text-zinc-800">
                  {ledgerWithBalance.length === 0 ? (
                    <tr><td colSpan={7} className="p-32 text-center italic text-zinc-300 text-xl font-black uppercase">لا توجد حركات مسجلة تطابق الفلاتر</td></tr>
                  ) : ledgerWithBalance.map((t, idx) => (
                    <tr key={idx} className={`hover:bg-zinc-50 transition-colors h-14 ${idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}>
                       <td className="p-4 font-mono text-zinc-400 border-l border-zinc-100">{t.date}</td>
                       <td className="p-4 border-l border-zinc-100 font-black text-zinc-900">{t.account}</td>
                       <td className="p-4 border-l border-zinc-100 text-zinc-500 font-normal leading-relaxed">{t.statement}</td>
                       <td className="p-4 text-center font-mono text-emerald-600 border-l border-zinc-100">{t.debit > 0 ? t.debit.toLocaleString() : '-'}</td>
                       <td className="p-4 text-center font-mono text-rose-600 border-l border-zinc-100">{t.credit > 0 ? t.credit.toLocaleString() : '-'}</td>
                       <td className={`p-4 text-center font-mono font-black text-xl border-l border-zinc-100 ${t.runningBalance >= 0 ? 'text-zinc-900' : 'text-rose-700'}`}>{t.runningBalance.toLocaleString()}</td>
                       <td className="p-4 text-center font-mono text-[10px] text-zinc-400">{t.ref}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Official Footer */}
         <div className="hidden print:flex justify-between items-end mt-12 pt-8 border-t border-zinc-200 text-[10px] font-black text-zinc-400">
           <div className="flex flex-col gap-1">
              <span>SAMLATOR SYSTEM | SECURED FINANCIAL LOG TERMINAL</span>
              <span>تاريخ استخراج الكشف: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="text-center">
              <div className="w-48 border-b-2 border-zinc-200 mb-2 mx-auto"></div>
              <span>توقيع مدير الحسابات / والختم الرسمي</span>
           </div>
           <div className="text-left italic opacity-50">
              {settings?.companyName} Accounting Ledger v4.1
           </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralLedgerView;
