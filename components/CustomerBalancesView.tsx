
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, UserCheck, Printer, FileDown, Filter, Calendar, Coins, CreditCard, Building, RefreshCcw, Calculator, ChevronDown, Users, Briefcase, Share2 } from 'lucide-react';
import { Party, PartyType, SalesInvoice, CashEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

interface CustomerBalancesViewProps {
  onBack: () => void;
}

const CustomerBalancesView: React.FC<CustomerBalancesViewProps> = ({ onBack }) => {
  const [partyType, setPartyType] = useState<PartyType | 'الكل'>(PartyType.CUSTOMER);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Currency Toggle (Image Style)
  const [activeCurrencyView, setActiveCurrencyView] = useState<'primary' | 'secondary'>('primary');

  // Converter States (Image 60 logic)
  const [exchangeRate, setExchangeRate] = useState(11500);
  const [isUnifiedView, setIsUnifiedView] = useState(false);

  const [parties, setParties] = useState<Party[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const savedInvoices = localStorage.getItem('sheno_sales_invoices');
    const savedCash = localStorage.getItem('sheno_cash_journal');
    const savedParties = localStorage.getItem('sheno_parties');
    const savedSettings = localStorage.getItem('sheno_settings');
    
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    if (savedCash) setCashEntries(JSON.parse(savedCash));
    if (savedParties) setParties(JSON.parse(savedParties));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const calculateDetailedBalance = (party: Party) => {
    const primarySymbol = settings?.currencySymbol || 'ل.س';
    const secondarySymbol = settings?.secondaryCurrencySymbol || '$';

    const getStats = (symbol: string, isPrimary: boolean) => {
      const partyInvoices = invoices.filter(inv => inv.customerName === party.name && inv.currencySymbol === symbol);
      const totalMovements = partyInvoices.reduce((s, i) => s + i.totalAmount, 0);

      const partyPayments = cashEntries.filter(entry => {
        const matchName = entry.statement.includes(party.name) || entry.partyName === party.name;
        if (isPrimary) return matchName && (entry.receivedSYP > 0 || entry.paidSYP > 0);
        else return matchName && (entry.receivedUSD > 0 || entry.paidUSD > 0);
      });

      const totalPayments = partyPayments.reduce((s, p) => {
         if (party.type === PartyType.CUSTOMER) return s + (isPrimary ? p.receivedSYP : p.receivedUSD);
         else return s + (isPrimary ? p.paidSYP : p.paidUSD);
      }, 0);

      const opening = isPrimary ? (party.openingBalance || 0) : 0;
      const netBalance = opening + totalMovements - totalPayments;

      return { totalMovements, totalPayments, netBalance };
    };

    const primary = getStats(primarySymbol, true);
    const secondary = getStats(secondarySymbol, false);

    // Unified Calculation
    let unifiedNet = 0;
    let unifiedMovements = 0;
    let unifiedPayments = 0;

    if (activeCurrencyView === 'primary') {
      unifiedNet = primary.netBalance + (secondary.netBalance * exchangeRate);
      unifiedMovements = primary.totalMovements + (secondary.totalMovements * exchangeRate);
      unifiedPayments = primary.totalPayments + (secondary.totalPayments * exchangeRate);
    } else {
      unifiedNet = secondary.netBalance + (primary.netBalance / (exchangeRate || 1));
      unifiedMovements = secondary.totalMovements + (primary.totalMovements / (exchangeRate || 1));
      unifiedPayments = secondary.totalPayments + (primary.totalPayments / (exchangeRate || 1));
    }

    return { primary, secondary, unifiedNet, unifiedMovements, unifiedPayments };
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

  const totalPrimaryAll = balancesData.reduce((sum, p) => sum + p.primary.netBalance, 0);
  const totalSecondaryAll = balancesData.reduce((sum, p) => sum + p.secondary.netBalance, 0);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Buttons */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-800 text-white hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-white">أرصدة العملاء والموردين</h2>
        </div>
        <div className="flex gap-2">
           <button onClick={() => exportToCSV(balancesData, 'customer_balances')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-zinc-700">
             <FileDown className="w-5 h-5" /> تصدير XLSX
           </button>
           <button onClick={() => window.print()} className="bg-[#e11d48] text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-rose-900/20">
             <Printer className="w-5 h-5" /> طباعة الكشف
           </button>
        </div>
      </div>

      {/* Main Filter & Currency Toggle Bar */}
      <div className="bg-[#121214] p-4 rounded-3xl border border-zinc-800 flex flex-wrap items-center gap-6 no-print">
        
        {/* Party Type Filter (الكل، عملاء، موردين، مشترك) */}
        <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 gap-1">
           <button onClick={() => setPartyType('الكل')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${partyType === 'الكل' ? 'bg-[#e11d48] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'}`}>الكل</button>
           <button onClick={() => setPartyType(PartyType.CUSTOMER)} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${partyType === PartyType.CUSTOMER ? 'bg-[#e11d48] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'}`}>العملاء</button>
           <button onClick={() => setPartyType(PartyType.SUPPLIER)} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${partyType === PartyType.SUPPLIER ? 'bg-[#e11d48] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'}`}>الموردين</button>
           <button onClick={() => setPartyType(PartyType.BOTH)} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${partyType === PartyType.BOTH ? 'bg-[#e11d48] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'}`}>مشترك</button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو الكود..." 
            className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl py-3 pr-12 pl-4 outline-none font-bold text-white focus:border-[#e11d48] transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Currency Capsule Toggle (Same as Image) */}
        <div className="flex bg-[#18181b] border border-zinc-700 p-1 rounded-full h-12 items-center">
           <button 
             onClick={() => setActiveCurrencyView('secondary')} 
             className={`flex items-center gap-2 px-6 h-full rounded-full text-xs font-black transition-all ${activeCurrencyView === 'secondary' ? 'bg-[#e11d48] text-white' : 'text-zinc-500'}`}
           >
              <CreditCard className="w-4 h-4" /> {settings?.secondaryCurrency || 'دولار أمريكي'}
           </button>
           <button 
             onClick={() => setActiveCurrencyView('primary')} 
             className={`flex items-center gap-2 px-6 h-full rounded-full text-xs font-black transition-all ${activeCurrencyView === 'primary' ? 'bg-[#e11d48] text-white' : 'text-zinc-500'}`}
           >
              <Coins className="w-4 h-4" /> {settings?.currency || 'ليرة سورية'}
           </button>
        </div>
      </div>

      {/* Currency Converter Controls (Image 60) */}
      <div className="bg-[#121214] p-5 rounded-[2rem] border border-zinc-800 flex flex-wrap items-center justify-between gap-6 no-print">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsUnifiedView(!isUnifiedView)} 
              className={`px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-3 transition-all ${isUnifiedView ? 'bg-emerald-600 text-white shadow-xl' : 'bg-zinc-800 text-zinc-500'}`}
            >
               <RefreshCcw className={`w-5 h-5 ${isUnifiedView ? 'animate-spin-slow' : ''}`} />
               {isUnifiedView ? 'الرصيد الموحد مفعّل' : 'تفعيل العرض الموحد للنتائج'}
            </button>
            <div className="flex flex-col gap-0.5">
               <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mr-1">سعر الصرف النشط</span>
               <div className="relative group">
                  <input 
                    type="number" 
                    value={exchangeRate} 
                    onChange={e => setExchangeRate(Number(e.target.value))}
                    className="w-40 bg-zinc-950 border-2 border-zinc-800 p-2.5 rounded-xl text-center font-black text-[#e11d48] text-lg outline-none group-focus-within:border-[#e11d48] transition-all"
                  />
                  <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-800" />
               </div>
            </div>
         </div>

         {/* Extra Info */}
         <div className="hidden lg:flex items-center gap-6">
            <div className="text-left">
               <p className="text-[10px] font-black text-zinc-500 uppercase">معدل التحويل المعتمد</p>
               <p className="font-mono font-black text-zinc-300">1 {settings?.secondaryCurrencySymbol} = {exchangeRate} {settings?.currencySymbol}</p>
            </div>
            <div className="w-px h-10 bg-zinc-800"></div>
            <div className="text-left">
               <p className="text-[10px] font-black text-zinc-500 uppercase">جهة العرض الحالية</p>
               <p className="font-black text-[#e11d48]">{activeCurrencyView === 'primary' ? settings?.currency : settings?.secondaryCurrency}</p>
            </div>
         </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
         <div className={`bg-[#18181b] border border-zinc-800 p-8 rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-xl relative overflow-hidden transition-all ${activeCurrencyView === 'primary' ? 'ring-2 ring-[#e11d48]/50' : 'opacity-60'}`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#e11d48]/5 blur-3xl rounded-full"></div>
            <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest z-10">إجمالي الأرصدة بـ {settings?.currency}</span>
            <div className="flex items-baseline gap-2 z-10">
               <span className="text-5xl font-mono text-[#e11d48] font-black tracking-tighter">{totalPrimaryAll.toLocaleString()}</span>
               <span className="text-xs font-black text-zinc-600">{settings?.currencySymbol}</span>
            </div>
         </div>
         <div className={`bg-[#18181b] border border-zinc-800 p-8 rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-xl relative overflow-hidden transition-all ${activeCurrencyView === 'secondary' ? 'ring-2 ring-amber-500/50' : 'opacity-60'}`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-3xl rounded-full"></div>
            <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest z-10">إجمالي الأرصدة بـ {settings?.secondaryCurrency}</span>
            <div className="flex items-baseline gap-2 z-10">
               <span className="text-5xl font-mono text-amber-500 font-black tracking-tighter">{totalSecondaryAll.toLocaleString()}</span>
               <span className="text-xs font-black text-zinc-600">{settings?.secondaryCurrencySymbol}</span>
            </div>
         </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#0e0e10] rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-[#18181b] text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800 h-16">
                <th className="p-4 text-center w-24">كود</th>
                <th className="p-4">اسم الحساب</th>
                <th className="p-4 text-center">إجمالي الحركات</th>
                <th className="p-4 text-center">إجمالي المدفوعات</th>
                <th className="p-4 text-center font-black">
                  الرصيد الصافي ({isUnifiedView ? 'موحد' : activeCurrencyView === 'primary' ? settings?.currencySymbol : settings?.secondaryCurrencySymbol})
                </th>
                <th className="p-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-bold">
              {balancesData.map((party) => {
                // Determine which data to show based on Unified toggle and Active Currency toggle
                let stats;
                if (isUnifiedView) {
                  stats = {
                    movements: party.unifiedMovements,
                    payments: party.unifiedPayments,
                    net: party.unifiedNet,
                    symbol: activeCurrencyView === 'primary' ? settings?.currencySymbol : settings?.secondaryCurrencySymbol
                  };
                } else {
                  if (activeCurrencyView === 'primary') {
                    stats = {
                      movements: party.primary.totalMovements,
                      payments: party.primary.totalPayments,
                      net: party.primary.netBalance,
                      symbol: settings?.currencySymbol
                    };
                  } else {
                    stats = {
                      movements: party.secondary.totalMovements,
                      payments: party.secondary.totalPayments,
                      net: party.secondary.netBalance,
                      symbol: settings?.secondaryCurrencySymbol
                    };
                  }
                }

                return (
                  <tr key={party.id} className="hover:bg-zinc-900/50 transition-colors h-14 group">
                    <td className="p-4 font-mono text-zinc-600 text-center">{party.code}</td>
                    <td className="p-4 text-white text-lg">
                       {party.name}
                       {party.type === PartyType.BOTH && <span className="mr-2 text-[8px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 uppercase">مشترك</span>}
                    </td>
                    <td className="p-4 text-center font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors">{stats.movements.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono text-emerald-600 group-hover:text-emerald-400 transition-colors">{stats.payments.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono">
                       <span className={`text-xl font-black ${stats.net > 0 ? 'text-[#e11d48]' : stats.net === 0 ? 'text-white/40' : 'text-emerald-500'}`}>
                         {stats.net.toLocaleString()}
                       </span>
                       <span className="text-[9px] mr-1 opacity-40 font-bold uppercase">{stats.symbol}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border ${stats.net > 0 ? 'text-[#e11d48] bg-[#e11d48]/10 border-[#e11d48]/20' : stats.net === 0 ? 'text-zinc-500 bg-zinc-900 border-zinc-800' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'}`}>
                        {stats.net > 0 ? 'مدين' : stats.net === 0 ? 'مسدد' : 'دائن'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center no-print px-4 py-4 text-zinc-600 text-[9px] font-black uppercase tracking-[0.4em]">
         <span>{settings?.companyName} Accounting Terminal</span>
         <span>Version 2026.4.1</span>
      </div>
    </div>
  );
};

export default CustomerBalancesView;
