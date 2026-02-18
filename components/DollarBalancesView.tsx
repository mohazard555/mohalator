
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Coins, CreditCard, Search, FileSpreadsheet, ImageIcon, Printer, Calendar, TrendingUp, TrendingDown, History, X, RefreshCcw } from 'lucide-react';
import { CashEntry, AppSettings, Party } from '../types';
import { exportToCSV } from '../utils/export';
import { ImageExportService } from '../utils/ImageExportService';

interface DollarBalancesViewProps {
  onBack: () => void;
}

const DollarBalancesView: React.FC<DollarBalancesViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const activeId = localStorage.getItem('sheno_active_company_id') || 'default';
    const prefix = activeId === 'default' ? 'sheno' : `sheno_${activeId}`;

    const savedCash = localStorage.getItem(`${prefix}_cash_journal`);
    const savedSettings = localStorage.getItem(`${prefix}_settings`);
    
    if (savedCash) {
      const parsedEntries = JSON.parse(savedCash);
      setEntries(parsedEntries);
    }
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const calculateDollarStats = () => {
    const dollarStats = new Map<string, { received: number, paid: number, net: number }>();
    
    entries.forEach(e => {
      const rec = Number(e.receivedUSD) || 0;
      const pd = Number(e.paidUSD) || 0;
      
      if (rec > 0 || pd > 0) {
        const key = e.partyName || 'الصندوق العام';
        const current = dollarStats.get(key) || { received: 0, paid: 0, net: 0 };
        current.received += rec;
        current.paid += pd;
        current.net = current.received - current.paid;
        dollarStats.set(key, current);
      }
    });

    return Array.from(dollarStats.entries()).map(([name, stats]) => ({ name, ...stats }));
  };

  const dollarBalances = calculateDollarStats().filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIn = dollarBalances.reduce((s, c) => s + c.received, 0);
  const totalOut = dollarBalances.reduce((s, c) => s + c.paid, 0);
  
  const selectedPartyMovements = selectedParty 
    ? entries.filter(e => (e.partyName === selectedParty || e.statement.includes(selectedParty)) && ((Number(e.receivedUSD) || 0) > 0 || (Number(e.paidUSD) || 0) > 0))
    : [];

  const handleExportExcel = () => {
    const data = dollarBalances.map(b => ({
      'الحساب': b.name,
      'إجمالي المقبوض ($)': b.received,
      'إجمالي المدفوع ($)': b.paid,
      'صافي الرصيد ($)': b.net
    }));
    exportToCSV(data, 'dollar_balances_report');
  };

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    await ImageExportService.exportAsPng(reportRef.current, `أرصدة_الدولار_${new Date().getTime()}`);
    setIsExporting(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all shadow-sm"><ArrowRight className="w-6 h-6" /></button>
          <div className="flex items-center gap-3">
             <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20"><CreditCard className="w-8 h-8" /></div>
             <div>
                <h2 className="text-2xl font-black text-readable leading-tight">مركز أرصدة وحركات الدولار ($)</h2>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">تتبع شامل لكافة العملات الأجنبية والمدفوعات</p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-emerald-500 transition-all"><FileSpreadsheet className="w-5 h-5" /> تصدير Excel</button>
           <button onClick={handleExportImage} disabled={isExporting} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg disabled:opacity-50">
             {isExporting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <ImageIcon className="w-5 h-5" />} حفظ كصورة
           </button>
           <button onClick={() => window.print()} className="bg-zinc-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl"><Printer className="w-5 h-5" /> طباعة</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-1 space-y-6 no-print">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
               <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] border-b pb-2 mb-4">قائمة الحسابات النشطة بالدولار</h3>
               <div className="relative mb-4">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                  <input type="text" placeholder="بحث باسم الحساب..." className="w-full bg-zinc-50 dark:bg-zinc-950 p-3 pr-10 rounded-2xl font-bold outline-none border dark:border-zinc-800 focus:border-amber-500 transition-all text-xs" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {dollarBalances.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                       <Coins className="w-8 h-8 text-zinc-200 mx-auto opacity-20" />
                       <p className="text-[10px] text-zinc-400 font-bold italic">لا يوجد أرصدة بالدولار حالياً</p>
                    </div>
                  ) : dollarBalances.map((b, i) => (
                    <button key={i} onClick={() => setSelectedParty(b.name)} className={`w-full text-right p-4 rounded-2xl border transition-all flex flex-col gap-1 ${selectedParty === b.name ? 'bg-amber-500/10 border-amber-500/30 ring-2 ring-amber-500/20' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}>
                       <span className="font-black text-sm text-readable">{b.name}</span>
                       <div className="flex items-center justify-between">
                          <span className="text-[9px] text-zinc-400 font-bold uppercase">الرصيد الصافي</span>
                          <span className="font-mono text-lg font-black text-amber-600">{b.net.toLocaleString()} $</span>
                       </div>
                    </button>
                  ))}
               </div>
            </div>
         </div>

         <div ref={reportRef} className="lg:col-span-3 space-y-6 export-fix bg-white dark:bg-zinc-950 p-6 md:p-10 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 no-print-visible">
               <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[2rem] border border-emerald-100 dark:border-emerald-800 flex flex-col items-center gap-2">
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">إجمالي المقبوضات ($)</span>
                  <span className="text-3xl font-mono font-black text-emerald-700 dark:text-emerald-400">{totalIn.toLocaleString()}</span>
               </div>
               <div className="bg-rose-50 dark:bg-rose-900/10 p-8 rounded-[2rem] border border-rose-100 dark:border-rose-800 flex flex-col items-center gap-2">
                  <TrendingDown className="w-8 h-8 text-rose-600" />
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">إجمالي المدفوعات ($)</span>
                  <span className="text-3xl font-mono font-black text-rose-700 dark:text-rose-400">{totalOut.toLocaleString()}</span>
               </div>
               <div className="bg-amber-500/10 p-8 rounded-[2rem] border border-amber-500/20 flex flex-col items-center gap-2 shadow-inner">
                  <Coins className="w-8 h-8 text-amber-600" />
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">صافي السيولة الدولارية</span>
                  <span className="text-3xl font-mono font-black text-amber-600">{(totalIn - totalOut).toLocaleString()}</span>
               </div>
            </div>

            {selectedParty ? (
              <div className="space-y-6 animate-in slide-in-from-left-4">
                 <div className="flex items-center justify-between border-b-4 border-amber-500 pb-4">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white"><History className="w-8 h-8 text-amber-500" /></div>
                       <div>
                          <h3 className="text-2xl font-black text-readable">كشف حركات: {selectedParty}</h3>
                          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">تفصيل العمليات المالية بالعملة الصعبة ($)</p>
                       </div>
                    </div>
                    <button onClick={() => setSelectedParty(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full no-print text-zinc-400 hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
                 </div>

                 <div className="overflow-x-auto rounded-[2rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
                    <table className="w-full text-right border-collapse text-sm">
                       <thead>
                          <tr className="bg-zinc-900 text-white font-black text-[10px] uppercase h-14 tracking-widest">
                             <th className="p-4 border-l border-zinc-800">التاريخ</th>
                             <th className="p-4 border-l border-zinc-800">البيان الرسمي للعملية</th>
                             <th className="p-4 text-center border-l border-zinc-800 text-emerald-400">مقبوض (+)</th>
                             <th className="p-4 text-center border-l border-zinc-800 text-rose-400">مدفوع (-)</th>
                             <th className="p-4">ملاحظات</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y font-bold dark:divide-zinc-800">
                          {selectedPartyMovements.length === 0 ? (
                            <tr><td colSpan={5} className="p-20 text-center italic text-zinc-400 font-bold">لا يوجد حركات مسجلة لهذا الحساب حالياً</td></tr>
                          ) : selectedPartyMovements.map((m, i) => (
                             <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 h-14 transition-colors">
                                <td className="p-4 font-mono text-zinc-400 border-l border-zinc-50 dark:border-zinc-800">{m.date}</td>
                                <td className="p-4 text-readable border-l border-zinc-50 dark:border-zinc-800">{m.statement}</td>
                                <td className="p-4 text-center font-mono text-emerald-600 text-lg border-l border-zinc-50 dark:border-zinc-800">{(Number(m.receivedUSD) || 0) > 0 ? (Number(m.receivedUSD) || 0).toLocaleString() : '-'}</td>
                                <td className="p-4 text-center font-mono text-rose-600 text-lg border-l border-zinc-50 dark:border-zinc-800">{(Number(m.paidUSD) || 0) > 0 ? (Number(m.paidUSD) || 0).toLocaleString() : '-'}</td>
                                <td className="p-4 text-zinc-400 font-normal italic text-xs truncate max-w-[150px]">{m.notes || '-'}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center border-4 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[3rem] text-center p-10">
                 <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-full mb-6">
                    <RefreshCcw className="w-16 h-16 text-zinc-200 dark:text-zinc-700 animate-spin-slow" />
                 </div>
                 <h3 className="text-2xl font-black text-zinc-300 uppercase tracking-[0.2em]">بانتظار اختيار الحساب</h3>
                 <p className="text-zinc-400 max-w-sm mt-3 font-bold text-sm leading-relaxed">اختر أحد الحسابات أو الجهات من القائمة الجانبية لعرض كشف الحركات الدولارية المفصل الخاص بها.</p>
              </div>
            )}
         </div>
      </div>
      
      <style>{`
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DollarBalancesView;
