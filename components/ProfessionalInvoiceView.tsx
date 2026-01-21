
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, ChevronDown, Globe, FileText, RotateCcw, Truck, ShoppingBag, X, FileDown, MessageSquare, Coins } from 'lucide-react';
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
  const [customNotes, setCustomNotes] = useState('');

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
        setCustomNotes(parsed[0].notes || '');
      } else {
        setDocument(null);
        setSelectedId('');
        setCustomNotes('');
      }
    } else {
      setList([]);
      setDocument(null);
      setSelectedId('');
      setCustomNotes('');
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const match = list.find(i => i.id === id);
    if (match) {
      setDocument(match);
      setCustomNotes(match.notes || '');
    }
  };

  const getDocTitle = () => {
    if (docType === 'SALES') return 'فاتورة مبيعات';
    if (docType === 'SALES_RETURN') return 'مرتجع مبيعات';
    if (docType === 'PURCHASE') return 'فاتورة مشتريات';
    if (docType === 'PURCHASE_RETURN') return 'مرتجع مشتريات';
    return 'مستند مالي';
  };

  const getAccentColor = () => {
    if (docType === 'SALES') return '#881337'; // Rose Dark
    if (docType === 'PURCHASE') return '#047857'; // Emerald
    if (docType === 'SALES_RETURN' || docType === 'PURCHASE_RETURN') return '#be123c'; // Rose
    return '#18181b';
  };

  const totalAmount = document?.totalAmount || document?.totalReturnAmount || 0;

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
          table, th, td {
            border-color: black !important;
          }
        }
      `}</style>

      {previewImage && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-10 right-10 text-white hover:text-rose-500 transition-colors no-print">
            <X className="w-10 h-10" />
          </button>
          <img src={previewImage} className="max-w-full max-h-full object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} alt="Preview" />
        </div>
      )}

      {/* Selection Panel */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl no-print space-y-8">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b dark:border-zinc-800 pb-6">
            <div className="flex items-center gap-4">
               <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-all">
                 <ArrowRight className="w-6 h-6" />
               </button>
               <div>
                  <h2 className="text-2xl font-black text-readable">تصدير واختيار الفاتورة</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">تخصيص وطباعة المستندات المالية الاحترافية</p>
               </div>
            </div>
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border dark:border-zinc-700 flex-wrap gap-1 shadow-inner">
               <button onClick={() => setDocType('SALES')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${docType === 'SALES' ? 'bg-[#881337] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700'}`}>مبيعات</button>
               <button onClick={() => setDocType('PURCHASE')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${docType === 'PURCHASE' ? 'bg-emerald-700 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700'}`}>مشتريات</button>
               <button onClick={() => setDocType('SALES_RETURN')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${docType === 'SALES_RETURN' ? 'bg-rose-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700'}`}>مرتجع مبيعات</button>
               <button onClick={() => setDocType('PURCHASE_RETURN')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${docType === 'PURCHASE_RETURN' ? 'bg-rose-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700'}`}>مرتجع مشتريات</button>
            </div>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-1 flex flex-col gap-2">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">1. اختر المستند المطلوب</label>
               <div className="relative">
                  <select value={selectedId} onChange={e => handleSelect(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 text-readable rounded-2xl py-4 pr-14 pl-4 outline-none w-full text-lg font-black appearance-none cursor-pointer focus:border-primary transition-all shadow-inner">
                     <option value="">-- اختر السند ({getDocTitle()}) --</option>
                     {list.map(i => <option key={i.id} value={i.id}>#{i.invoiceNumber} - {i.customerName || i.supplierName}</option>)}
                  </select>
                  <FileText className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 w-6 h-6" />
                  <ChevronDown className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 pointer-events-none" />
               </div>
            </div>

            <div className="lg:col-span-1 flex flex-col gap-2">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">2. ملاحظات الفاتورة (بجانب الإجمالي)</label>
               <div className="relative group">
                  <textarea 
                    value={customNotes}
                    onChange={e => setCustomNotes(e.target.value)}
                    placeholder="اكتب أي ملاحظات إضافية هنا..."
                    className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 text-readable rounded-2xl py-4 pr-12 pl-4 outline-none w-full h-[62px] font-bold text-sm resize-none focus:border-primary transition-all shadow-inner group-hover:border-zinc-400"
                  ></textarea>
                  <MessageSquare className="absolute right-4 top-5 text-zinc-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
               </div>
            </div>

            <div className="lg:col-span-1">
               <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 flex items-center justify-between shadow-xl">
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">إجمالي المبلغ المختار</span>
                     <span className="text-2xl font-black font-mono text-white">{totalAmount.toLocaleString()} <span className="text-xs opacity-50">{settings.currencySymbol}</span></span>
                  </div>
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                     <Coins className="text-primary w-6 h-6" />
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="flex justify-center p-0 md:p-10 bg-zinc-200 dark:bg-zinc-800/50 rounded-[4rem] overflow-hidden border-4 border-white dark:border-zinc-800 shadow-inner">
         {/* Document Body (210mm x 148.5mm) */}
         <div className="professional-invoice-box bg-white text-zinc-900 w-[210mm] min-h-[148.5mm] max-h-[148.5mm] shadow-2xl flex flex-col relative overflow-hidden p-8" id="professional-document">
            
            {/* Header: Logo and Title Box */}
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-4">
                  {settings.logoUrl ? (
                     <img src={settings.logoUrl} className="w-20 h-auto object-contain rounded" alt="Logo" />
                  ) : (
                     <div className="text-4xl font-black text-rose-900">SHENO</div>
                  )}
                  <div>
                    <h1 className="text-3xl font-black text-rose-900 leading-none mb-1">{settings.companyName}</h1>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{settings.companyType}</p>
                  </div>
               </div>

               <div className="flex flex-col items-end gap-2">
                  <div className="text-white px-10 py-2 font-black text-xl tracking-wider min-w-[220px] text-center rounded-sm shadow-md" style={{ backgroundColor: getAccentColor() }}>
                    {getDocTitle().toUpperCase()}
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

            <div className="border-b-4 mb-6" style={{ borderColor: getAccentColor() }}></div>

            {/* Info Section: Party Name and Pieces Center Box */}
            <div className="flex items-center justify-between mb-6">
               <div className="flex-1">
                  <div className="flex items-center gap-3">
                     <div className="w-1.5 h-10" style={{ backgroundColor: getAccentColor() }}></div>
                     <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase block">المطلوب من السيد / MESSRS</span>
                        <span className="text-2xl font-black italic text-zinc-800 leading-none">{document?.customerName || document?.supplierName || '..........................'}</span>
                     </div>
                  </div>
               </div>

               <div className="flex-shrink-0 px-4">
                  <div className="border-2 border-black rounded-full px-10 py-2 flex flex-col items-center justify-center bg-zinc-50 shadow-inner">
                     <span className="text-[9px] font-black text-zinc-400 uppercase mb-0">إجمالي القطع</span>
                     <span className="text-4xl font-black font-mono leading-none" style={{ color: getAccentColor() }}>
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
                        <th className="p-2 pr-4 border border-black">الوصف / DESCRIPTION</th>
                        <th className="p-2 text-center w-20 border border-black">الكمية</th>
                        <th className="p-2 text-center w-28 border border-black">السعر</th>
                        <th className="p-2 text-center w-32 border border-black">الإجمالي</th>
                     </tr>
                  </thead>
                  <tbody className="text-[11px] font-black">
                     {(document?.items || Array.from({ length: 4 })).map((item: any, idx: number) => (
                        <tr key={idx} className="h-14 border border-black">
                           <td className="p-2 pr-4 text-zinc-800 border border-black">
                              {item ? (
                                <div className="flex items-center gap-3">
                                   {item.image && (
                                     <img 
                                       src={item.image} 
                                       className="w-16 h-16 rounded border-2 border-zinc-100 object-contain bg-white cursor-zoom-in shadow-sm" 
                                       onClick={() => setPreviewImage(item.image)} 
                                       alt="Item" 
                                     />
                                   )}
                                   <div className="flex flex-col">
                                      <span>{item.name}</span>
                                      {item.serialNumber && <span className="text-[8px] text-zinc-400">SN: {item.serialNumber}</span>}
                                   </div>
                                </div>
                              ) : '..........................'}
                           </td>
                           <td className="p-2 text-center font-mono text-lg border border-black">{item?.quantity || ''}</td>
                           <td className="p-2 text-center font-mono border border-black">{item?.price?.toLocaleString() || ''}</td>
                           <td className="p-2 text-center font-mono border border-black" style={{ color: getAccentColor() }}>{item ? (item.quantity * item.price).toLocaleString() : ''}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Totals & Notes Section - Updated Layout to match user request */}
            <div className="mt-4 flex items-start justify-between border-t-2 border-black pt-4">
               <div className="flex-1 space-y-4 pr-2">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest block mb-1" style={{ color: getAccentColor() }}>المبلغ كتابةً / IN WORDS</span>
                    <div className="text-xs font-black italic text-zinc-500">
                      {document?.totalAmountLiteral || '................................................'}
                    </div>
                  </div>
                  
                  {/* Notes Field next to total area visually */}
                  <div className="bg-zinc-50 p-3 border-2 border-black rounded-lg min-h-[50px] relative">
                     <span className="text-[8px] font-black text-zinc-400 uppercase absolute -top-2 right-4 bg-white px-2">ملاحظات الفاتورة / NOTES</span>
                     <p className="text-[10px] font-black text-zinc-700 leading-snug whitespace-pre-wrap">
                        {customNotes || '................................................................................................'}
                     </p>
                  </div>
               </div>

               <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-900 text-white rounded-2xl px-8 py-4 ml-2 shadow-lg min-w-[200px]" style={{ backgroundColor: getAccentColor() }}>
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">الإجمالي / TOTAL</span>
                  <div className="text-4xl font-black font-mono tracking-tighter leading-none">
                     {totalAmount.toLocaleString()}
                  </div>
                  <span className="text-[8px] font-bold uppercase mt-1">{settings.currency}</span>
               </div>
            </div>

            {/* Footer Signatures */}
            <div className="mt-auto pt-4 flex justify-between items-end border-t border-zinc-50">
               <div className="text-center">
                  <div className="w-40 border-b border-black mb-1"></div>
                  <span className="text-[9px] font-black text-zinc-400 uppercase">المحاسب المعتمد</span>
               </div>
               <div className="flex flex-col items-end gap-1 text-[8px] font-bold text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span>{settings.address}</span>
                    <span className="font-mono">{settings.phone}</span>
                  </div>
                  <div className="flex items-center gap-1 font-black tracking-widest" style={{ color: getAccentColor() }}>
                     <Globe className="w-2.5 h-2.5" /> {settings.website.toUpperCase()}
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="flex justify-center gap-4 no-print pb-20">
         <button onClick={() => window.print()} className="bg-zinc-900 text-white px-16 py-5 rounded-[2rem] font-black shadow-2xl flex items-center gap-4 hover:scale-105 transition-all text-xl">
            <Printer className="w-7 h-7" /> طباعة المستند الاحترافي
         </button>
      </div>
    </div>
  );
};

export default ProfessionalInvoiceView;
