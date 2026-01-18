
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, UserCheck, AlertCircle, Filter, Calendar } from 'lucide-react';
import { Party, PartyType, SalesInvoice, CashEntry } from '../types';

interface CustomerBalancesViewProps {
  onBack: () => void;
}

const CustomerBalancesView: React.FC<CustomerBalancesViewProps> = ({ onBack }) => {
  const [partyType, setPartyType] = useState<PartyType>(PartyType.CUSTOMER);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [parties, setParties] = useState<Party[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);

  useEffect(() => {
    // Load data for calculation
    const savedInvoices = localStorage.getItem('sheno_sales_invoices');
    const savedCash = localStorage.getItem('sheno_cash_journal');
    
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    if (savedCash) setCashEntries(JSON.parse(savedCash));

    // Mock parties if empty (normally would come from a party list)
    setParties([
      { id: '1', code: '1', name: 'وسيم الشطة', phone: '093', address: 'دمشق', type: PartyType.CUSTOMER, openingBalance: 0 },
      { id: '2', code: '2', name: 'JF', phone: '094', address: 'حلب', type: PartyType.CUSTOMER, openingBalance: 0 },
      { id: '3', code: '3', name: 'بشارة', phone: '095', address: 'دمشق', type: PartyType.CUSTOMER, openingBalance: 0 },
      { id: '4', code: '4', name: 'شركة التوريدات', phone: '011', address: 'حمص', type: PartyType.SUPPLIER, openingBalance: 150000 },
    ]);
  }, []);

  const calculateBalance = (party: Party) => {
    // Filter transactions by party name and date range
    const partyInvoices = invoices.filter(inv => {
      const matchName = inv.customerName === party.name;
      const matchDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
      return matchName && matchDate;
    });

    const partyPayments = cashEntries.filter(entry => {
      const matchName = entry.statement.includes(party.name) || entry.partyName === party.name;
      const matchDate = (!startDate || entry.date >= startDate) && (!endDate || entry.date <= endDate);
      return matchName && matchDate;
    });

    const totalSales = partyInvoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalPayments = partyPayments.reduce((s, p) => {
       // For customers: Received is payment. For suppliers: Paid is payment.
       if (party.type === PartyType.CUSTOMER) return s + p.receivedSYP;
       else return s + p.paidSYP;
    }, 0);

    const balance = party.type === PartyType.CUSTOMER 
      ? (party.openingBalance + totalSales - totalPayments) 
      : (party.openingBalance + totalSales - totalPayments); // Simplified logic

    return { totalSales, totalPayments, balance };
  };

  const filteredParties = parties.filter(p => 
    p.type === partyType && 
    (p.name.includes(searchTerm) || p.code.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">أرصدة {partyType === PartyType.CUSTOMER ? 'العملاء' : 'الموردين'}</h2>
        </div>
      </div>

      <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 flex flex-wrap gap-4 items-center">
        {/* Type Filter */}
        <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700">
           <Filter className="w-4 h-4 text-zinc-500" />
           <select 
             className="bg-transparent text-sm outline-none font-bold"
             value={partyType}
             onChange={e => setPartyType(e.target.value as PartyType)}
           >
              <option value={PartyType.CUSTOMER}>العملاء</option>
              <option value={PartyType.SUPPLIER}>الموردين</option>
           </select>
        </div>

        {/* Name Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو الكود..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-2 pr-10 outline-none text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700">
           <Calendar className="w-4 h-4 text-zinc-500" />
           <span className="text-xs text-zinc-500">من</span>
           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs outline-none font-mono" />
           <span className="text-xs text-zinc-500">إلى</span>
           <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs outline-none font-mono" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800 shadow-2xl">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-rose-900/20 text-rose-200">
              <th className="p-4 border-b border-zinc-700">كود</th>
              <th className="p-4 border-b border-zinc-700">الاسم</th>
              <th className="p-4 border-b border-zinc-700">إجمالي {partyType === PartyType.CUSTOMER ? 'المبيعات' : 'المشتريات'}</th>
              <th className="p-4 border-b border-zinc-700">إجمالي الدفعات</th>
              <th className="p-4 border-b border-zinc-700">الرصيد المتبقي</th>
              <th className="p-4 border-b border-zinc-700">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {filteredParties.map((party) => {
              const { totalSales, totalPayments, balance } = calculateBalance(party);
              return (
                <tr key={party.id} className="hover:bg-zinc-700/30 transition-colors">
                  <td className="p-4 font-mono text-zinc-500">{party.code}</td>
                  <td className="p-4 font-bold text-lg">{party.name}</td>
                  <td className="p-4 font-mono">{totalSales.toLocaleString()}</td>
                  <td className="p-4 font-mono text-emerald-400">{totalPayments.toLocaleString()}</td>
                  <td className={`p-4 font-mono font-bold bg-zinc-900/30 text-xl ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {balance.toLocaleString()}
                  </td>
                  <td className="p-4">
                    {balance !== 0 ? (
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full w-fit ${balance > 0 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                        {balance > 0 ? <AlertCircle className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {balance > 0 ? (partyType === PartyType.CUSTOMER ? 'مدين' : 'دائن') : 'مسدد'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-500 text-xs bg-emerald-500/10 px-2 py-1 rounded-full w-fit">
                        <UserCheck className="w-3 h-3" /> مسدد
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl flex items-center justify-between shadow-inner">
         <div className="text-zinc-500 text-sm">
           يتم احتساب الأرصدة تلقائياً بناءً على فواتير {partyType} والمقبوضات/المدفوعات المسجلة.
         </div>
         <div className="flex gap-4">
            <div className="flex flex-col items-end">
               <span className="text-xs text-zinc-500">إجمالي الأرصدة المتبقية</span>
               <span className="text-2xl font-mono text-rose-500 font-bold">
                 {filteredParties.reduce((sum, p) => sum + calculateBalance(p).balance, 0).toLocaleString()}
               </span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CustomerBalancesView;
