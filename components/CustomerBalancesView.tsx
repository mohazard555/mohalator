
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, UserCheck, Printer, FileDown, Filter, Calendar, Coins, CreditCard, Building } from 'lucide-react';
import { Party, PartyType, SalesInvoice, CashEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

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

    const partyInvoices = invoices.filter(inv => {
      const matchName = inv.customerName === party.name;
      const matchCurrency = inv.currencySymbol === currencySymbol;
      const matchDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
      return matchName && matchCurrency && matchDate;
    });

    const partyPayments = cashEntries.filter(entry => {
      const matchName = entry.statement.includes(party.name) || entry.partyName === party.name;
      const matchDate = (!startDate || entry.date >= startDate) && (!endDate || entry.date <= endDate);
      if (isPrimary) return matchName && matchDate && (entry.receivedSYP > 0 || entry.paidSYP > 0);
      else return matchName && matchDate && (entry.receivedUSD > 0 || entry.paidUSD > 0);
    });

    const totalSales = partyInvoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalPayments = partyPayments.reduce((s, p) => {
       if (party.type === PartyType.CUSTOMER) return s + (isPrimary ? p.receivedSYP : p.receivedUSD);
       else return s + (isPrimary ? p.paidSYP : p.paidUSD);
    }, 0);

    const opening = isPrimary ? (party.openingBalance || 0) : 0;
    const balance = opening + totalSales - totalPayments;
    return { totalSales, totalPayments, balance };
  };

  const filteredParties = parties.filter(p => 
    p.type === partyType && 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm))
  );

  const balancesData = filteredParties.map(p => {
    const calc = calculateBalance(p, currencyFilter);
    return { ...p, ...calc };
  });

  const totalPrimaryAll = filteredParties.reduce((sum, p) => sum + calculateBalance(p, 'primary').balance, 0);
  const totalSecondaryAll = filteredParties.reduce((sum, p) => sum + calculateBalance(p, 'secondary').balance, 0);

  return (
    <div className="space-y-6">
      {/* Print Header */}
      <div className="print-only print-header flex justify-between items-center bg-zinc-900 p-8 rounded-t-3xl text-white mb-0 border-b-4 border-primary">
        <div className="flex items-center gap-6">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-20 h-20 object-contain bg-white p-1 rounded-2xl" />}
          <div>
            <h1 className="text-3xl font-black">{settings?.companyName}</h1>
            <p className="text-sm font-bold opacity-70 tracking-widest">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black underline decoration-primary underline-offset-8">كشف أرصدة {partyType === PartyType.CUSTOMER ? 'العملاء' : 'الموردين'} الكلي</h2>
          <div className="flex gap-4 justify-center mt-3">
             <span className="bg-white/10 px-3 py-1 rounded-lg text-xs font-bold border border-white/20">تاريخ الكشف: {new Date().toLocaleDateString('ar-SA')}</span>
          </div>
        </div>
        <div className="text-left text-xs font-bold space-y-1">
          <p className="text-primary font-black uppercase">إدارة الحسابات العامة</p>
          <p>{settings?.address}</p>
          <p dir="ltr">{settings?.phone}</p>
        </div>
      </div>

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"><ArrowRight className="w-6 h-6" /></button>
          <h2 className="text-2xl font-black text-readable">أرصدة {partyType === PartyType.CUSTOMER ? 'العملاء' : 'الموردين'}</h2>
        </div>
        <div className="flex gap-2">
           <button onClick={() => exportToCSV(balancesData, 'customer_balances')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2"><FileDown className="w-5 h-5" /> تصدير XLSX</button>
           <button onClick={() => window.print()} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary/20"><Printer className="w-5 h-5" /> طباعة الكشف</button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 items-center shadow-sm no-print">
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border">
           <Filter className="w-4 h-4 text-zinc-500" />
           <select className="bg-transparent text-sm outline-none font-black" value={partyType} onChange={e => setPartyType(e.target.value as PartyType)}>
              <option value={PartyType.CUSTOMER}>العملاء</option>
              <option value={PartyType.SUPPLIER}>الموردين</option>
           </select>
        </div>
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-2xl border">
           <button onClick={() => setCurrencyFilter('primary')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${currencyFilter === 'primary' ? 'bg-primary text-white shadow-md' : 'text-zinc-500'}`}><Coins className="w-3 h-3" /> {settings?.currency || 'الأساسية'}</button>
           <button onClick={() => setCurrencyFilter('secondary')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${currencyFilter === 'secondary' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500'}`}><CreditCard className="w-3 h-3" /> {settings?.secondaryCurrency || 'الثانوية'}</button>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input type="text" placeholder="البحث بالاسم أو الكود..." className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-2.5 pr-12 pl-4 outline-none focus:ring-2 focus:ring-primary transition-all font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center shadow-xl gap-2 border-l-8 border-l-primary">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">إجمالي أرصدة الحسابات بالـ {settings?.currency}</span>
            <span className="text-4xl font-mono text-primary font-black">{totalPrimaryAll.toLocaleString()} <span className="text-sm opacity-50">{settings?.currencySymbol}</span></span>
         </div>
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center shadow-xl gap-2 border-l-8 border-l-amber-500">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">إجمالي أرصدة الحسابات بالـ {settings?.secondaryCurrency}</span>
            <span className="text-4xl font-mono text-amber-600 font-black">{totalSecondaryAll.toLocaleString()} <span className="text-sm opacity-50">{settings?.secondaryCurrencySymbol}</span></span>
         </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl print:border-zinc-900 print:rounded-none">
        <table className="w-full text-right border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-900 text-[10px] text-white font-black uppercase tracking-widest border-b border-zinc-700">
              <th className="p-4 border-l border-zinc-800">كود</th>
              <th className="p-4 border-l border-zinc-800">اسم الحساب</th>
              <th className="p-4 border-l border-zinc-800">إجمالي الحركات</th>
              <th className="p-4 border-l border-zinc-800">إجمالي المدفوعات</th>
              <th className="p-4 border-l border-zinc-800">الرصيد الصافي</th>
              <th className="p-4 text-center">الحالة المالية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
            {balancesData.length === 0 ? (
              <tr><td colSpan={6} className="p-20 text-center text-zinc-400 italic">لا يوجد حسابات مسجلة</td></tr>
            ) : balancesData.map((party) => (
              <tr key={party.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="p-4 font-mono text-zinc-400 border-l border-zinc-100 dark:border-zinc-800">{party.code}</td>
                <td className="p-4 text-readable border-l border-zinc-100 dark:border-zinc-800">{party.name}</td>
                <td className="p-4 font-mono border-l border-zinc-100 dark:border-zinc-800">{party.totalSales.toLocaleString()}</td>
                <td className="p-4 font-mono text-emerald-600 border-l border-zinc-100 dark:border-zinc-800">{party.totalPayments.toLocaleString()}</td>
                <td className={`p-4 font-mono font-black text-lg bg-zinc-50/30 dark:bg-zinc-800/10 border-l border-zinc-100 dark:border-zinc-800 ${party.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {party.balance.toLocaleString()} {currencyFilter === 'primary' ? settings?.currencySymbol : settings?.secondaryCurrencySymbol}
                </td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${party.balance > 0 ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : party.balance < 0 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-zinc-400 bg-zinc-100'}`}>
                    {party.balance > 0 ? (partyType === PartyType.CUSTOMER ? 'مدين' : 'دائن') : party.balance < 0 ? 'له رصيد' : 'مسدد'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-only mt-10 flex justify-between items-end border-t-2 border-zinc-100 pt-6">
         <div className="text-center space-y-6">
            <span className="text-[10px] font-black text-zinc-400 uppercase">المحاسب المعتمد</span>
            <div className="w-48 border-b-2 border-zinc-200"></div>
            <p className="font-black text-xs">{settings?.accountantName}</p>
         </div>
         <div className="text-center space-y-6">
            <span className="text-[10px] font-black text-zinc-400 uppercase">المدير العام</span>
            <div className="w-48 border-b-2 border-zinc-200"></div>
            <p className="font-black text-xs">{settings?.managerName}</p>
         </div>
      </div>
    </div>
  );
};

export default CustomerBalancesView;
