
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Search, UserCheck, Printer, FileDown, Filter, Calendar, Coins, CreditCard, Building, RefreshCcw, Calculator, ChevronDown, Users, Briefcase, Share2, MapPin, Phone, ImageIcon } from 'lucide-react';
import { Party, PartyType, SalesInvoice, CashEntry, AppSettings, PurchaseInvoice } from '../types';
import { exportToCSV } from '../utils/export';
import { ImageExportService } from '../utils/ImageExportService';

interface CustomerBalancesViewProps {
  onBack: () => void;
}

const CustomerBalancesView: React.FC<CustomerBalancesViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [partyType, setPartyType] = useState<PartyType | 'الكل'>(PartyType.CUSTOMER);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCurrencyView, setActiveCurrencyView] = useState<'primary' | 'secondary'>('primary');
  const [exchangeRate, setExchangeRate] = useState(11500);
  const [isUnifiedView, setIsUnifiedView] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);

  const [parties, setParties] = useState<Party[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const savedInvoices = localStorage.getItem('sheno_sales_invoices');
    const savedPurchases = localStorage.getItem('sheno_purchases');
    const savedCash = localStorage.getItem('sheno_cash_journal');
    const savedParties = localStorage.getItem('sheno_parties');
    const savedSettings = localStorage.getItem('sheno_settings');
    
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    if (savedPurchases) setPurchases(JSON.parse(savedPurchases));
    if (savedCash) setCashEntries(JSON.parse(savedCash));
    if (savedParties) setParties(JSON.parse(savedParties));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const calculateDetailedBalance = (party: Party) => {
    const getStats = (isPrimary: boolean) => {
      let debitTotal = 0;
      let creditTotal = 0;

      const partyEntries = cashEntries.filter(entry => {
        const matchName = entry.partyName === party.name;
        if (isPrimary) return matchName && (entry.receivedSYP > 0 || entry.paidSYP > 0);
        else return matchName && (entry.receivedUSD > 0 || entry.paidUSD > 0);
      });

      partyEntries.forEach(p => {
        if (isPrimary) {
          debitTotal += (p.paidSYP || 0);
          creditTotal += (p.receivedSYP || 0);
        } else {
          debitTotal += (p.paidUSD || 0);
          creditTotal += (p.receivedUSD || 0);
        }
      });

      const opening = isPrimary ? (party.openingBalance || 0) : 0;
      
      // رصيد الحساب = (الافتتاحي + المدين) - الدائن
      // للزبائن: الافتتاحي مدين عادة
      // للموردين: الافتتاحي دائن عادة
      let netBalance = 0;
      if (party.type === PartyType.CUSTOMER) {
        netBalance = opening + debitTotal - creditTotal;
      } else if (party.type === PartyType.SUPPLIER) {
        netBalance = creditTotal + opening - debitTotal; // الرصيد دائن للمورد
      } else {
        // للطرفين (BOTH) - نفترض طبيعة العميل أو نحسب الصافي
        netBalance = opening + debitTotal - creditTotal;
      }

      return { totalGross: debitTotal, totalJournalPayments: creditTotal, totalDiscount: 0, netBalance };
    };

    const primary = getStats(true);
    const secondary = getStats(false);

    let unifiedNet = 0;
    if (activeCurrencyView === 'primary') unifiedNet = primary.netBalance + (secondary.netBalance * exchangeRate);
    else unifiedNet = secondary.netBalance + (primary.netBalance / (exchangeRate || 1));

    return { primary, secondary, unifiedNet };
  };

  const filteredParties = parties.filter(p => {
    const matchType = partyType === 'الكل' || p.type === partyType;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm);
    return matchType && matchSearch;
  });

  const balancesData = filteredParties.map(p => {
    const stats = calculateDetailedBalance(p);
    return { ...p, ...stats };
  });

  const handleExportImage = async () => {
    if (!reportRef.current || isExportingImage) return;
    setIsExportingImage(true);
    try { await ImageExportService.exportAsPng(reportRef.current, `أرصدة_${partyType}_${new Date().getTime()}`); } finally { setIsExportingImage(false); }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-slate-800 text-white hover:bg-slate-700 rounded-xl shadow-lg"><ArrowRight className="w-6 h-6" /></button>
          <h2 className="text-2xl font-black text-readable tracking-tight">أرصدة العملاء والموردين</h2>
        </div>
        <div className="flex gap-2">
           <button onClick={() => exportToCSV(balancesData, 'balances')} className="bg-slate-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-slate-700 hover:bg-slate-700"><FileDown className="w-5 h-5" /> تصدير XLSX</button>
           <button onClick={handleExportImage} disabled={isExportingImage} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg disabled:opacity-50">
             {isExportingImage ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ImageIcon className="w-5 h-5" />} حفظ كصورة
           </button>
           <button onClick={() => window.print()} className="bg-[#e11d48] text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110"><Printer className="w-5 h-5" /> طباعة الكشف</button>
        </div>
      </div>

      <div className="bg-[#0f172a] p-5 rounded-3xl border border-slate-800 flex flex-wrap items-center gap-6 no-print shadow-2xl relative overflow-hidden">
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 gap-1 relative z-10">
           {['الكل', PartyType.CUSTOMER, PartyType.SUPPLIER, PartyType.BOTH].map(t => (
             <button key={t} onClick={() => setPartyType(t as any)} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${partyType === t ? 'bg-[#e11d48] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
           ))}
        </div>
        <div className="relative flex-1 min-w-[250px] z-10">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input type="text" placeholder="البحث بالاسم أو الكود..." className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl py-3 pr-12 outline-none font-bold text-white focus:border-[#e11d48] transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex bg-slate-900/80 border border-slate-800 p-1 rounded-full h-12 items-center z-10 shadow-lg">
           <button onClick={() => setActiveCurrencyView('secondary')} className={`flex items-center gap-2 px-6 h-full rounded-full text-xs font-black transition-all ${activeCurrencyView === 'secondary' ? 'bg-[#e11d48] text-white shadow-md' : 'text-slate-500'}`}>{settings?.secondaryCurrency || 'دولار'}</button>
           <button onClick={() => setActiveCurrencyView('primary')} className={`flex items-center gap-2 px-6 h-full rounded-full text-xs font-black transition-all ${activeCurrencyView === 'primary' ? 'bg-[#e11d48] text-white shadow-md' : 'text-slate-500'}`}>{settings?.currency || 'ليرة'}</button>
        </div>
      </div>

      <div ref={reportRef} className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-2xl p-4 md:p-8 print:p-0 print:border-none print:shadow-none export-fix">
        <div className="flex justify-between items-start mb-2 border-b-4 border-[#e11d48] pb-6 bg-white text-zinc-900 print:mb-8 print:mx-4">
           <div className="flex items-center gap-4">
              {settings?.logoUrl ? <img src={settings.logoUrl} className="w-20 h-20 object-contain" /> : <div className="w-16 h-16 bg-[#e11d48] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">SH</div>}
              <div><h1 className="text-3xl font-black text-[#e11d48] leading-tight">{settings?.companyName}</h1><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{settings?.companyType}</p></div>
           </div>
           <div className="text-center pt-2">
              <h2 className="text-3xl font-black text-zinc-900 border-b-2 border-zinc-100 inline-block px-8 pb-1 mb-3">كشف أرصدة الحسابات</h2>
              <div className="bg-zinc-50 px-4 py-1.5 rounded-full border border-zinc-100 text-sm font-black text-[#e11d48] uppercase tracking-tighter">{partyType}</div>
           </div>
           <div className="text-left space-y-1">
              <div className="flex items-center justify-end gap-2 text-zinc-500 text-xs font-bold">{settings?.address || 'دمشق، سوريا'}</div>
              <div className="text-[10px] font-black text-zinc-400 uppercase pt-2">تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</div>
           </div>
        </div>

        <div className="overflow-x-auto print:mx-4">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-100 text-zinc-900 font-black border-b-2 border-zinc-300 h-14 uppercase tracking-tighter">
                <th className="p-4 border-l border-zinc-200 text-center w-24">كود</th>
                <th className="p-4 border-l border-zinc-200">الاسم والبيان</th>
                <th className="p-4 border-l border-zinc-200 text-center">إجمالي المسحوبات/التوريد</th>
                <th className="p-4 border-l border-zinc-200 text-center">إجمالي الحسم</th>
                <th className="p-4 border-l border-zinc-200 text-center">إجمالي المدفوعات</th>
                <th className="p-4 border-l border-zinc-200 text-center bg-zinc-50/50">الرصيد الصافي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-bold bg-white text-zinc-800">
              {balancesData.map((party) => {
                const s = activeCurrencyView === 'primary' ? party.primary : party.secondary;
                return (
                  <tr key={party.id} className="hover:bg-zinc-50 transition-colors h-14 border-b">
                    <td className="p-4 font-mono text-zinc-400 text-center border-l border-zinc-100">{party.code}</td>
                    <td className="p-4 text-zinc-900 text-lg border-l border-zinc-100">{party.name}</td>
                    <td className="p-4 text-center font-mono text-zinc-500 border-l border-zinc-100">{s.totalGross.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono text-rose-500 border-l border-zinc-100">{s.totalDiscount.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono text-emerald-600 border-l border-zinc-100">{s.totalJournalPayments.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono border-l border-zinc-100 bg-zinc-50/20">
                       <span className={`text-xl font-black ${s.netBalance > 0 ? 'text-[#e11d48]' : s.netBalance === 0 ? 'text-zinc-300' : 'text-emerald-600'}`}>
                         {s.netBalance.toLocaleString()}
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerBalancesView;
