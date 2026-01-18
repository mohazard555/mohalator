
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Search, FileOutput, X, Users } from 'lucide-react';
import { SalesInvoice, InvoiceItem, CashEntry, Party, PartyType } from '../types';

const tafqeet = (n: number, prefix: string = ""): string => {
  if (n === 0) return "صفر";
  return `${prefix} ${n.toLocaleString()} ليرة سورية فقط لا غير`;
};

interface DetailedSalesReportViewProps {
  onBack: () => void;
}

const DetailedSalesReportView: React.FC<DetailedSalesReportViewProps> = ({ onBack }) => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [customerFilter, setCustomerFilter] = useState('');
  const [parties, setParties] = useState<Party[]>([]);
  const [startDate, setStartDate] = useState('2024-12-01');
  const [endDate, setEndDate] = useState('2026-01-08');

  useEffect(() => {
    const savedInvoices = localStorage.getItem('sheno_sales_invoices');
    const savedCash = localStorage.getItem('sheno_cash_journal');
    const savedParties = localStorage.getItem('sheno_parties');
    
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    if (savedCash) setCashEntries(JSON.parse(savedCash));
    if (savedParties) setParties(JSON.parse(savedParties).filter((p: Party) => p.type === PartyType.CUSTOMER));
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
      invoiceDate: inv.date
    }))
  );

  const totalSales = filteredInvoices.reduce((s, c) => s + c.totalAmount, 0);
  const totalPaid = cashEntries
    .filter(e => (!customerFilter || e.partyName === customerFilter || e.statement.includes(customerFilter)) && (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate))
    .reduce((s, c) => s + c.receivedSYP, 0);
  const totalRemaining = totalSales - totalPaid;
  const totalItemsCount = reportRows.reduce((s, c) => s + c.quantity, 0);
  const totalInvoicesCount = filteredInvoices.length;

  return (
    <div className="space-y-4 text-right bg-[#f2f2f2] p-8 rounded-lg shadow-2xl min-h-screen text-zinc-900 border-2 border-zinc-300" dir="rtl">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b-2 border-zinc-400 pb-4 mb-4">
         <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded shadow-sm border border-zinc-300">
               <div className="text-[#1e3a8a] font-black text-2xl leading-none">SHENO</div>
               <div className="text-[#94a3b8] text-[7px] tracking-widest font-black uppercase">Sheno for Print</div>
            </div>
         </div>
         <h1 className="text-3xl font-black flex-1 text-center tracking-tight text-zinc-800">كشف مبيعات الزبون المفصل</h1>
         <div className="text-xs font-mono text-zinc-400 bg-white px-3 py-1 rounded border border-zinc-200">#107884</div>
      </div>

      {/* Filter and Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-2 border-zinc-500 bg-white overflow-hidden rounded-sm">
         {/* Totals Section */}
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

         {/* Dates Section */}
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

         {/* Customer Selection Section (Dropdown) */}
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

      {/* Main Content Table */}
      <div className="relative overflow-x-auto border-2 border-zinc-500 bg-white shadow-lg">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none text-[180px] font-black -rotate-12 select-none">SHENO</div>
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr className="bg-[#cbd5e1] text-zinc-900 font-black border-b-2 border-zinc-500 h-10">
              <th className="p-1 border border-zinc-300 w-16">رقم الف</th>
              <th className="p-1 border border-zinc-300 w-24">تاريخ</th>
              <th className="p-1 border border-zinc-300">تفاصيل الاصناف</th>
              <th className="p-1 border border-zinc-300 w-16">العدد</th>
              <th className="p-1 border border-zinc-300 w-24">السعر</th>
              <th className="p-1 border border-zinc-300 w-24">المجموع</th>
              <th className="p-1 border border-zinc-300 w-32">ملاحظات</th>
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
                <tr key={idx} className="h-9 border-b border-zinc-200 font-bold hover:bg-zinc-50 transition-colors">
                  <td className="p-1 border border-zinc-200 font-mono text-rose-700">{row.invoiceNumber}</td>
                  <td className="p-1 border border-zinc-200 font-mono">{row.invoiceDate}</td>
                  <td className="p-1 border border-zinc-200 text-right pr-6">{row.name}</td>
                  <td className="p-1 border border-zinc-200 font-mono text-lg">{row.quantity}</td>
                  <td className="p-1 border border-zinc-200 font-mono">{row.price.toLocaleString()}</td>
                  <td className="p-1 border border-zinc-200 font-mono font-black text-lg text-emerald-700">{ (row.quantity * row.price).toLocaleString()}</td>
                  <td className="p-1 border border-zinc-200 text-[9px] text-zinc-400 font-normal italic">{row.notes || '---'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer Statistics Bar */}
        <div className="border-t-4 border-[#1e3a8a]">
          <div className="flex border-b border-zinc-300 h-12 items-center hover:bg-zinc-50 transition-all">
             <div className="bg-[#cbd5e1] w-64 border-l border-zinc-400 p-3 font-black text-center text-sm">اجمالي المبيعات</div>
             <div className="flex-1 p-2 font-mono font-black text-3xl px-8 text-[#1e3a8a]">{totalSales.toLocaleString()}</div>
          </div>
          <div className="flex border-b border-zinc-300 h-12 items-center hover:bg-zinc-50 transition-all">
             <div className="bg-[#f1f5f9] w-64 border-l border-zinc-400 p-3 font-black text-center text-sm">الرصيد المدفوع</div>
             <div className="flex-1 p-2 font-mono font-black text-3xl px-8 text-emerald-700">{totalPaid.toLocaleString()}</div>
          </div>
          <div className="flex h-12 items-center bg-rose-50 hover:bg-rose-100 transition-all">
             <div className="bg-[#cbd5e1] w-64 border-l border-zinc-400 p-3 font-black text-center text-sm">الرصيد المتبقي</div>
             <div className="flex-1 p-2 font-mono font-black text-3xl px-8 text-rose-700">{totalRemaining.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Tafqeet / Literal Section */}
      <div className="grid grid-cols-4 border-2 border-zinc-500 bg-white rounded-sm overflow-hidden shadow-md">
         <div className="col-span-3 flex flex-col divide-y divide-zinc-200 text-xs font-bold bg-white">
            <div className="p-2.5 px-8 text-zinc-800 underline underline-offset-4 decoration-zinc-300">{tafqeet(totalSales)}</div>
            <div className="p-2.5 px-8 text-zinc-800 underline underline-offset-4 decoration-zinc-300">{tafqeet(totalPaid)}</div>
            <div className="p-2.5 px-8 text-rose-800 underline underline-offset-4 decoration-rose-300 font-black">{tafqeet(totalRemaining)}</div>
         </div>
         <div className="col-span-1 border-r border-zinc-500 flex flex-col divide-y divide-zinc-200 font-black text-xs bg-[#f8fafc]">
            <div className="p-2.5 pr-6 text-left border-l border-zinc-200">المبيع كتابتاً</div>
            <div className="p-2.5 pr-6 text-left border-l border-zinc-200">المدفوع كتابتاً</div>
            <div className="p-2.5 pr-6 text-left border-l border-zinc-200">المتبقي كتابتاً</div>
         </div>
      </div>
      
      <div className="flex justify-between items-center no-print pt-6">
         <button onClick={onBack} className="bg-zinc-800 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:bg-zinc-700 transition-all active:scale-95">العودة للرئيسية</button>
         <div className="flex gap-4">
            <button onClick={() => window.print()} className="bg-rose-900 text-white px-12 py-3 rounded-xl flex items-center gap-2 font-black shadow-xl hover:bg-rose-800 transition-all active:scale-95">
               <Printer className="w-6 h-6" /> طباعة الكشف الكامل
            </button>
            <button className="bg-[#1e3a8a] text-white px-12 py-3 rounded-xl flex items-center gap-2 font-black shadow-xl hover:bg-[#1d4ed8] transition-all active:scale-95">
               <FileOutput className="w-6 h-6" /> تصدير نسخة PDF
            </button>
         </div>
      </div>
    </div>
  );
};

export default DetailedSalesReportView;
