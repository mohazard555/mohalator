
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, ChevronDown, Globe, FileText, RotateCcw, Truck, ShoppingBag, X, FileDown, MessageSquare, Coins, Calendar, Hash } from 'lucide-react';
import { AppSettings } from '../types';

declare var html2pdf: any;

interface ProfessionalInvoiceViewProps {
  onBack: () => void;
  settings: AppSettings;
}

type DocType = 'SALES' | 'SALES_RETURN' | 'PURCHASE_RETURN' | 'PURCHASE';

const ProfessionalInvoiceView: React.FC<ProfessionalInvoiceViewProps> = ({ onBack, settings }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
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
        setCustomNotes(''); 
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
      setCustomNotes('');
    }
  };

  const handleExportPDF = () => {
    if (!invoiceRef.current || !document) return;
    const element = invoiceRef.current;
    const opt = {
      margin: 0,
      filename: `فاتورة_${document.invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
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
  const totalItemsCount = document?.items?.reduce((s:number,c:any) => s + c.quantity, 0) || 0;
  const activeCurrencySymbol = document?.currencySymbol || settings.currencySymbol;

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          .professional-invoice-box { 
            width: 100% !important; 
            height: 148.5mm !important; /* Exactly half of A4 portrait height */
            margin: 0 !important; 
            border: none !important; 
            box-shadow: none !important; 
            padding: 15mm !important;
            display: flex !important;
            flex-direction: column !important;
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

      {/* Control Panel */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl no-print space-y-8">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b dark:border-zinc-800 pb-6">
            <div className="flex items-center gap-4">
               <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-all">
                 <ArrowRight className="w-6 h-6" />
               </button>
               <div>
                  <h2 className="text-2xl font-black text-readable">تصدير الفواتير الاحترافي</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">تنسيق نص صفحة (A5) محتوى للأطراف</p>
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
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">1. اختر السند</label>
               <select value={selectedId} onChange={e => handleSelect(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 text-readable rounded-2xl py-4 px-4 outline-none w-full text-lg font-black appearance-none cursor-pointer focus:border-primary transition-all shadow-inner">
                  <option value="">-- اختر السند --</option>
                  {list.map(i => <option key={i.id} value={i.id}>#{i.invoiceNumber} - {i.customerName || i.supplierName}</option>)}
               </select>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-2">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">2. ملاحظات إضافية</label>
               <textarea 
                 value={customNotes}
                 onChange={e => setCustomNotes(e.target.value)}
                 placeholder="اكتب ملاحظات إضافية لتظهر في أسفل الفاتورة المصدرة..."
                 className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 text-readable rounded-2xl py-4 px-4 outline-none w-full h-[62px] font-bold text-sm resize-none focus:border-primary transition-all shadow-inner"
               ></textarea>
            </div>
         </div>
         
         <div className="flex justify-center gap-4 pt-4 border-t dark:border-zinc-800">
            <button onClick={handleExportPDF} className="bg-rose-700 text-white px-12 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 hover:scale-105 transition-all text-lg">
               <FileDown className="w-6 h-6" /> تصدير PDF (A5)
            </button>
            <button onClick={() => window.print()} className="bg-zinc-900 text-white px-12 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 hover:scale-105 transition-all text-lg border border-zinc-700">
               <Printer className="w-6 h-6" /> طباعة فورية
            </button>
         </div>
      </div>

      {/* Professional Invoice Content (A5 Portrait style occupying top half of A4) */}
      <div className="flex justify-center p-0 md:p-10 bg-zinc-200 dark:bg-zinc-800/50 rounded-[4rem] overflow-hidden border-4 border-white dark:border-zinc-800 shadow-inner">
         <div ref={invoiceRef} className="professional-invoice-box bg-white text-zinc-900 w-[210mm] min-h-[148.5mm] shadow-2xl flex flex-col p-12 relative" id="professional-document">
            
            {/* Header Content matching Image Structure */}
            <div className="flex justify-between items-start mb-6">
               {/* Right Side Info (as per image: Title Box, Date, No) */}
               <div className="flex flex-col items-start gap-1">
                  <div className="text-white px-10 py-3 font-black text-2xl tracking-wider rounded-lg shadow-lg mb-2" style={{ backgroundColor: getAccentColor() }}>
                    {getDocTitle()}
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase">
                    <span>التاريخ / DATE</span>
                    <span className="font-mono text-zinc-800">{document?.date || '2026-01-25'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase">
                    <span>رقم السند / NO</span>
                    <span className="font-mono text-3xl font-black text-zinc-800 tracking-tighter">#{document?.invoiceNumber || '1000'}</span>
                  </div>
               </div>

               {/* Left Side (SAMLATOR & LOGO) */}
               <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-4">
                     <div className="flex flex-col items-end">
                        <h1 className="text-4xl font-black text-rose-900 leading-none mb-1">{settings.companyName || 'SAMLATOR2026'}</h1>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{settings.companyType || 'نظام إدارة محاسبية متطور'}</p>
                     </div>
                     {settings.logoUrl ? (
                       <img src={settings.logoUrl} className="w-20 h-auto object-contain" alt="Logo" />
                     ) : (
                       <div className="w-16 h-16 bg-rose-900 rounded-full flex items-center justify-center text-white font-black text-2xl">SH</div>
                     )}
                  </div>
               </div>
            </div>

            <div className="h-1.5 w-full rounded-full mb-8" style={{ backgroundColor: getAccentColor() }}></div>

            {/* Entity Info Section */}
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-6">
                  {/* Total Items Pill */}
                  <div className="border-[3px] border-zinc-900 rounded-[2rem] px-8 py-3 flex flex-col items-center justify-center bg-zinc-50 min-w-[120px]">
                     <span className="text-[10px] font-black text-zinc-400 uppercase mb-0.5 leading-none">إجمالي البنود</span>
                     <span className="text-4xl font-black font-mono leading-none" style={{ color: getAccentColor() }}>{totalItemsCount}</span>
                  </div>

                  <div className="flex flex-col">
                     <span className="text-[11px] font-black text-zinc-400 uppercase mb-1">المطلوب من السيد / MESSRS</span>
                     <h3 className="text-[44px] font-black text-zinc-800 tracking-tighter leading-none italic">{document?.customerName || document?.supplierName || 'وسيم'}</h3>
                  </div>
               </div>
               
               <div className="w-2 h-16 rounded-full" style={{ backgroundColor: getAccentColor() }}></div>
            </div>

            {/* Professional Table Area */}
            <div className="flex-1">
               <table className="w-full text-right border-collapse rounded-xl overflow-hidden shadow-sm">
                  <thead>
                     <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest h-11">
                        <th className="p-3 pr-6 border border-zinc-900">الوصــف / DESCRIPTION</th>
                        <th className="p-3 text-center w-24 border border-zinc-900">الكمية</th>
                        <th className="p-3 text-center w-32 border border-zinc-900">السعر</th>
                        <th className="p-3 text-center w-32 border border-zinc-900">الإجمالي</th>
                        <th className="p-3 text-center w-40 border border-zinc-900">ملاحظات</th>
                     </tr>
                  </thead>
                  <tbody className="text-[14px] font-black">
                     {(document?.items || Array.from({ length: 4 })).map((item: any, idx: number) => (
                        <tr key={idx} className="h-16 border-b border-zinc-300">
                           <td className="p-3 pr-6 text-zinc-800 border-l border-zinc-300 align-middle">
                              {item ? (
                                <div className="flex items-center gap-4">
                                   {item.image && <img src={item.image} className="w-12 h-12 object-contain rounded-lg border bg-zinc-50" alt="صنف" />}
                                   <div className="flex flex-col">
                                      <span className="font-black text-lg">{item.name}</span>
                                      {item.serialNumber && <span className="text-[8px] text-zinc-400 font-mono tracking-widest uppercase">SN: {item.serialNumber}</span>}
                                   </div>
                                </div>
                              ) : '..........................................................'}
                           </td>
                           <td className="p-3 text-center font-mono text-2xl border-l border-zinc-300 align-middle">{item?.quantity || ''}</td>
                           <td className="p-3 text-center font-mono text-2xl border-l border-zinc-300 align-middle">{item?.price?.toLocaleString() || ''}</td>
                           <td className="p-3 text-center font-mono text-2xl border-l border-zinc-300 align-middle bg-zinc-50/50" style={{ color: getAccentColor() }}>{item ? (item.quantity * item.price).toLocaleString() : ''}</td>
                           <td className="p-3 text-center text-zinc-400 font-bold italic align-middle">{item?.notes || (idx === 0 && document?.notes) || '---'}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Bottom Section with Totals matching image */}
            <div className="mt-8 flex items-end justify-between">
               <div className="flex-1 space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-zinc-400">المبلغ الإجمالي كتابةً / IN WORDS</span>
                    <div className="text-lg font-black italic text-zinc-800 underline decoration-zinc-100 underline-offset-4">{document?.totalAmountLiteral || '....................................................................'}</div>
                  </div>
                  
                  {customNotes && (
                    <div className="bg-zinc-50 p-4 border-2 border-zinc-100 rounded-2xl relative mt-4">
                       <span className="text-[8px] font-black text-zinc-400 uppercase absolute -top-2 right-6 bg-white px-3">بيان إضافي / ADDITIONAL INFO</span>
                       <p className="text-[11px] font-black text-zinc-700 leading-snug italic">{customNotes}</p>
                    </div>
                  )}
               </div>

               {/* NET TOTAL BOX */}
               <div className="flex-shrink-0 flex flex-col items-center justify-center text-white rounded-[2.5rem] px-14 py-8 ml-8 shadow-2xl relative overflow-hidden" style={{ backgroundColor: getAccentColor() }}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full"></div>
                  <span className="text-[12px] font-black uppercase tracking-widest mb-2 opacity-80 z-10">صافي المستحق / NET TOTAL</span>
                  <div className="text-6xl font-black font-mono tracking-tighter leading-none z-10">{totalAmount.toLocaleString()}</div>
                  <span className="text-sm font-bold uppercase mt-4 bg-white/20 px-6 py-1 rounded-full z-10">
                     {activeCurrencySymbol}
                  </span>
               </div>
            </div>

            {/* Corporate Footer */}
            <div className="mt-12 pt-6 border-t border-zinc-100 flex justify-between items-end text-zinc-400">
               <div className="flex flex-col">
                  <div className="w-48 border-b-2 border-zinc-200 mb-2"></div>
                  <span className="text-[10px] font-black uppercase">التوقيع والختم المعتمد / SIGNATURE</span>
               </div>
               <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">ACCOUNTING LEDGER SYSTEM</span>
                  <span className="text-[12px] font-black text-rose-900 italic">SAMLATOR2026 Secured Terminal</span>
               </div>
            </div>

            <div className="absolute bottom-4 left-4 text-[7px] font-bold text-zinc-200 uppercase tracking-[0.2em] pointer-events-none">X.O COMPANY V2026.1 - ALL RIGHTS RESERVED</div>
         </div>
      </div>
    </div>
  );
};

export default ProfessionalInvoiceView;
