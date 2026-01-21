
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, ChevronDown, Globe, FileText, RotateCcw, Truck, ShoppingBag, X } from 'lucide-react';
import { SalesInvoice, AppSettings } from '../types';

interface ProfessionalInvoiceViewProps {
  onBack: () => void;
  settings: AppSettings;
}

type DocType = 'SALES' | 'SALES_RETURN' | 'PURCHASE_RETURN' | 'PURCHASE';

const ProfessionalInvoiceView: React.FC<ProfessionalInvoiceViewProps> = ({ onBack, settings }) => {
  const [docType, setDocType] = useState<DocType>('SALES');
  const [selectedId, setSelectedId] = useState('');
  const [document, setDocument] = useState<any | null>(null);
  const [list, setList] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [docType]);

  const loadData = () => {
    let key = '';
    if (docType === 'SALES') key = 'sheno_sales_invoices';
    else if (docType === 'SALES_RETURN') key = 'sheno_sales_returns';
    else if (docType === 'PURCHASE_RETURN') key = 'sheno_purchase_returns';
    else if (docType === 'PURCHASE') key = 'sheno_purchases';

    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      setList(parsed);
      if (parsed.length > 0) {
        setSelectedId(parsed[0].id);
        setDocument(parsed[0]);
      } else {
        setDocument(null);
        setSelectedId('');
      }
    } else {
      setList([]);
      setDocument(null);
      setSelectedId('');
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const match = list.find(i => i.id === id);
    if (match) setDocument(match);
  };

  const getDocTitle = () => {
    if (docType === 'SALES') return 'فاتورة مبيعات';
    if (docType === 'SALES_RETURN') return 'مرتجع مبيعات';
    if (docType === 'PURCHASE') return 'فاتورة مشتريات';
    return 'مرتجع مشتريات';
  };

  const getPartyLabel = () => {
    if (docType === 'PURCHASE_RETURN' || docType === 'PURCHASE') return 'المطلوب من السيد / المورد';
    return 'المطلوب من السيد / MESSRS';
  };

  const getPartyName = () => {
    if (docType === 'PURCHASE_RETURN' || docType === 'PURCHASE') return document?.supplierName;
    return document?.customerName;
  };

  const getAccentColorClass = () => {
    if (docType === 'SALES') return 'bg-[#881337] border-[#881337]';
    if (docType === 'SALES_RETURN') return 'bg-rose-700 border-rose-700';
    if (docType === 'PURCHASE') return 'bg-emerald-700 border-emerald-700';
    return 'bg-amber-600 border-amber-600';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 md:p-20 animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-10 right-10 text-white hover:text-rose-500 transition-colors no-print">
            <X className="w-10 h-10" />
          </button>
          <img 
            src={previewImage} 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" 
            onClick={(e) => e.stopPropagation()} 
            alt="Full Preview"
          />
        </div>
      )}

      {/* Selection Control Panel */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl no-print space-y-4">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-readable transition-all">
                 <ArrowRight className="w-6 h-6" />
               </button>
               <h2 className="text-2xl font-black text-readable">تصدير الوثائق الاحترافي</h2>
            </div>
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border dark:border-zinc-700 flex-wrap gap-1">
               <button onClick={() => setDocType('SALES')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${docType === 'SALES' ? 'bg-[#881337] text-white shadow-lg' : 'text-zinc-500'}`}><FileText className="w-4 h-4"/> مبيعات</button>
               <button onClick={() => setDocType('PURCHASE')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${docType === 'PURCHASE' ? 'bg-emerald-700 text-white shadow-lg' : 'text-zinc-500'}`}><ShoppingBag className="w-4 h-4"/> مشتريات</button>
               <button onClick={() => setDocType('SALES_RETURN')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${docType === 'SALES_RETURN' ? 'bg-rose-900 text-white shadow-lg' : 'text-zinc-500'}`}><RotateCcw className="w-4 h-4"/> مرتجع مبيع</button>
               <button onClick={() => setDocType('PURCHASE_RETURN')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${docType === 'PURCHASE_RETURN' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500'}`}><Truck className="w-4 h-4"/> مرتجع شراء</button>
            </div>
         </div>
         
         <div className="relative group">
            <select 
              value={selectedId} 
              onChange={e => handleSelect(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 text-readable rounded-2xl py-4 pr-12 pl-4 outline-none w-full text-lg font-black focus:border-primary transition-all appearance-none cursor-pointer"
            >
               <option value="">-- اختر السند من السجل --</option>
               {list.map(i => (
                 <option key={i.id} value={i.id}>
                   #{i.invoiceNumber} - {i.customerName || i.supplierName} ({i.date})
                 </option>
               ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
               <ChevronDown className="w-6 h-6" />
            </div>
         </div>
      </div>

      <div className="flex justify-center p-4 md:p-10 bg-zinc-200 dark:bg-zinc-800/50 rounded-[3rem] overflow-hidden min-h-[700px] border-4 border-white dark:border-zinc-800">
         {/* Professional Design Container */}
         <div className="bg-white text-zinc-900 w-full max-w-[210mm] shadow-2xl flex flex-col relative overflow-hidden print:shadow-none print:m-0 professional-invoice-box" id="professional-document">
            
            <style>{`
              @media print {
                @page { size: A4 landscape; margin: 5mm; }
                .professional-invoice-box { width: 100% !important; max-height: 148.5mm !important; min-height: 148.5mm !important; padding: 5mm !important; margin: 0 !important; border: none !important; }
                body { background: white !important; }
                .no-print { display: none !important; }
              }
              .invoice-table { border-collapse: collapse; width: 100%; border: 1px solid #d4d4d8; }
              .invoice-table th, .invoice-table td { border: 1px solid #d4d4d8; padding: 8px; }
            `}</style>

            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none -rotate-45">
               <span className="text-[120px] font-black uppercase tracking-tighter">{settings.companyName}</span>
            </div>

            {/* Header */}
            <div className="p-8 relative z-10 flex justify-between items-start">
               <div className="space-y-4">
                  <div className={`text-white px-12 py-3 rounded-none font-black text-2xl tracking-wider shadow-lg w-fit ${getAccentColorClass().split(' ')[0]}`}>
                    {getDocTitle()}
                  </div>
                  <div className="flex flex-col gap-1 pr-2">
                     <div className="flex items-center gap-4">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase">DATE / التاريخ</span>
                        <span className="font-mono text-xs font-black">{document?.date || '----/--/--'}</span>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase">NO / رقم السند</span>
                        <span className="font-mono text-3xl font-black text-zinc-800">#{document?.invoiceNumber || '0000'}</span>
                     </div>
                  </div>
               </div>

               <div className="text-left flex flex-col items-end">
                  {settings.logoUrl ? (
                     <img src={settings.logoUrl} className="w-24 h-auto object-contain mb-2 rounded" alt="Logo" />
                  ) : (
                     <div className="text-4xl font-black text-[#881337] tracking-tighter mb-1">SHENO</div>
                  )}
                  <h1 className="text-4xl font-black text-[#881337] leading-none tracking-tight">{settings.companyName}</h1>
                  <p className="text-zinc-500 font-bold text-[11px] mt-1">{settings.companyType}</p>
               </div>
            </div>

            <div className={`mx-8 border-b-4 mb-6 ${getAccentColorClass().split(' ')[1]}`}></div>

            {/* Info Section - Reordered for Party Name on the Right in RTL */}
            <div className="px-8 grid grid-cols-3 gap-6 mb-6 relative z-10">
               {/* Party Name Section (Now first in DOM, so right-most in RTL) */}
               <div className="flex flex-col items-start justify-center text-right">
                  <span className={`text-[10px] font-black text-zinc-500 uppercase border-r-4 pr-3 mr-2 ${getAccentColorClass().split(' ')[1]}`}>
                    {getPartyLabel()}
                  </span>
                  <span className="text-2xl font-black italic text-zinc-800 mt-1">{getPartyName() || '..........................'}</span>
               </div>
               
               {/* Middle Column */}
               <div className="flex items-center justify-center">
                  <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-3xl flex flex-col items-center justify-center shadow-sm w-full max-w-[150px]">
                     <span className="text-[9px] font-black text-zinc-400 uppercase mb-1">إجمالي القطع</span>
                     <span className="text-4xl font-black font-mono text-[#881337] leading-none">
                        {document?.items?.reduce((s:number,c:any) => s + c.quantity, 0) || '00'}
                     </span>
                  </div>
               </div>

               {/* Left-most in RTL (Empty or for symmetry) */}
               <div className="flex flex-col items-end justify-center">
                  {/* Space for future details like tax or warehouse */}
               </div>
            </div>

            {/* Table */}
            <div className="px-8 flex-1 relative z-10 mb-6">
               <table className="invoice-table w-full">
                  <thead>
                     <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest h-10">
                        <th className="p-2 text-right">الوصف / DESCRIPTION</th>
                        <th className="p-2 text-center w-20">الكمية</th>
                        <th className="p-2 text-center w-32">السعر</th>
                        <th className="p-2 text-center w-32">الإجمالي</th>
                     </tr>
                  </thead>
                  <tbody className="text-sm font-bold">
                     {document ? document.items.map((item: any, idx: number) => (
                        <tr key={idx} className="h-10 border-b">
                           <td className="p-2 font-black text-zinc-800 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {item.image && <img src={item.image} className="w-8 h-8 object-contain rounded border bg-white cursor-zoom-in" onClick={() => setPreviewImage(item.image)} />}
                                <span>{item.name}</span>
                              </div>
                              {item.serialNumber && <span className="text-[8px] text-zinc-400 font-mono ml-4">SN: {item.serialNumber}</span>}
                           </td>
                           <td className="p-2 text-center font-mono text-lg">{item.quantity}</td>
                           <td className="p-2 text-center font-mono">{item.price.toLocaleString()}</td>
                           <td className="p-2 text-center font-mono text-primary">{(item.quantity * item.price).toLocaleString()}</td>
                        </tr>
                     )) : Array.from({ length: 4 }).map((_, i) => <tr key={i} className="h-10 border-b"><td colSpan={4}></td></tr>)}
                  </tbody>
               </table>
            </div>

            {/* Total Bar */}
            <div className="mx-8 p-6 bg-zinc-900 text-white relative z-10 shadow-2xl flex justify-between items-center mb-8">
               <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">المبلغ كتابةً / IN WORDS</span>
                  <div className="text-lg font-black italic text-zinc-100">{document?.totalAmountLiteral || document?.totalReturnAmountLiteral || '................................................'}</div>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">الإجمالي / TOTAL</span>
                  <div className="text-5xl font-black font-mono tracking-tighter text-white leading-none">
                     {(document?.totalAmount || document?.totalReturnAmount || 0).toLocaleString()}
                  </div>
                  <span className="text-[9px] font-bold opacity-60 uppercase mt-1">{settings.currency}</span>
               </div>
            </div>

            {/* Footer */}
            <div className="px-12 pb-10 flex justify-between items-end relative z-10">
               <div className="text-center">
                  <div className="text-[10px] font-black text-zinc-400 uppercase mb-8">المحاسب المعتمد</div>
                  <div className="flex flex-col items-center">
                     <div className="w-56 border-b-2 border-zinc-300 mb-1"></div>
                     <span className="text-xs font-black text-zinc-800">{settings.accountantName}</span>
                  </div>
               </div>
               <div className="flex flex-col items-end gap-1 text-[10px] font-bold text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span>{settings.address}</span>
                    <span className="text-zinc-300">|</span>
                    <span className="font-mono">{settings.phone}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-black tracking-widest">
                     <Globe className="w-3 h-3" /> {settings.website.toUpperCase()}
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="fixed bottom-10 left-10 no-print flex gap-3">
         <button onClick={() => window.print()} className="bg-zinc-900 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-white/20">
            <Printer className="w-8 h-8" />
         </button>
      </div>
    </div>
  );
};

export default ProfessionalInvoiceView;
