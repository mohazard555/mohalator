
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Search, FileOutput, X, Users, Box, HardDrive, Calendar } from 'lucide-react';
import { SalesInvoice, InvoiceItem, CashEntry, Party, PartyType, AppSettings } from '../types';

const tafqeet = (n: number, currencyName: string): string => {
  if (n === 0) return "صفر";
  return `${n.toLocaleString()} ${currencyName} فقط لا غير`;
};

interface DetailedSalesReportViewProps {
  onBack: () => void;
}

const DetailedSalesReportView: React.FC<DetailedSalesReportViewProps> = ({ onBack }) => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [customerFilter, setCustomerFilter] = useState('');
  const [parties, setParties] = useState<Party[]>([]);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const savedInvoices = localStorage.getItem('sheno_sales_invoices');
    const savedCash = localStorage.getItem('sheno_cash_journal');
    const savedParties = localStorage.getItem('sheno_parties');
    const savedSettings = localStorage.getItem('sheno_settings');
    
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    if (savedCash) setCashEntries(JSON.parse(savedCash));
    if (savedParties) setParties(JSON.parse(savedParties).filter((p: Party) => p.type === PartyType.CUSTOMER));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesCustomer = !customerFilter || inv.customerName === customerFilter;
    const matchesDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
    return matchesCustomer && matchesDate;
  });

  const reportRows = filteredInvoices.flatMap(inv => 
    inv.items.map(item => ({
      ...item,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.date,
      usedMaterials: inv.usedMaterials || [],
      currencySymbol: inv.currencySymbol || settings?.currencySymbol || 'ل.س'
    }))
  );

  const totalSales = filteredInvoices.reduce((s, c) => s + c.totalAmount, 0);
  const totalPaid = cashEntries
    .filter(e => {
      const isSelectedCustomer = !customerFilter || e.partyName === customerFilter || e.statement.includes(customerFilter);
      const isWithinDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
      return isSelectedCustomer && isWithinDate;
    })
    .reduce((s, c) => s + (c.receivedSYP + c.receivedUSD), 0);

  const totalRemaining = totalSales - totalPaid;
  const totalItemsCount = reportRows.reduce((s, c) => s + c.quantity, 0);
  const totalInvoicesCount = filteredInvoices.length;

  return (
    <div className="space-y-4 text-right bg-[#f2f2f2] p-8 rounded-lg shadow-2xl min-h-screen text-zinc-900 border-2 border-zinc-300 print:bg-white print:border-none print:shadow-none" dir="rtl">
      
      {/* Print Header */}
      <div className="print-only print-header flex justify-between items-center bg-rose-900 p-6 rounded-t-xl text-white mb-0 border-b-0">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
          <div>
            <h1 className="text-2xl font-black">{settings?.companyName}</h1>
            <p className="text-xs opacity-80">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black underline decoration-white/30 underline-offset-8">كشف حساب زبون تفصيلي</h2>
          <p className="text-[10px] mt-2 opacity-80 font-bold">{customerFilter || 'جميع الزبائن'}</p>
          <p className="text-[9px] mt-1 opacity-70 flex items-center justify-center gap-1"><Calendar className="w-3 h-3"/> {startDate} ← {endDate}</p>
        </div>
        <div className="text-left text-xs font-bold space-y-1">
          <p>{settings?.address}</p>
          <p>{settings?.phone}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b-2 border-zinc-400 pb-4 mb-4 no-print">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white hover:bg-zinc-100 rounded-xl border border-zinc-300 transition-all">
               <ArrowRight className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
               {settings?.logoUrl ? (
                 <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded" />
               ) : (
                  <div className="bg-rose-900 p-2 rounded shadow-sm border border-zinc-300 w-12 h-12 flex items-center justify-center text-white font-black">
                     {settings?.companyName.substring(0,2).toUpperCase() || 'SH'}
                  </div>
               )}
               <div className="flex flex-col">
                 <span className="text-zinc-800 font-black text-xl leading-none">{settings?.companyName || 'شينو للمحاسبة'}</span>
                 <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest">{settings?.address || 'Accounting System'}</span>
               </div>
            </div>
         </div>
         <h1 className="text-3xl font-black flex-1 text-center tracking-tight text-zinc-800">كشف حساب زبون مفصل</h1>
         <div className="text-xs font-mono text-zinc-400 bg-white px-3 py-1 rounded border border-zinc-200">#{new Date().getTime().toString().slice(-6)}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-2 border-zinc-500 bg-white overflow-hidden rounded-sm no-print">
         <div className="col-span-1 border-l-2 border-zinc-500 flex flex-col">
            <div className="flex border-b-2 border-zinc-500 flex-1">
               <div className="bg-[#e2e8f0] flex-1 p-2 text-xs font-bold text-center border-l border-zinc-300 flex items-center justify-center">اجمالي عدد القطع</div>
               <div className="flex-1 p-2 text-center font-black text-2xl flex items-center justify-center">{totalItemsCount}</div>
            </div>
            <div className="flex flex-1">
               <div className="bg-[#e2e8f0] flex-1 p-2 text-xs font-bold text-center border-l border-zinc-300 flex items-center justify-center">اجمالي عدد الفواتير</div>
               <div className="flex-1 p-2 text-center font-black text-2xl flex items-center justify-center">{totalInvoicesCount}</div>
            </div>
         </div>

         <div className="col-span-1 border-l-2 border-zinc-500 flex flex-col">
            <div className="flex border-b-2 border-zinc-500 flex-1">
               <div className="bg-[#e2e8f0] w-32 p-2 text-xs font-bold text-center border-l border-zinc-300 flex items-center justify-center">بداية التاريخ</div>
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 text-center font-mono outline-none text-lg" />
            </div>
            <div className="flex flex-1">
               <div className="bg-[#e2e8f0] w-32 p-2 text-xs font-bold text-center border-l border-zinc-300 flex items-center justify-center">نهاية التاريخ</div>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 text-center font-mono outline-none text-lg" />
            </div>
         </div>

         <div className="col-span-1 flex flex-col bg-zinc-50">
            <div className="bg-[#e2e8f0] p-2 text-xs font-bold text-center border-b border-zinc-300 flex items-center justify-center gap-2">
               <Users className="w-3 h-3"/> اختيار الزبون من القائمة
            </div>
            <select 
              value={customerFilter} 
              onChange={e => setCustomerFilter(e.target.value)} 
              className="flex-1 text-center font-black text-xl outline-none py-4 appearance-none cursor-pointer bg-white text-rose-800"
            >
              <option value="">-- عرض جميع الزبائن --</option>
              {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
         </div>
      </div>

      <div className="relative overflow-x-auto border-2 border-zinc-500 bg-white shadow-lg print:border-rose-900 print:rounded-none">
        <table className="w-full text-right border-collapse text-[10px]">
          <thead>
            <tr className="bg-rose-900 text-white font-black border-b-2 border-rose-950 h-10">
              <th className="p-1 border border-rose-800 w-12 text-center">فاتورة</th>
              <th className="p-1 border border-rose-800 w-20 text-center">التاريخ</th>
              <th className="p-1 border border-rose-800 text-right pr-4">الصنف وتفاصيله</th>
              <th className="p-1 border border-rose-800 text-right pr-4">المواد المستخدمة</th>
              <th className="p-1 border border-rose-800 w-12 text-center">العدد</th>
              <th className="p-1 border border-rose-800 w-24 text-center">السعر</th>
              <th className="p-1 border border-rose-800 w-24 text-center">المجموع</th>
            </tr>
          </thead>
          <tbody>
            {reportRows.length === 0 ? (
              Array.from({ length: 15 }).map((_, i) => (
                <tr key={i} className="h-8 border-b border-zinc-200">
                  {Array.from({ length: 7 }).map((__, j) => <td key={j} className="border border-zinc-200"></td>)}
                </tr>
              ))
            ) : (
              reportRows.map((row, idx) => (
                <tr key={idx} className="h-10 border-b border-zinc-200 font-bold hover:bg-rose-50 transition-colors">
                  <td className="p-1 border border-zinc-200 font-mono text-rose-700 text-center">#{row.invoiceNumber}</td>
                  <td className="p-1 border border-zinc-200 font-mono text-center text-zinc-500">{row.invoiceDate}</td>
                  <td className="p-1 border border-zinc-200 text-right pr-4">
                    <div className="flex items-center gap-2">
                       {row.image && <img src={row.image} className="w-6 h-6 object-cover rounded shadow-sm border border-zinc-200" />}
                       <div className="flex flex-col">
                          <span className="text-zinc-900">{row.name}</span>
                          {row.serialNumber && <span className="text-[8px] text-zinc-400 font-mono uppercase">SN: {row.serialNumber}</span>}
                       </div>
                    </div>
                  </td>
                  <td className="p-1 border border-zinc-200 text-right pr-4 bg-zinc-50/50 print:bg-transparent">
                     <div className="flex flex-wrap gap-1">
                        {row.usedMaterials.length > 0 ? (
                          row.usedMaterials.map((m: any, i: number) => (
                            <span key={i} className="bg-rose-500/5 text-rose-600 px-1.5 py-0.5 rounded-sm border border-rose-200 text-[8px] flex items-center gap-1">
                               <HardDrive className="w-2 h-2 opacity-50"/> {m.name} ({m.quantity})
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-300 font-normal italic">لا يوجد مواد</span>
                        )}
                     </div>
                  </td>
                  <td className="p-1 border border-zinc-200 font-mono text-center text-sm">{row.quantity}</td>
                  <td className="p-1 border border-zinc-200 font-mono text-center">{row.price.toLocaleString()}</td>
                  <td className="p-1 border border-zinc-200 font-mono font-black text-center text-emerald-700 bg-emerald-50 print:bg-transparent">{(row.quantity * row.price).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="border-t-4 border-rose-900">
          <div className="flex border-b border-zinc-300 h-12 items-center hover:bg-zinc-50 transition-all">
             <div className="bg-rose-100 w-64 border-l border-zinc-400 p-3 font-black text-center text-sm">اجمالي المبيعات</div>
             <div className="flex-1 p-2 font-mono font-black text-3xl px-8 text-rose-900">
               {totalSales.toLocaleString()} <span className="text-sm font-bold opacity-60">{settings?.currencySymbol}</span>
             </div>
          </div>
          <div className="flex border-b border-zinc-300 h-12 items-center hover:bg-zinc-50 transition-all">
             <div className="bg-emerald-100 w-64 border-l border-zinc-400 p-3 font-black text-center text-sm">الرصيد المدفوع</div>
             <div className="flex-1 p-2 font-mono font-black text-3xl px-8 text-emerald-700">
               {totalPaid.toLocaleString()} <span className="text-sm font-bold opacity-60">{settings?.currencySymbol}</span>
             </div>
          </div>
          <div className="flex h-12 items-center bg-rose-50 hover:bg-rose-100 transition-all">
             <div className="bg-rose-200 w-64 border-l border-zinc-400 p-3 font-black text-center text-sm">الرصيد المتبقي</div>
             <div className="flex-1 p-2 font-mono font-black text-3xl px-8 text-rose-700">
               {totalRemaining.toLocaleString()} <span className="text-sm font-bold opacity-60">{settings?.currencySymbol}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 border-2 border-zinc-500 bg-white rounded-sm overflow-hidden shadow-md print:border-rose-900">
         <div className="col-span-3 flex flex-col divide-y divide-zinc-200 text-[10px] font-bold bg-white">
            <div className="p-2.5 px-8 text-zinc-800 underline underline-offset-4 decoration-zinc-300">{tafqeet(totalSales, settings?.currency || 'ليرة سورية')}</div>
            <div className="p-2.5 px-8 text-zinc-800 underline underline-offset-4 decoration-zinc-300">{tafqeet(totalPaid, settings?.currency || 'ليرة سورية')}</div>
            <div className="p-2.5 px-8 text-rose-800 underline underline-offset-4 decoration-rose-300 font-black">{tafqeet(totalRemaining, settings?.currency || 'ليرة سورية')}</div>
         </div>
         <div className="col-span-1 border-r border-zinc-500 flex flex-col divide-y divide-zinc-200 font-black text-[10px] bg-[#f8fafc] print:border-rose-900">
            <div className="p-2.5 pr-6 text-left border-l border-zinc-200">المبيع كتابةً</div>
            <div className="p-2.5 pr-6 text-left border-l border-zinc-200">المدفوع كتابةً</div>
            <div className="p-2.5 pr-6 text-left border-l border-zinc-200">المتبقي كتابةً</div>
         </div>
      </div>
      
      <div className="flex justify-between items-center no-print pt-6 pb-20">
         <button onClick={onBack} className="bg-zinc-800 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:bg-zinc-700 transition-all active:scale-95 flex items-center gap-2">
            العودة للرئيسية
         </button>
         <button onClick={() => window.print()} className="bg-rose-900 text-white px-12 py-3 rounded-xl flex items-center gap-2 font-black shadow-xl hover:bg-rose-800 transition-all active:scale-95">
            <Printer className="w-6 h-6" /> طباعة الكشف الكامل
         </button>
      </div>
    </div>
  );
};

export default DetailedSalesReportView;