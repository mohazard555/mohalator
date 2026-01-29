
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Search, UserCheck, Printer, FileDown, Filter, Calendar, Coins, CreditCard, Building, RefreshCcw, Calculator, ChevronDown, Users, Briefcase, Share2, MapPin, Phone } from 'lucide-react';
import { Party, PartyType, SalesInvoice, CashEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

interface CustomerBalancesViewProps {
  onBack: () => void;
}

const CustomerBalancesView: React.FC<CustomerBalancesViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [partyType, setPartyType] = useState<PartyType | 'الكل'>(PartyType.CUSTOMER);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Currency Toggle
  const [activeCurrencyView, setActiveCurrencyView] = useState<'primary' | 'secondary'>('primary');

  // Converter States
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
      {/* UI Action Bar (No Print) */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-slate-800 text-white hover:bg-slate-700 rounded-xl transition-colors shadow-lg">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable tracking-tight">أرصدة العملاء والموردين</h2>
        </div>
        <div className="flex gap-2">
           <button onClick={() => exportToCSV(balancesData, 'customer_balances')} className="bg-slate-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-slate-700 hover:bg-slate-700 transition-all">
             <FileDown className="w-5 h-5" /> تصدير XLSX
           </button>
           <button onClick={() => window.print()} className="bg-[#e11d48] text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-rose-900/20 hover:brightness-110 transition-all">
             <Printer className="w-5 h-5" /> طباعة الكشف
           </button>
        </div>
      </div>

      {/* Main Filter & Currency Toggle Bar (No Print) - Updated for better visuals */}
      <div className="bg-[#0f172a] p-5 rounded-3xl border border-slate-800 flex flex-wrap items-center gap-6 no-print shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
        
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 gap-1 relative z-10">
           <button onClick={() => setPartyType('الكل')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${partyType === 'الكل' ? 'bg-[#e11d48] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>الكل</button>
           <button onClick={() => setPartyType(PartyType.CUSTOMER)} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${partyType === PartyType.CUSTOMER ? 'bg-[#e11d48] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>العملاء</button>
           <button onClick={() => setPartyType(PartyType.SUPPLIER)} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${partyType === PartyType.SUPPLIER ? 'bg-[#e11d48] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>الموردين</button>
           <button onClick={() => setPartyType(PartyType.BOTH)} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${partyType === PartyType.BOTH ? 'bg-[#e11d48] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>مشترك</button>
        </div>

        <div className="relative flex-1 min-w-[250px] z-10">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو الكود..." 
            className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl py-3 pr-12 pl-4 outline-none font-bold text-white focus:border-[#e11d48] focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex bg-slate-900/80 border border-slate-800 p-1 rounded-full h-12 items-center z-10 shadow-lg">
           <button onClick={() => setActiveCurrencyView('secondary')} className={`flex items-center gap-2 px-6 h-full rounded-full text-xs font-black transition-all ${activeCurrencyView === 'secondary' ? 'bg-[#e11d48] text-white shadow-md' : 'text-slate-500'}`}><CreditCard className="w-4 h-4" /> {settings?.secondaryCurrency || 'دولار'}</button>
           <button onClick={() => setActiveCurrencyView('primary')} className={`flex items-center gap-2 px-6 h-full rounded-full text-xs font-black transition-all ${activeCurrencyView === 'primary' ? 'bg-[#e11d48] text-white shadow-md' : 'text-slate-500'}`}><Coins className="w-4 h-4" /> {settings?.currency || 'ليرة'}</button>
        </div>
      </div>

      {/* Design Matching the Image for Printing */}
      <div ref={reportRef} className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-2xl p-4 md:p-8 print:p-0 print:border-none print:shadow-none export-fix">
        
        {/* Professional Header - Matches provided image layout */}
        <div className="flex justify-between items-start mb-2 border-b-4 border-[#e11d48] pb-6 bg-white text-zinc-900 print:mb-8 print:mx-4">
           {/* Right Part: Logo & Company Name */}
           <div className="flex items-center gap-4">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} className="w-20 h-20 object-contain bg-white rounded-xl p-1" alt="Logo" />
              ) : (
                <div className="w-16 h-16 bg-[#e11d48] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">SH</div>
              )}
              <div>
                 <h1 className="text-3xl font-black text-[#e11d48] leading-tight">{settings?.companyName || 'مطبعة شينو'}</h1>
                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{settings?.companyType}</p>
              </div>
           </div>

           {/* Center Part: Report Title */}
           <div className="text-center pt-2">
              <h2 className="text-3xl font-black text-zinc-900 border-b-2 border-zinc-100 inline-block px-8 pb-1 mb-3">كشف أرصدة الحسابات</h2>
              <div className="flex flex-col items-center">
                 <div className="flex items-center gap-2 bg-zinc-50 px-4 py-1.5 rounded-full border border-zinc-100 no-print-visible">
                    <span className="text-xs font-bold text-zinc-500">نوع الطرف:</span>
                    <span className="text-sm font-black text-[#e11d48] uppercase tracking-tighter">{partyType === 'الكل' ? 'جميع الجهات المعتمدة' : partyType}</span>
                 </div>
                 <div className="text-[11px] mt-2 font-mono font-bold text-zinc-400">
                    {new Date().toLocaleDateString('ar-SA')} | SAMLATOR SECURED LEDGER
                 </div>
              </div>
           </div>

           {/* Left Part: Contact Info */}
           <div className="text-left space-y-1">
              <div className="flex items-center justify-end gap-2 text-zinc-500">
                 <span className="text-xs font-bold">{settings?.address || 'دمشق، سوريا'}</span>
                 <MapPin className="w-4 h-4 text-[#e11d48]" />
              </div>
              <div className="flex items-center justify-end gap-2 text-zinc-500" dir="ltr">
                 <Phone className="w-4 h-4 text-[#e11d48]" />
                 <span className="text-xs font-bold">{settings?.phone || '093XXXXXXX'}</span>
              </div>
              <div className="text-[10px] font-black text-zinc-400 uppercase pt-2">
                 تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}
              </div>
           </div>
        </div>

        {/* Action Bar inside report - Updated to Deep Slate Blue (Eye Friendly) */}
        <div className="no-print bg-slate-900/90 p-6 rounded-[2rem] border border-slate-800 flex justify-between items-center mb-8 shadow-inner overflow-hidden group">
           <div className="flex items-center gap-6 relative z-10">
              <button 
                onClick={() => setIsUnifiedView(!isUnifiedView)} 
                className={`px-6 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-md ${isUnifiedView ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                 <RefreshCcw className="w-4 h-4" /> {isUnifiedView ? 'العرض الموحد مفعّل' : 'تفعيل العرض الموحد'}
              </button>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">سعر الصرف</span>
                 <div className="relative">
                    <input type="number" value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))} className="w-28 bg-slate-950 border border-slate-700 p-2 rounded-xl text-center font-black text-primary text-sm outline-none focus:border-primary transition-all shadow-inner" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                 </div>
              </div>
           </div>
           
           <div className="flex gap-8 relative z-10">
              <div className="text-center group-hover:scale-105 transition-transform">
                 <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">إجمالي {settings?.currencySymbol}</p>
                 <p className="font-mono font-black text-white text-xl tracking-tighter">{totalPrimaryAll.toLocaleString()}</p>
              </div>
              <div className="w-px h-10 bg-slate-800 shadow-sm"></div>
              <div className="text-center group-hover:scale-105 transition-transform">
                 <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">إجمالي {settings?.secondaryCurrencySymbol}</p>
                 <p className="font-mono font-black text-amber-500 text-xl tracking-tighter">{totalSecondaryAll.toLocaleString()}</p>
              </div>
           </div>
        </div>

        {/* Table - Matches the visual style of the provided image */}
        <div className="overflow-x-auto print:mx-4">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-100 text-zinc-900 font-black border-b-2 border-zinc-300 h-14 uppercase tracking-tighter print:bg-zinc-100 print:text-black">
                <th className="p-4 border-l border-zinc-200 text-center w-24">كود</th>
                <th className="p-4 border-l border-zinc-200">الاسم والبيان</th>
                <th className="p-4 border-l border-zinc-200 text-center">إجمالي المسحوبات</th>
                <th className="p-4 border-l border-zinc-200 text-center">إجمالي المدفوعات</th>
                <th className="p-4 border-l border-zinc-200 text-center bg-zinc-50/50 print:bg-zinc-100">الرصيد الصافي</th>
                <th className="p-4 text-center">حالة الحساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-bold bg-white text-zinc-800 print:divide-zinc-200">
              {balancesData.length === 0 ? (
                 <tr><td colSpan={6} className="p-20 text-center italic text-zinc-300">لا يوجد بيانات لعرضها</td></tr>
              ) : balancesData.map((party) => {
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
                  <tr key={party.id} className="hover:bg-zinc-50 transition-colors h-14 print:h-12">
                    <td className="p-4 font-mono text-zinc-400 text-center border-l border-zinc-100">{party.code}</td>
                    <td className="p-4 text-zinc-900 text-lg border-l border-zinc-100 print:text-base">
                       {party.name}
                       {party.type === PartyType.BOTH && <span className="mr-2 text-[8px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-400 font-black">مشترك</span>}
                    </td>
                    <td className="p-4 text-center font-mono text-zinc-500 border-l border-zinc-100">{stats.movements.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono text-emerald-600 border-l border-zinc-100">{stats.payments.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono border-l border-zinc-100 bg-zinc-50/20 print:bg-transparent">
                       <span className={`text-xl font-black print:text-lg ${stats.net > 0 ? 'text-[#e11d48]' : stats.net === 0 ? 'text-zinc-300' : 'text-emerald-600'}`}>
                         {stats.net.toLocaleString()}
                       </span>
                       <span className="text-[9px] mr-1 text-zinc-400 font-bold uppercase">{stats.symbol}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border ${stats.net > 0 ? 'text-[#e11d48] bg-[#e11d48]/5 border-[#e11d48]/20' : stats.net === 0 ? 'text-zinc-400 bg-zinc-50 border-zinc-200' : 'text-emerald-600 bg-emerald-50 border-emerald-100'} print:border-none print:p-0`}>
                        {stats.net > 0 ? 'مدين' : stats.net === 0 ? 'مسدد' : 'دائن'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer for Grand Totals */}
            <tfoot>
               <tr className="bg-zinc-50 font-black border-t-2 border-zinc-300 h-14 print:bg-zinc-50 print:text-black">
                  <td colSpan={2} className="p-4 text-center text-zinc-500 uppercase text-[10px] tracking-widest">إجمالي الأرصدة المفتوحة</td>
                  <td colSpan={2} className="p-4 text-center">---</td>
                  <td className="p-4 text-center font-mono text-2xl text-[#e11d48] print:text-xl">
                     {totalPrimaryAll.toLocaleString()} <span className="text-xs">{settings?.currencySymbol}</span>
                  </td>
                  <td className="p-4 text-center">---</td>
               </tr>
            </tfoot>
          </table>
        </div>

        {/* Print Only Footer - Matches Professional Accounting Style */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-8 border-t border-zinc-200 text-[10px] font-black text-zinc-400 mx-4">
           <div className="flex flex-col">
              <span>SAMLATOR SYSTEM | FINANCIAL LOGS TERMINAL</span>
              <span>تاريخ استخراج هذا التقرير: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="text-center">
              <div className="w-48 border-b-2 border-zinc-200 mb-2 mx-auto"></div>
              <span>توقيع مدير الحسابات / والختم الرسمي</span>
           </div>
           <div className="text-left italic opacity-50">
              {settings?.companyName} Accounting Terminal v4.1
           </div>
        </div>
      </div>

      {/* Bottom Sticky Branding for UI */}
      <div className="flex justify-between items-center no-print px-4 py-4 text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">
         <span>{settings?.companyName} Accounting Terminal</span>
         <span>Version 2026.4.1 | SYRIA</span>
      </div>
    </div>
  );
};

export default CustomerBalancesView;
