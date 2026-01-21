
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, ChevronDown, Globe, FileText, RotateCcw, Truck, ShoppingBag, X } from 'lucide-react';
import { AppSettings } from '../types';

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

  const getAccentColor = () => {
    if (docType === 'SALES') return '#881337';
    if (docType === 'PURCHASE') return '#047857';
    return '#e11d48';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      <style>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; 
          }
          body { 
            margin: 0; 
            padding: 0; 
            background: white !important; 
          }
          .no-print { display: none !important; }
          .professional-invoice-box { 
            width: 210mm !important; 
            height: 148.5mm !important; 
            padding: 10mm !important; 
            margin: 0 !important; 
            border: none !important; 
            box-shadow: none !important;
            overflow: hidden;
            position: relative;
            background: white !important;
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>

      {previewImage && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-10 right-10 text-white hover:text-rose-500 transition-colors no-print">
            <X className="w-10 h-10" />
          </button>
          <img src={previewImage} className="max-w-full max-h-full object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Selection Panel */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl no-print space-y-4">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl">
                 <ArrowRight className="w-6 h-6" />
               </button>
               <h2 className="text-2xl font-black text-readable">تصدير الفواتير (نصف A4)</h2>
            </div>
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl border flex-wrap gap-1">
               <button onClick={() => setDocType('SALES')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${docType === 'SALES' ? 'bg-[#881337] text-white shadow-lg' : 'text-zinc-500'}`}>مبيعات</button>
               <button onClick={() => setDocType('PURCHASE')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${docType === 'PURCHASE' ? 'bg-emerald-700 text-white shadow-lg' : 'text-zinc-500'}`}>مشتريات</button>
            </div>
         </div>
         <div className="relative">
            <select value={selectedId} onChange={e => handleSelect(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 text-readable rounded-2xl py-3 pr-12 pl-4 outline-none w-full text-lg font-black appearance-none cursor-pointer">
               <option value="">-- اختر الفاتورة من السجل --</option>
               {list.map(i => <option key={i.id} value={i.id}>#{i.invoiceNumber} - {i.customerName || i.supplierName} ({i.date})</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-primary w-6 h-6" />
         </div>
      </div>

      <div className="flex justify-center p-0 md:p-10 bg-zinc-200 dark:bg-zinc-800/50 rounded-[3rem] overflow-hidden border-4 border-white dark:border-zinc-800">
         {/* Document Body (210mm x 148.5mm) */}
         <div className="professional-invoice-box bg-white text-zinc-900 w-[210mm] min-h-[148.5mm] max-h-[148.5mm] shadow-2xl flex flex-col relative overflow-hidden p-8" id="professional-document">
            
            {/* Header: Logo and Title Box */}
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-4">
                  {settings.logoUrl ? (
                     <img src={settings.logoUrl} className="w-20 h-auto object-contain rounded" alt="Logo" />
                  ) : (
                     <div className="text-3xl font-black text-[#881337]">SHENO</div>
                  )}
                  <div>
                    <h1 className="text-3xl font-black text-[#881337] leading-none">{settings.companyName}</h1>
                    <p className="text-[10px] text-zinc-400 font-bold mt-1">{settings.companyType}</p>
                  </div>
               </div>

               <div className="flex flex-col items-end gap-2">
                  <div className="bg-[#881337] text-white px-10 py-2 font-black text-xl tracking-wider min-w-[200px] text-center">
                    {getDocTitle()}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                       <span className="text-[9px] font-bold text-zinc-400 uppercase">DATE / التاريخ</span>
                       <span className="font-mono text-xs font-black">{document?.date || '----/--/--'}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                       <span className="text-[9px] font-bold text-zinc-400 uppercase">NO / رقم السند</span>
                       <span className="font-mono text-3xl font-black text-zinc-800">#{document?.invoiceNumber || '0000'}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="border-b-4 border-[#881337] mb-6"></div>

            {/* Info Section: Party Name and Pieces Center Box */}
            <div className="flex items-center justify-between mb-6">
               <div className="flex-1">
                  <div className="flex items-center gap-3">
                     <div className="w-1.5 h-10 bg-[#881337]"></div>
                     <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase block">المطلوب من السيد / MESSRS</span>
                        <span className="text-2xl font-black italic text-zinc-800 leading-none">{document?.customerName || document?.supplierName || '..........................'}</span>
                     </div>
                  </div>
               </div>

               <div className="flex-shrink-0 px-4">
                  <div className="border-2 border-zinc-100 rounded-[2rem] px-8 py-2 flex flex-col items-center justify-center bg-zinc-50 shadow-inner">
                     <span className="text-[9px] font-black text-zinc-400 uppercase mb-0">إجمالي القطع</span>
                     <span className="text-4xl font-black font-mono text-[#881337] leading-none">
                        {document?.items?.reduce((s:number,c:any) => s + c.quantity, 0) || '00'}
                     </span>
                  </div>
               </div>

               <div className="flex-1"></div>
            </div>

            {/* Table: Item Details */}
            <div className="flex-1 overflow-hidden">
               <table className="w-full text-right border-collapse">
                  <thead>
                     <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest h-8">
                        <th className="p-2 pr-4 border border-zinc-700">الوصف / DESCRIPTION</th>
                        <th className="p-2 text-center w-20 border border-zinc-700">الكمية</th>
                        <th className="p-2 text-center w-28 border border-zinc-700">السعر</th>
                        <th className="p-2 text-center w-32 border border-zinc-700">الإجمالي</th>
                     </tr>
                  </thead>
                  <tbody className="text-[11px] font-black">
                     {(document?.items || Array.from({ length: 4 })).map((item: any, idx: number) => (
                        <tr key={idx} className="h-9 border border-zinc-200">
                           <td className="p-2 pr-4 text-zinc-800">
                              {item ? (
                                <div className="flex items-center gap-2">
                                   {item.image && <img src={item.image} className="w-6 h-6 rounded border object-contain bg-white" onClick={() => setPreviewImage(item.image)} />}
                                   <span>{item.name}</span>
                                </div>
                              ) : '..........................'}
                           </td>
                           <td className="p-2 text-center font-mono text-lg border-x border-zinc-200">{item?.quantity || ''}</td>
                           <td className="p-2 text-center font-mono border-x border-zinc-200">{item?.price?.toLocaleString() || ''}</td>
                           <td className="p-2 text-center font-mono text-[#881337]">{item ? (item.quantity * item.price).toLocaleString() : ''}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Totals Section */}
            <div className="mt-4 flex items-center justify-between border-t-2 border-zinc-100 pt-4">
               <div>
                  <span className="text-[9px] font-black text-[#881337] uppercase tracking-widest block mb-1">المبلغ كتابةً / IN WORDS</span>
                  <div className="text-xs font-black italic text-zinc-400">
                    {document?.totalAmountLiteral || '................................................'}
                  </div>
               </div>
               <div className="flex items-center gap-6">
                  <span className="text-sm font-black text-zinc-400">الإجمالي / TOTAL</span>
                  <div className="flex flex-col items-end">
                     <div className="text-3xl font-black font-mono tracking-tighter text-rose-700 leading-none">
                        {(document?.totalAmount || 0).toLocaleString()}
                     </div>
                     <span className="text-[8px] font-bold text-zinc-400 uppercase mt-1">{settings.currency}</span>
                  </div>
               </div>
            </div>

            {/* Footer Signatures */}
            <div className="mt-auto pt-4 flex justify-between items-end border-t border-zinc-50">
               <div className="text-center">
                  <div className="w-40 border-b border-zinc-200 mb-1"></div>
                  <span className="text-[9px] font-black text-zinc-400 uppercase">المحاسب المعتمد</span>
               </div>
               <div className="flex flex-col items-end gap-1 text-[8px] font-bold text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span>{settings.address}</span>
                    <span className="font-mono">{settings.phone}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#881337] font-black tracking-widest">
                     <Globe className="w-2.5 h-2.5" /> {settings.website.toUpperCase()}
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="flex justify-center gap-4 no-print pb-20">
         <button onClick={() => window.print()} className="bg-zinc-900 text-white px-12 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 hover:scale-105 transition-all">
            <Printer className="w-6 h-6" /> طباعة الفاتورة (نصف A4)
         </button>
      </div>
    </div>
  );
};

export default ProfessionalInvoiceView;
