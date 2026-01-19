
import React, { useState } from 'react';
import { ArrowRight, Printer, Search, FileDown, CheckCircle, Globe } from 'lucide-react';
import { SalesInvoice, AppSettings } from '../types';

interface ProfessionalInvoiceViewProps {
  onBack: () => void;
  settings: AppSettings;
}

const ProfessionalInvoiceView: React.FC<ProfessionalInvoiceViewProps> = ({ onBack, settings }) => {
  const [invNum, setInvNum] = useState('');
  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);

  const handleSearch = () => {
    const saved = localStorage.getItem('sheno_sales_invoices');
    if (saved) {
      const all: SalesInvoice[] = JSON.parse(saved);
      const match = all.find(i => i.invoiceNumber === invNum);
      if (match) setInvoice(match);
      else alert('الفاتورة المطلوبة غير موجودة في السجلات.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between no-print gap-4 shadow-xl">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-readable transition-all">
              <ArrowRight className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-readable">تصدير الفواتير الاحترافي</h2>
         </div>
         <div className="flex gap-2">
            <div className="relative">
               <input 
                 type="text" 
                 value={invNum} 
                 onChange={e => setInvNum(e.target.value)} 
                 placeholder="ادخل رقم الفاتورة..."
                 className="bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-readable rounded-xl py-3 pr-12 outline-none w-64 text-sm font-bold focus:border-primary transition-all" 
               />
               <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            </div>
            <button onClick={handleSearch} className="bg-primary text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">استعراض</button>
         </div>
      </div>

      <div className="flex justify-center p-4 md:p-10 bg-zinc-200 dark:bg-zinc-800/50 rounded-3xl overflow-hidden min-h-screen">
         <div className="bg-white text-zinc-900 w-full max-w-[210mm] min-h-[297mm] shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col relative overflow-hidden print:shadow-none print:m-0" id="professional-invoice-document">
            
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none -rotate-45">
               <span className="text-[120px] font-black uppercase">{settings.companyName}</span>
            </div>

            <div className="p-10 relative z-10 border-b-8 border-rose-900">
               <div className="flex justify-between items-start">
                  <div className="space-y-4">
                     {settings.logoUrl ? (
                        <img src={settings.logoUrl} className="w-24 h-24 object-contain" alt="Company Logo" />
                     ) : (
                        <div className="w-20 h-20 bg-rose-900 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl">
                          {settings.companyName.substring(0, 2).toUpperCase()}
                        </div>
                     )}
                     <div>
                        <h1 className="text-3xl font-black text-rose-900">{settings.companyName}</h1>
                        <p className="text-zinc-500 font-bold text-sm tracking-wide">{settings.companyType}</p>
                     </div>
                  </div>

                  <div className="text-left space-y-1 pt-2">
                     <div className="bg-rose-900 text-white px-8 py-3 rounded-bl-3xl font-black text-2xl tracking-widest shadow-lg">فاتورة مبيعات</div>
                     <div className="p-4 flex flex-col items-end gap-1">
                        <div className="flex gap-4 text-xs font-bold text-zinc-500">
                           <span>DATE / التاريخ</span>
                           <span className="font-mono text-zinc-900">{invoice?.date || '2025/01/01'}</span>
                        </div>
                        <div className="flex gap-4 text-xs font-bold text-zinc-500">
                           <span>INV NO / رقم الفاتورة</span>
                           <span className="font-mono text-rose-900 text-lg font-black">#{invoice?.invoiceNumber || '0000'}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="px-10 py-8 grid grid-cols-2 gap-10 relative z-10">
               <div className="space-y-4">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-rose-900 uppercase tracking-widest border-r-4 border-rose-900 pr-2 mb-1">المطلوب من السيد / Messrs</span>
                     <span className="text-2xl font-black italic text-zinc-800">{invoice?.customerName || '................................................'}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pr-2 mb-1">الملاحظات / Remarks</span>
                     <span className="text-sm font-bold text-zinc-500">{invoice?.notes || 'لا يوجد ملاحظات إضافية'}</span>
                  </div>
               </div>
               <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 flex flex-col justify-center items-center gap-2">
                  <div className="text-xs font-black text-zinc-400 uppercase tracking-tighter">إجمالي القطع الكلي</div>
                  <div className="text-4xl font-black font-mono text-rose-900">
                     {invoice?.items.reduce((s,c) => s + c.quantity, 0) || '00'}
                  </div>
               </div>
            </div>

            <div className="px-10 flex-1 relative z-10">
               <table className="w-full border-collapse">
                  <thead>
                     <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest">
                        <th className="p-4 text-right rounded-tr-xl">الوصف / Description</th>
                        <th className="p-4 text-center w-20">الكمية / Qty</th>
                        <th className="p-4 text-center w-32">السعر / Unit Price</th>
                        <th className="p-4 text-center w-32 rounded-tl-xl">الإجمالي / Total</th>
                     </tr>
                  </thead>
                  <tbody className="text-sm">
                     {invoice ? invoice.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                           <td className="p-5 font-bold text-zinc-800">
                              <div className="flex items-center gap-4">
                                 {item.image && <img src={item.image} className="w-20 h-20 object-contain rounded-md shadow-md border border-zinc-100 bg-zinc-50" />}
                                 <div className="flex flex-col">
                                    <span className="text-lg">{item.name}</span>
                                    <span className="text-[9px] text-zinc-400 font-mono">SN: {item.serialNumber || '-'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="p-5 text-center font-mono font-bold">{item.quantity}</td>
                           <td className="p-5 text-center font-mono font-bold">{item.price.toLocaleString()}</td>
                           <td className="p-5 text-center font-mono font-black text-lg">{item.total.toLocaleString()}</td>
                        </tr>
                     )) : Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="border-b border-zinc-50 h-12">
                           <td colSpan={4}></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="p-10 bg-zinc-900 text-white relative z-10">
               <div className="flex justify-between items-center">
                  <div className="space-y-2">
                     <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">المبلغ كتابتاً / In Words</span>
                     <div className="text-xl font-black italic opacity-90">{invoice?.totalAmountLiteral || '....................................................................'}</div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">TOTAL AMOUNT / الإجمالي</span>
                     <div className="text-5xl font-black font-mono tracking-tighter text-white">
                        {invoice?.totalAmount.toLocaleString() || '0,000,000'}
                     </div>
                     <span className="text-xs font-bold opacity-60 uppercase">{settings.currency}</span>
                  </div>
               </div>
            </div>

            <div className="p-10 flex justify-between items-end relative z-10">
               <div className="text-center space-y-16">
                  <div className="text-[10px] font-black text-zinc-400 uppercase">المحاسب المعتمد / ACCOUNTANT</div>
                  <div className="flex flex-col items-center gap-1">
                     <div className="w-40 border-b-2 border-zinc-200"></div>
                     <span className="text-xs font-black">{settings.accountantName}</span>
                  </div>
               </div>

               <div className="text-center space-y-16">
                  <div className="text-[10px] font-black text-zinc-400 uppercase">المدير العام / GENERAL MANAGER</div>
                  <div className="flex flex-col items-center gap-1">
                     <div className="w-40 border-b-2 border-zinc-200"></div>
                     <span className="text-xs font-black">{settings.managerName}</span>
                  </div>
               </div>
               
               <div className="flex flex-col items-end gap-2 text-[10px] font-bold text-zinc-400">
                  <div className="flex gap-2"><span>{settings.address}</span> <span>ADDRESS</span></div>
                  <div className="flex gap-2"><span>{settings.phone}</span> <span>PHONE</span></div>
                  <div className="flex items-center gap-1 text-rose-900 font-black mt-2">
                     <Globe className="w-3 h-3" /> {settings.website.toUpperCase()}
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="fixed bottom-10 left-10 flex flex-col gap-3 no-print animate-in slide-in-from-bottom-10">
         <button onClick={() => window.print()} className="bg-rose-900 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-white/20">
            <Printer className="w-8 h-8" />
         </button>
      </div>
    </div>
  );
};

export default ProfessionalInvoiceView;
