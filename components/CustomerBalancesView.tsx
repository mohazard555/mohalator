
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, UserCheck, AlertCircle, Filter, Calendar, Coins, CreditCard } from 'lucide-react';
import { Party, PartyType, SalesInvoice, CashEntry, AppSettings } from '../types';

interface CustomerBalancesViewProps {
  onBack: () => void;
}

const CustomerBalancesView: React.FC<CustomerBalancesViewProps> = ({ onBack }) => {
  const [partyType, setPartyType] = useState<PartyType>(PartyType.CUSTOMER);
  const [currencyFilter, setCurrencyFilter] = useState<'primary' | 'secondary'>('primary');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
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

  const calculateBalance = (party: Party, targetCurrency: 'primary' | 'secondary') => {
    const isPrimary = targetCurrency === 'primary';
    const currencySymbol = isPrimary ? (settings?.currencySymbol || 'ل.س') : (settings?.secondaryCurrencySymbol || '$');

    // Filter invoices by currency and party
    const partyInvoices = invoices.filter(inv => {
      const matchName = inv.customerName === party.name;
      const matchCurrency = inv.currencySymbol === currencySymbol;
      const matchDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
      return matchName && matchCurrency && matchDate;
    });

    const partyPayments = cashEntries.filter(entry => {
      const matchName = entry.statement.includes(party.name) || entry.partyName === party.name;
      const matchDate = (!startDate || entry.date >= startDate) && (!endDate || entry.date <= endDate);
      
      if (isPrimary) {
        return matchName && matchDate && (entry.receivedSYP > 0 || entry.paidSYP > 0);
      } else {
        return matchName && matchDate && (entry.receivedUSD > 0 || entry.paidUSD > 0);
      }
    });

    const totalSales = partyInvoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalPayments = partyPayments.reduce((s, p) => {
       if (party.type === PartyType.CUSTOMER) return s + (isPrimary ? p.receivedSYP : p.receivedUSD);
       else return s + (isPrimary ? p.paidSYP : p.paidUSD);
    }, 0);

    // Initial balance only applies to primary currency for simplicity in this model
    const opening = isPrimary ? party.openingBalance : 0;
    const balance = opening + totalSales - totalPayments;

    return { totalSales, totalPayments, balance };
  };

  const filteredParties = parties.filter(p => 
    p.type === partyType && 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm))
  );

  const getGlobalTotals = () => {
    return filteredParties.reduce((acc, p) => {
      const pData = calculateBalance(p, currencyFilter);
      return acc + pData.balance;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">أرصدة {partyType === PartyType.CUSTOMER ? 'العملاء' : 'الموردين'}</h2>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700">
           <Filter className="w-4 h-4 text-zinc-500" />
           <select 
             className="bg-transparent text-sm outline-none font-black"
             value={partyType}
             onChange={e => setPartyType(e.target.value as PartyType)}
           >
              <option value={PartyType.CUSTOMER}>العملاء</option>
              <option value={PartyType.SUPPLIER}>الموردين</option>
           </select>
        </div>

        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-2xl border">
           <button 
             onClick={() => setCurrencyFilter('primary')}
             className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${currencyFilter === 'primary' ? 'bg-primary text-white shadow-md' : 'text-zinc-500'}`}
           >
             <Coins className="w-3 h-3" /> {settings?.currency || 'الأساسية'}
           </button>
           <button 
             onClick={() => setCurrencyFilter('secondary')}
             className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${currencyFilter === 'secondary' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500'}`}
           >
             <CreditCard className="w-3 h-3" /> {settings?.secondaryCurrency || 'الثانوية'}
           </button>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو الكود..."
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-2.5 pr-12 pl-4 outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700">
           <Calendar className="w-4 h-4 text-zinc-400" />
           <span className="text-[10px] font-black text-zinc-500 uppercase">من</span>
           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs outline-none font-mono" />
           <span className="text-[10px] font-black text-zinc-500 uppercase">إلى</span>
           <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs outline-none font-mono" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <table className="w-full text-right border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
              <th className="p-4">كود</th>
              <th className="p-4">الاسم</th>
              <th className="p-4">إجمالي {partyType === PartyType.CUSTOMER ? 'المبيعات' : 'المشتريات'}</th>
              <th className="p-4">إجمالي الدفعات</th>
              <th className="p-4">الرصيد بالـ {currencyFilter === 'primary' ? (settings?.currencySymbol) : (settings?.secondaryCurrencySymbol)}</th>
              <th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
            {filteredParties.length === 0 ? (
              <tr><td colSpan={6} className="p-20 text-center text-zinc-400 italic">لا يوجد حسابات تطابق البحث.</td></tr>
            ) : filteredParties.map((party) => {
              const { totalSales, totalPayments, balance } = calculateBalance(party, currencyFilter);
              return (
                <tr key={party.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 font-mono text-zinc-400">{party.code}</td>
                  <td className="p-4 text-readable">{party.name}</td>
                  <td className="p-4 font-mono">{totalSales.toLocaleString()}</td>
                  <td className="p-4 font-mono text-emerald-600">{totalPayments.toLocaleString()}</td>
                  <td className={`p-4 font-mono font-black text-lg bg-zinc-50/50 dark:bg-zinc-800/20 ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {balance.toLocaleString()} {currencyFilter === 'primary' ? settings?.currencySymbol : settings?.secondaryCurrencySymbol}
                  </td>
                  <td className="p-4">
                    {balance !== 0 ? (
                      <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full w-fit uppercase ${balance > 0 ? 'text-rose-500 bg-rose-500/10 border border-rose-500/20' : 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'}`}>
                        {balance > 0 ? (partyType === PartyType.CUSTOMER ? 'مدين' : 'دائن') : (partyType === PartyType.CUSTOMER ? 'له رصيد' : 'سدد زيادة')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-500 text-[9px] font-black bg-emerald-500/10 px-2 py-1 rounded-full w-fit uppercase border border-emerald-500/20">
                        <UserCheck className="w-3 h-3" /> مسدد بالكامل
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl flex flex-col items-center justify-center shadow-xl gap-2 border-l-4 border-l-rose-500">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">إجمالي الذمم بالـ {settings?.currency}</span>
            <span className="text-3xl font-mono text-rose-600 font-black">
              {filteredParties.reduce((sum, p) => sum + calculateBalance(p, 'primary').balance, 0).toLocaleString()} <span className="text-sm opacity-50">{settings?.currencySymbol}</span>
            </span>
         </div>
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl flex flex-col items-center justify-center shadow-xl gap-2 border-l-4 border-l-amber-500">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">إجمالي الذمم بالـ {settings?.secondaryCurrency}</span>
            <span className="text-3xl font-mono text-amber-600 font-black">
              {filteredParties.reduce((sum, p) => sum + calculateBalance(p, 'secondary').balance, 0).toLocaleString()} <span className="text-sm opacity-50">{settings?.secondaryCurrencySymbol}</span>
            </span>
         </div>
      </div>
    </div>
  );
};

export default CustomerBalancesView;
