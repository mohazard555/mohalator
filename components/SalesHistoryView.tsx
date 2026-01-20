
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Search, FileDown, Clock, Calendar, Edit2, Trash2 } from 'lucide-react';
import { SalesInvoice, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

interface SalesHistoryViewProps {
  onBack: () => void;
}

const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ onBack }) => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const savedInv = localStorage.getItem('sheno_sales_invoices');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedInv) setInvoices(JSON.parse(savedInv));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       inv.invoiceNumber.includes(searchTerm);
    const matchDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
    return matchSearch && matchDate;
  });

  const handleDelete = (id: string, invNum: string) => {
    if (window.confirm('حذف الفاتورة نهائياً من السجل؟')) {
       const updated = invoices.filter(i => i.id !== id);
       setInvoices(updated);
       localStorage.setItem('sheno_sales_invoices', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6">
      {/* Print Header */}
      <div className="print-only print-header flex justify-between items-center bg-rose-700 p-6 rounded-t-xl text-white mb-0 border-b-0">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
          <div>
            <h1 className="text-2xl font-black">{settings?.companyName}</h1>
            <p className="text-xs opacity-80">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black underline decoration-white/30 underline-offset-8">سجل المبيعات العام</h2>
          <p className="text-xs mt-2 opacity-80 flex items-center justify-center gap-1"><Calendar className="w-3 h-3"/> تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        <div className="text-left text-xs font-bold space-y-1">
          <p>{settings?.address}</p>
          <p>{settings?.phone}</p>
        </div>
      </div>

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-rose-700">سجل المبيعات العام</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(filteredInvoices, 'full_sales_history')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
          <button onClick={() => window.print()} className="bg-rose-100 text-rose-700 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-rose-200">
             <Printer className="w-5 h-5" /> طباعة السجل
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 items-center no-print shadow-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث برقم الفاتورة أو اسم العميل..."
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 pr-12 outline-none font-bold focus:border-rose-700"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700">
           <Calendar className="w-4 h-4 text-zinc-400" />
           <span className="text-[10px] font-black text-zinc-500 uppercase">من</span>
           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none" />
           <span className="text-[10px] font-black text-zinc-500 uppercase">إلى</span>
           <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl print:border-rose-700 print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-[10px]">
            <thead>
              <tr className="bg-rose-700 text-white font-black uppercase tracking-tighter border-b border-rose-800 h-14">
                <th className="p-3 border-l border-rose-800 text-center w-12">تسلسل</th>
                <th className="p-3 border-l border-rose-800 text-center w-16">رقم</th>
                <th className="p-3 border-l border-rose-800 text-center w-20">تاريخ</th>
                <th className="p-3 border-l border-rose-800 text-center">العميل</th>
                <th className="p-3 border-l border-rose-800 text-right w-48">تفاصيل الأصناف</th>
                <th className="p-3 border-l border-rose-800 text-right w-40">المواد المستخدمة</th>
                <th className="p-3 border-l border-rose-800 text-center w-12">العدد</th>
                <th className="p-3 border-l border-rose-800 text-center w-20">السعر الإفرادي</th>
                <th className="p-3 border-l border-rose-800 text-center w-24">الإجمالي</th>
                <th className="p-3 border-l border-rose-800 text-right w-48">التفقيط (كتابة)</th>
                <th className="p-3 border-l border-rose-800 text-right">ملاحظات</th>
                <th className="p-3 border-l border-rose-800 text-center w-16">وقت</th>
                <th className="p-3 border-l border-rose-800 text-center w-20 no-print">إجراءات</th>
                <th className="p-3 text-center w-20">المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold print:divide-zinc-300">
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={14} className="p-16 text-center italic text-zinc-400">لا يوجد سجلات مبيعات تطابق الفلترة</td></tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-rose-50 dark:hover:bg-zinc-800/30 transition-colors h-12">
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-400">{filteredInvoices.length - idx}</td>
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center text-rose-700 font-black">#{inv.invoiceNumber}</td>
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono">{inv.date}</td>
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-readable truncate max-w-[120px]">{inv.customerName}</td>
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-col gap-0.5 max-h-12 overflow-y-auto">
                        {inv.items.map((it, i) => (
                          <div key={i} className="truncate">{it.name}</div>
                        ))}
                      </div>
                    </td>
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                         {inv.usedMaterials?.map((m, i) => (
                           <span key={i} className="bg-rose-500/10 text-rose-600 px-1 py-0.5 rounded-sm text-[8px]">{m.name} ({m.quantity})</span>
                         ))}
                      </div>
                    </td>
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono">
                      {inv.items.reduce((s,i) => s + i.quantity, 0)}
                    </td>
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-400">
                      {inv.items[0]?.price.toLocaleString()}
                    </td>
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-black text-rose-600 font-mono text-xs bg-rose-50/30 print:bg-transparent">
                      {inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-[8px] font-normal text-zinc-500 leading-tight">
                      {inv.totalAmountLiteral}
                    </td>
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-zinc-400 font-normal italic truncate max-w-[100px]">
                      {inv.notes || '-'}
                    </td>
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-[8px] text-zinc-400">
                      {inv.time}
                    </td>
                    <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                         <button onClick={() => window.print()} className="p-1 text-zinc-400 hover:text-primary transition-all"><Printer className="w-3.5 h-3.5" /></button>
                         <button onClick={() => handleDelete(inv.id, inv.invoiceNumber)} className="p-1 text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                    <td className="p-2 text-center text-emerald-600 font-mono text-xs">
                      {inv.paidAmount?.toLocaleString() || '0'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesHistoryView;