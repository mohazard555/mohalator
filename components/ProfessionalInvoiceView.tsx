
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Search, FileDown, CheckCircle, Globe, ChevronDown } from 'lucide-react';
import { SalesInvoice, AppSettings } from '../types';

interface ProfessionalInvoiceViewProps {
  onBack: () => void;
  settings: AppSettings;
}

const ProfessionalInvoiceView: React.FC<ProfessionalInvoiceViewProps> = ({ onBack, settings }) => {
  const [invNum, setInvNum] = useState('');
  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [allInvoices, setAllInvoices] = useState<SalesInvoice[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('sheno_sales_invoices');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAllInvoices(parsed);
      if (parsed.length > 0 && !invNum) {
        setInvNum(parsed[0].invoiceNumber);
        setInvoice(parsed[0]);
      }
    }
  }, []);

  const handleSearch = (number: string) => {
    setInvNum(number);
    const match = allInvoices.find(i => i.invoiceNumber === number);
    if (match) setInvoice(match);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between no-print gap-6 shadow-xl">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-readable transition-all">
              <ArrowRight className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-readable">تصدير الفواتير الاحترافي</h2>
         </div>
         <div className="flex gap-3 flex-1 max-w-md">
            <div className="relative flex-1 group">
               <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary z-10">
                  <Search className="w-5 h-5" />
               </div>
               <select 
                 value={invNum} 
                 onChange={e => handleSearch(e.target.value)}
                 className="bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-readable rounded-2xl py-3.5 pr-12 pl-4 outline-none w-full text-lg font-black focus:border-primary transition-all appearance-none cursor-pointer"
               >
                  <option value="">-- اختر الفاتورة المطلوب تصديرها --</option>
                  {allInvoices.map(i => (
                    <option key={i.id} value={i.invoiceNumber}>
                      فاتورة #{i.invoiceNumber} - {i.customerName} ({i.date})
                    </option>
                  ))}
               </select>
               <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <ChevronDown className="w-5 h-5" />
               </div>
            </div>
         </div>
      </div>

      <div className="flex justify-center p-4 md:p-10 bg-zinc-200 dark:bg-zinc-800/50 rounded-3xl overflow-hidden min-h-[600px]">
         {/* Professional Invoice Container (A5 Optimized Style) */}
         <div className="bg-white text-zinc-900 w-full max-w-[210mm] shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col relative overflow-hidden print:shadow-none print:m-0 professional-invoice-box" id="professional-invoice-document">
            
            <style>{`
              @media print {
                .professional-invoice-box {
                   width: 100% !important;
                   max-height: 148.5mm !important; /* Half A4 */
                   min-height: 148.5mm !important;
                   border: 1px solid #eee !important;
                   padding: 10mm !important;
                   margin: 0 !important;
                }
                .invoice-table th, .invoice-table td {
                   border: 1px solid #333 !important;
                   padding: 4px 8px !important;
                   font-size: 10pt !important;
                }
                .invoice-header {
                   margin-bottom: 5mm !important;
                }
                .invoice-footer {
                   margin-top: auto !important;
                }
                body { background: white !important; }
              }
              .invoice-table { border-collapse: collapse !important; width: 100%; }
              .invoice-table th, .invoice-table td { border: 1px solid #e5e7eb; }
            `}</style>

            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none -rotate-45">
               <span className="text-[120px] font-black uppercase">{settings.companyName}</span>
            </div>

            <div className="p-8 relative z-10 border-b-4 border-rose-900 invoice-header">
               <div className="flex justify-between items-start">
                  <div className="space-y-2">
                     {settings.logoUrl ? (
                        <img src={settings.logoUrl} className="w-16 h-16 object-contain" alt="Company Logo" />
                     ) : (
                        <div className="w-14 h-14 bg-rose-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                          {settings.companyName.substring(0, 2).toUpperCase()}
                        </div>
                     )}
                     <div>
                        <h1 className="text-2xl font-black text-rose-900 leading-none">{settings.companyName}</h1>
                        <p className="text-zinc-500 font-bold text-[10px] tracking-wide mt-1">{settings.companyType}</p>
                     </div>
                  </div>

                  <div className="text-left space-y-1">
                     <div className="bg-rose-900 text-white px-6 py-2 rounded-bl-2xl font-black text-xl tracking-wider shadow-md">فاتورة مبيعات</div>
                     <div className="p-2 flex flex-col items-end gap-0.5">
                        <div className="flex gap-4 text-[9px] font-bold text-zinc-400">
                           <span>التاريخ / DATE</span>
                           <span className="font-mono text-zinc-900">{invoice?.date || '2025/01/01'}</span>
                        </div>
                        <div className="flex gap-4 text-[9px] font-bold text-zinc-400">
                           <span>رقم الفاتورة / INV NO</span>
                           <span className="font-mono text-rose-900 text-lg font-black">#{invoice?.invoiceNumber || '0000'}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="px-8 py-4 grid grid-cols-2 gap-6 relative z-10">
               <div className="space-y-2">
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-rose-900 uppercase tracking-widest border-r-2 border-rose-900 pr-2">المطلوب من السيد / Messrs</span>
                     <span className="text-lg font-black italic text-zinc-800">{invoice?.customerName || '................................................'}</span>
                  </div>
               </div>
               <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 flex flex-col justify-center items-center">
                  <div className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">إجمالي القطع</div>
                  <div className="text-2xl font-black font-mono text-rose-900">
                     {invoice?.items.reduce((s,c) => s + c.quantity, 0) || '00'}
                  </div>
               </div>
            </div>

            <div className="px-8 flex-1 relative z-10 mb-4 overflow-hidden">
               <table className="invoice-table">
                  <thead>
                     <tr className="bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest">
                        <th className="p-2 text-right">الوصف / Description</th>
                        <th className="p-2 text-center w-16">الكمية</th>
                        <th className="p-2 text-center w-24">السعر</th>
                        <th className="p-2 text-center w-24">الإجمالي</th>
                     </tr>
                  </thead>
                  <tbody className="text-xs">
                     {invoice ? invoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50">
                           <td className="p-2 font-bold text-zinc-800">
                              <div className="flex items-center gap-2">
                                 {item.image && <img src={item.image} className="w-8 h-8 object-contain rounded border border-zinc-100 bg-zinc-50" />}
                                 <div className="flex flex-col">
                                    <span>{item.name}</span>
                                    <span className="text-[8px] text-zinc-400 font-mono">SN: {item.serialNumber || '-'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="p-2 text-center font-mono font-bold">{item.quantity}</td>
                           <td className="p-2 text-center font-mono font-bold">{item.price.toLocaleString()}</td>
                           <td className="p-2 text-center font-mono font-black">{item.total.toLocaleString()}</td>
                        </tr>
                     )) : Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="h-8"><td colSpan={4}></td></tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="p-6 bg-zinc-900 text-white relative z-10 mt-auto invoice-footer">
               <div className="flex justify-between items-center">
                  <div className="space-y-1">
                     <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em]">المبلغ كتابةً / In Words</span>
                     <div className="text-sm font-black italic opacity-90">{invoice?.totalAmountLiteral || '....................................................................'}</div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">TOTAL / الإجمالي</span>
                     <div className="text-3xl font-black font-mono tracking-tighter text-white leading-none">
                        {invoice?.totalAmount.toLocaleString() || '0,000,000'}
                     </div>
                     <span className="text-[8px] font-bold opacity-60 uppercase">{settings.currency}</span>
                  </div>
               </div>
            </div>

            <div className="p-6 flex justify-between items-end relative z-10 bg-zinc-50/50">
               <div className="text-center">
                  <div className="text-[8px] font-black text-zinc-400 uppercase">المحاسب المعتمد</div>
                  <div className="flex flex-col items-center mt-4">
                     <div className="w-24 border-b border-zinc-300"></div>
                     <span className="text-[9px] font-black">{settings.accountantName}</span>
                  </div>
               </div>
               
               <div className="flex flex-col items-end gap-1 text-[8px] font-bold text-zinc-400">
                  <div>{settings.address} | {settings.phone}</div>
                  <div className="flex items-center gap-1 text-rose-900 font-black">
                     <Globe className="w-2 h-2" /> {settings.website.toUpperCase()}
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
