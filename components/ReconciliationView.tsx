
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Search, Printer, FileDown, Calendar, 
  CheckCircle, History, Save, Info, ArrowUpRight, 
  ArrowDownLeft, FileSpreadsheet, ImageIcon, X, Filter,
  Users, Building, Calculator, RefreshCcw, Landmark, List, Trash2
} from 'lucide-react';
import { 
  Party, SalesInvoice, PurchaseInvoice, CashEntry, 
  AppSettings, ReconciliationEntry, PartyType 
} from '../types';
import { exportToCSV } from '../utils/export';
import { ImageExportService } from '../utils/ImageExportService';

interface ReconciliationViewProps {
  onBack: () => void;
}

const ReconciliationView: React.FC<ReconciliationViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  
  // البيانات الأساسية
  const [parties, setParties] = useState<Party[]>([]);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // الفلاتر
  const [filterType, setFilterType] = useState<'زبون' | 'مورد' | 'كلاهما'>('زبون');
  const [selectedPartyName, setSelectedPartyName] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [useLastReconciliation, setUseLastReconciliation] = useState(false);

  // عرض النتائج
  const [showResults, setShowResults] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const sPar = localStorage.getItem('sheno_parties');
    const sSal = localStorage.getItem('sheno_sales_invoices');
    const sPur = localStorage.getItem('sheno_purchases');
    const sJou = localStorage.getItem('sheno_cash_journal');
    const sSRet = localStorage.getItem('sheno_sales_returns');
    const sPRet = localStorage.getItem('sheno_purchase_returns');
    const sRec = localStorage.getItem('sheno_reconciliations');
    const sSett = localStorage.getItem('sheno_settings');

    if (sPar) setParties(JSON.parse(sPar));
    if (sSal) setSales(JSON.parse(sSal));
    if (sPur) setPurchases(JSON.parse(sPur));
    if (sJou) setJournal(JSON.parse(sJou));
    if (sSRet) setSalesReturns(JSON.parse(sSRet));
    if (sPRet) setPurchaseReturns(JSON.parse(sPRet));
    if (sRec) setReconciliations(JSON.parse(sRec));
    if (sSett) setSettings(JSON.parse(sSett));
  }, []);

  const getFilteredParties = () => {
    return parties.filter(p => {
      if (filterType === 'زبون') return p.type === PartyType.CUSTOMER || p.type === PartyType.BOTH;
      if (filterType === 'مورد') return p.type === PartyType.SUPPLIER || p.type === PartyType.BOTH;
      return p.type === PartyType.BOTH;
    });
  };

  const handleMoutabaa = () => {
    if (!selectedPartyName) {
      alert('يرجى اختيار الحساب أولاً');
      return;
    }
    
    if (useLastReconciliation) {
      const last = reconciliations
        .filter(r => r.partyName === selectedPartyName)
        .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
      
      if (last) {
        setStartDate(last.periodEnd);
      } else {
        alert('لا توجد مطابقة سابقة لهذا الحساب، سيتم البدء من أول السجلات.');
      }
    }
    
    setShowResults(true);
  };

  const calculateReconciliationData = () => {
    const movements: any[] = [];
    const party = parties.find(p => p.name === selectedPartyName);
    if (!party) return null;

    // 1. المبيعات
    sales.filter(s => s.customerName === selectedPartyName && s.date >= startDate && s.date <= endDate).forEach(inv => {
      const gross = inv.items.reduce((sum, it) => sum + it.total, 0);
      movements.push({ date: inv.date, type: 'مبيع', statement: `فاتورة مبيعات #${inv.invoiceNumber}`, debit: gross, credit: 0 });
      if (inv.discountAmount > 0) {
        movements.push({ date: inv.date, type: 'حسم', statement: `حسم ممنوح فاتورة #${inv.invoiceNumber}`, debit: 0, credit: inv.discountAmount });
      }
    });

    // 2. المشتريات
    purchases.filter(p => p.supplierName === selectedPartyName && p.date >= startDate && p.date <= endDate).forEach(inv => {
      const gross = inv.items.reduce((sum, it) => sum + it.total, 0) + (inv.transportExpenses || 0);
      movements.push({ date: inv.date, type: 'شراء', statement: `فاتورة مشتريات #${inv.invoiceNumber}`, debit: 0, credit: gross });
      if (inv.discountAmount > 0) {
        movements.push({ date: inv.date, type: 'حسم', statement: `حسم مكتسب فاتورة #${inv.invoiceNumber}`, debit: inv.discountAmount, credit: 0 });
      }
    });

    // 3. المرتجعات
    salesReturns.filter(r => r.customerName === selectedPartyName && r.date >= startDate && r.date <= endDate).forEach(ret => {
      movements.push({ date: ret.date, type: 'مرتجع', statement: `مرتجع مبيعات فاتورة #${ret.invoiceNumber}`, debit: 0, credit: ret.totalReturnAmount });
    });
    purchaseReturns.filter(r => r.supplierName === selectedPartyName && r.date >= startDate && r.date <= endDate).forEach(ret => {
      movements.push({ date: ret.date, type: 'مرتجع', statement: `مرتجع مشتريات فاتورة #${ret.invoiceNumber}`, debit: ret.totalReturnAmount, credit: 0 });
    });

    // 4. الحركات النقدية (اليومية)
    journal.filter(j => (j.partyName === selectedPartyName || j.statement.includes(selectedPartyName)) && j.date >= startDate && j.date <= endDate).forEach(j => {
      movements.push({
        date: j.date,
        type: j.type || 'يومية',
        statement: j.statement,
        debit: j.paidSYP + j.paidUSD,
        credit: j.receivedSYP + j.receivedUSD
      });
    });

    const sorted = movements.sort((a, b) => a.date.localeCompare(b.date));
    
    // حساب الأرصدة
    let currentBal = 0;
    const items = sorted.map(m => {
      currentBal += (m.debit - m.credit);
      return { ...m, runningBalance: currentBal };
    });

    const summary = items.reduce((acc, curr) => {
      if (curr.type === 'مبيع') acc.totalInvoices += curr.debit;
      if (curr.type === 'شراء') acc.totalPurchases += curr.credit;
      if (curr.type === 'مرتجع') acc.totalReturns += (curr.debit + curr.credit);
      if (curr.type === 'حسم') acc.totalDiscounts += (curr.debit + curr.credit);
      if (['قبض', 'دفع', 'بيع', 'شراء', 'يومية'].includes(curr.type)) acc.totalPayments += (curr.debit + curr.credit);
      return acc;
    }, { totalInvoices: 0, totalPurchases: 0, totalReturns: 0, totalPayments: 0, totalDiscounts: 0 });

    return { items, summary, finalBalance: currentBal };
  };

  const results = showResults ? calculateReconciliationData() : null;

  const handleSaveReconciliation = () => {
    if (!results) return;
    
    const entry: ReconciliationEntry = {
      id: crypto.randomUUID(),
      partyName: selectedPartyName,
      partyType: filterType,
      periodStart: startDate,
      periodEnd: endDate,
      balanceAtReconciliation: results.finalBalance,
      reconciliationDate: new Date().toISOString().split('T')[0],
      user: settings?.managerName || 'مدير النظام',
      notes: 'تمت المطابقة والتحقق من الحركات'
    };

    const updated = [entry, ...reconciliations];
    setReconciliations(updated);
    localStorage.setItem('sheno_reconciliations', JSON.stringify(updated));
    alert('تم حفظ المطابقة في السجل بنجاح.');
  };

  const handleDeleteSaved = (id: string) => {
    if (window.confirm('حذف سجل المطابقة هذا؟')) {
      const updated = reconciliations.filter(r => r.id !== id);
      setReconciliations(updated);
      localStorage.setItem('sheno_reconciliations', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-all shadow-sm">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-readable leading-tight">مطابقات الزبائن والموردين</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">تحليل ومراجعة إدارية مستقلة للحسابات</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="bg-zinc-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-zinc-800 transition-all">
              <Printer className="w-5 h-5" /> طباعة
           </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6 no-print">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col gap-1.5">
               <label className="text-[10px] font-black text-zinc-500 uppercase mr-2">1. نوع المطابقة</label>
               <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl border dark:border-zinc-700">
                  <button onClick={() => setFilterType('زبون')} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${filterType === 'زبون' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500'}`}>زبون</button>
                  <button onClick={() => setFilterType('مورد')} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${filterType === 'مورد' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500'}`}>مورد</button>
                  <button onClick={() => setFilterType('كلاهما')} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${filterType === 'كلاهما' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500'}`}>مشترك</button>
               </div>
            </div>

            <div className="flex flex-col gap-1.5">
               <label className="text-[10px] font-black text-zinc-500 uppercase mr-2">2. اختيار الحساب</label>
               <div className="relative">
                  <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <select 
                    value={selectedPartyName} 
                    onChange={e => setSelectedPartyName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-3 pr-10 rounded-2xl font-black text-readable outline-none focus:border-primary appearance-none"
                  >
                     <option value="">-- اختر الطرف --</option>
                     {getFilteredParties().map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
               </div>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
               <label className="text-[10px] font-black text-zinc-500 uppercase mr-2">3. الفترة الزمنية للمراجعة</label>
               <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-3 pr-9 rounded-2xl font-mono text-xs outline-none focus:border-primary" />
                  </div>
                  <span className="text-zinc-300">←</span>
                  <div className="flex-1 relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-3 pr-9 rounded-2xl font-mono text-xs outline-none focus:border-primary" />
                  </div>
               </div>
            </div>
         </div>

         <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t dark:border-zinc-800">
            <div className="flex items-center gap-4">
               <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input type="checkbox" checked={useLastReconciliation} onChange={e => setUseLastReconciliation(e.target.checked)} className="sr-only" />
                  <div className={`w-11 h-6 rounded-full transition-all ${useLastReconciliation ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useLastReconciliation ? '-translate-x-6' : '-translate-x-1'}`}></div>
                  </div>
               </label>
               <span className="text-xs font-bold text-zinc-500">متابعة المراجعة من آخر مطابقة محفوظة لهذا الحساب</span>
            </div>
            <button 
              onClick={handleMoutabaa}
              className="bg-primary text-white px-16 py-4 rounded-[2rem] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all text-lg flex items-center gap-3"
            >
               <RefreshCcw className="w-6 h-6" /> عرض بيانات المطابقة
            </button>
         </div>
      </div>

      {results && (
        <div ref={reportRef} className="space-y-8 animate-in slide-in-from-bottom-4 export-fix">
           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 no-print-visible">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex flex-col items-center text-center">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">إجمالي الفواتير</span>
                 <span className="text-2xl font-mono font-black text-readable">{(results.summary.totalInvoices || results.summary.totalPurchases).toLocaleString()}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex flex-col items-center text-center">
                 <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">إجمالي المرتجعات</span>
                 <span className="text-2xl font-mono font-black text-rose-600">{results.summary.totalReturns.toLocaleString()}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex flex-col items-center text-center">
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">إجمالي الدفعات</span>
                 <span className="text-2xl font-mono font-black text-emerald-600">{results.summary.totalPayments.toLocaleString()}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex flex-col items-center text-center">
                 <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">الخصومات / الحسم</span>
                 <span className="text-2xl font-mono font-black text-amber-600">{results.summary.totalDiscounts.toLocaleString()}</span>
              </div>
              <div className="bg-zinc-900 p-6 rounded-3xl shadow-xl flex flex-col items-center text-center border-b-4 border-primary">
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">صافي رصيد المطابقة</span>
                 <span className="text-3xl font-mono font-black text-white">{results.finalBalance.toLocaleString()}</span>
              </div>
           </div>

           {/* Details Table */}
           <div className="bg-white dark:bg-zinc-950 rounded-[3rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-2xl overflow-hidden">
              <div className="p-8 border-b dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary"><List className="w-6 h-6"/></div>
                    <div>
                       <h3 className="text-xl font-black text-readable tracking-tight">سجل حركات المطابقة التحليلي</h3>
                       <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">{selectedPartyName} | {startDate} ← {endDate}</p>
                    </div>
                 </div>
                 <div className="flex gap-2 no-print">
                    <button onClick={() => exportToCSV(results.items, 'reconciliation_details')} className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"><FileSpreadsheet className="w-5 h-5"/></button>
                    <button onClick={() => ImageExportService.exportAsPng(reportRef.current!, 'Reconciliation')} className="p-3 bg-amber-500/10 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all"><ImageIcon className="w-5 h-5"/></button>
                    <button onClick={handleSaveReconciliation} className="bg-primary text-white px-8 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg hover:scale-105 transition-all"><Save className="w-5 h-5"/> حفظ المطابقة</button>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-right border-collapse">
                    <thead>
                       <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest h-14">
                          <th className="p-4 border-l border-zinc-800 text-center w-32">التاريخ</th>
                          <th className="p-4 border-l border-zinc-800 text-center">نوع الحركة</th>
                          <th className="p-4 border-l border-zinc-800">البيان الرسمي</th>
                          <th className="p-4 border-l border-zinc-800 text-center w-32 bg-emerald-900/20">مدين (+)</th>
                          <th className="p-4 border-l border-zinc-800 text-center w-32 bg-rose-900/20">دائن (-)</th>
                          <th className="p-4 text-center w-48 font-black text-base bg-zinc-800">الرصيد التراكمي</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y font-bold dark:divide-zinc-800">
                       {results.items.map((m, i) => {
                         const isMatchDay = m.date === endDate;
                         return (
                           <tr key={i} className={`h-14 transition-colors ${isMatchDay ? 'bg-amber-50 dark:bg-amber-900/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}>
                              <td className="p-4 font-mono text-zinc-400 border-l dark:border-zinc-800 text-center">{m.date}</td>
                              <td className="p-4 text-center border-l dark:border-zinc-800">
                                 <span className="text-[10px] px-3 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black">{m.type}</span>
                              </td>
                              <td className="p-4 border-l dark:border-zinc-800 text-readable">{m.statement}</td>
                              <td className="p-4 text-center font-mono text-emerald-600 border-l dark:border-zinc-800">{m.debit > 0 ? m.debit.toLocaleString() : '-'}</td>
                              <td className="p-4 text-center font-mono text-rose-600 border-l dark:border-zinc-800">{m.credit > 0 ? m.credit.toLocaleString() : '-'}</td>
                              <td className={`p-4 text-center font-mono font-black text-lg ${m.runningBalance >= 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-rose-500 animate-pulse'}`}>{m.runningBalance.toLocaleString()}</td>
                           </tr>
                         );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* History Section */}
      <div className="space-y-4 pt-10 no-print">
         <h3 className="text-xl font-black flex items-center gap-3 text-readable border-b dark:border-zinc-800 pb-3">
            <History className="w-6 h-6 text-zinc-400" /> سجل المطابقات السابقة المحفوظة
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reconciliations.length === 0 ? (
               <div className="col-span-full py-20 text-center opacity-30">
                  <CheckCircle className="w-20 h-20 mx-auto mb-4" />
                  <p className="font-black text-xl">لا توجد مطابقات محفوظة بعد</p>
               </div>
            ) : reconciliations.map(rec => (
               <div key={rec.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-lg group relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                  <div className="flex justify-between items-start mb-4">
                     <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-2xl"><CheckCircle className="w-6 h-6" /></div>
                     <button onClick={() => handleDeleteSaved(rec.id)} className="p-2 text-zinc-300 hover:text-rose-500 transition-colors"><Trash2 className="w-5 h-5"/></button>
                  </div>
                  <h4 className="text-2xl font-black text-readable leading-tight mb-2">{rec.partyName}</h4>
                  <div className="space-y-1 mb-6 opacity-60">
                     <div className="flex items-center gap-2 text-xs font-bold"><Calendar className="w-4 h-4" /> المطابقة تمت بتاريخ: {rec.reconciliationDate}</div>
                     <div className="flex items-center gap-2 text-xs font-bold"><RefreshCcw className="w-4 h-4" /> الفترة: {rec.periodStart} ← {rec.periodEnd}</div>
                  </div>
                  <div className="mt-auto pt-4 border-t dark:border-zinc-800 flex justify-between items-center">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">رصيد المطابقة</span>
                        <span className="text-2xl font-mono font-black text-emerald-600">{rec.balanceAtReconciliation.toLocaleString()}</span>
                     </div>
                     <button 
                        onClick={() => {
                           setSelectedPartyName(rec.partyName);
                           setFilterType(rec.partyType);
                           setStartDate(rec.periodStart);
                           setEndDate(rec.periodEnd);
                           setShowResults(true);
                           window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 hover:text-primary transition-all shadow-sm"
                     >
                        <ArrowUpRight className="w-5 h-5" />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default ReconciliationView;
