
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, ChevronDown, Globe, FileText, RotateCcw, Truck, ShoppingBag, X, FileDown, MessageSquare, Coins } from 'lucide-react';
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
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
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
  const activeCurrencySymbol = document?.currencySymbol || settings.currencySymbol;

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { margin: 0; padding: 0; background: white !important; }
          .no-print { display: none !important; }
          .professional-invoice-box { 
            width: 100% !important; height: 100% !important; 
            margin: 0 !important; border: none !important; box-shadow: none !important; 
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
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">تخصيص وطباعة وحفظ المستندات كـ PDF</p>
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
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">1. اختر الفاتورة المطلوب تصديرها</label>
               <select value={selectedId} onChange={e => handleSelect(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 text-readable rounded-2xl py-4 px-4 outline-none w-full text-lg font-black appearance-none cursor-pointer focus:border-primary transition-all shadow-inner">
                  <option value="">-- اختر السند --</option>
                  {list.map(i => <option key={i.id} value={i.id}>#{i.invoiceNumber} - {i.customerName || i.supplierName}</option>)}
               </select>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-2">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">2. ملاحظات التصدير الإضافية (تظهر في PDF)</label>
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
               <FileDown className="w-6 h-6" /> تصدير الفاتورة كـ PDF
            </button>
            <button onClick={() => window.print()} className="bg-zinc-900 text-white px-12 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 hover:scale-105 transition-all text-lg border border-zinc-700">
               <Printer className="w-6 h-6" /> طباعة فورية
            </button>
         </div>
      </div>

      {/* Professional Invoice Content (PDF Ref Container) */}
      <div className="flex justify-center p-0 md:p-10 bg-zinc-200 dark:bg-zinc-800/50 rounded-[4rem] overflow-hidden border-4 border-white dark:border-zinc-800 shadow-inner">
         <div ref={invoiceRef} className="professional-invoice-box bg-white text-zinc-900 w-[210mm] min-h-[148.5mm] shadow-2xl flex flex-col p-10 relative" id="professional-document">
            
            {/* Header Content */}
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center gap-6">
                  {settings.logoUrl ? <img src={settings.logoUrl} className="w-24 h-auto object-contain rounded" alt="Logo" /> : <div className="text-4xl font-black text-rose-900">SAMLATOR</div>}
                  <div>
                    <h1 className="text-4xl font-black text-rose-900 leading-none mb-1">{settings.companyName}</h1>
                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">{settings.companyType}</p>
                  </div>
               </div>

               <div className="flex flex-col items-end gap-3">
                  <div className="text-white px-12 py-3 font-black text-2xl tracking-wider min-w-[260px] text-center rounded-sm" style={{ backgroundColor: getAccentColor() }}>
                    {getDocTitle().toUpperCase()}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-3 justify-end">
                       <span className="text-[10px] font-black text-zinc-400 uppercase">DATE / التاريخ</span>
                       <span className="font-mono text-sm font-black">{document?.date || '----/--/--'}</span>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                       <span className="text-[10px] font-black text-zinc-400 uppercase">NO / رقم السند</span>
                       <span className="font-mono text-4xl font-black text-zinc-800 tracking-tighter">#{document?.invoiceNumber || '0000'}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="border-b-[6px] mb-8" style={{ borderColor: getAccentColor() }}></div>

            {/* Entity Info */}
            <div className="flex items-center justify-between mb-8">
               <div className="flex-1">
                  <div className="flex items-center gap-4">
                     <div className="w-2 h-10" style={{ backgroundColor: getAccentColor() }}></div>
                     <div>
                        <span className="text-[11px] font-black text-zinc-400 uppercase block mb-1">المطلوب من السيد / MESSRS</span>
                        <span className="text-2xl font-black italic text-zinc-800 leading-none">{document?.customerName || document?.supplierName || '................................................'}</span>
                     </div>
                  </div>
               </div>

               <div className="flex-shrink-0">
                  <div className="border-[3px] border-zinc-900 rounded-[2rem] px-8 py-3 flex flex-col items-center justify-center bg-zinc-50">
                     <span className="text-[10px] font-black text-zinc-400 uppercase mb-0.5">إجمالي البنود</span>
                     <span className="text-3xl font-black font-mono leading-none" style={{ color: getAccentColor() }}>
                        {document?.items?.reduce((s:number,c:any) => s + c.quantity, 0) || '00'}
                     </span>
                  </div>
               </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-hidden">
               <table className="w-full text-right border-collapse">
                  <thead>
                     <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest h-10">
                        <th className="p-2 pr-4 border border-zinc-900">الوصف / DESCRIPTION</th>
                        <th className="p-2 text-center w-20 border border-zinc-900">الكمية</th>
                        <th className="p-2 text-center w-32 border border-zinc-900">السعر</th>
                        <th className="p-2 text-center w-32 border border-zinc-900">الإجمالي</th>
                        <th className="p-2 text-center w-48 border border-zinc-900">ملاحظات</th>
                     </tr>
                  </thead>
                  <tbody className="text-[12px] font-black">
                     {(document?.items || Array.from({ length: 6 })).map((item: any, idx: number) => (
                        <tr key={idx} className="h-16 border border-zinc-300">
                           <td className="p-2 pr-4 text-zinc-800 border-l border-zinc-300 align-middle">
                              {item ? (
                                <div className="flex items-center gap-4">
                                   {item.image && (
                                     <img src={item.image} className="w-14 h-14 object-contain rounded-lg border border-zinc-200 shadow-sm bg-zinc-50" alt="الصنف" />
                                   )}
                                   <div className="flex flex-col">
                                      <span className="text-sm font-black">{item.name}</span>
                                      {item.serialNumber && <span className="text-[8px] text-zinc-400 font-mono tracking-widest">SN: {item.serialNumber}</span>}
                                   </div>
                                </div>
                              ) : '..........................................................'}
                           </td>
                           <td className="p-2 text-center font-mono text-xl border-l border-zinc-300 align-middle text-zinc-900">{item?.quantity || ''}</td>
                           <td className="p-2 text-center font-mono text-xl border-l border-zinc-300 align-middle text-zinc-900">{item?.price?.toLocaleString() || ''}</td>
                           <td className="p-2 text-center font-mono text-xl border-l border-zinc-300 align-middle text-zinc-900 bg-zinc-50/50" style={{ color: getAccentColor() }}>{item ? (item.quantity * item.price).toLocaleString() : ''}</td>
                           <td className="p-2 text-center text-zinc-600 font-bold italic align-middle">
                              {idx === 0 ? (document?.notes || item?.notes || '---') : (item?.notes || '---')}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Financial Summary */}
            <div className="mt-6 flex items-start justify-between border-t-[3px] border-zinc-900 pt-6">
               <div className="flex-1 space-y-4 pr-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block mb-1.5" style={{ color: getAccentColor() }}>المبلغ الإجمالي كتابةً / IN WORDS</span>
                    <div className="text-sm font-black italic text-zinc-500">{document?.totalAmountLiteral || '................................................................................................'}</div>
                  </div>
                  
                  <div className="bg-zinc-50 p-3 border-2 border-zinc-100 rounded-2xl min-h-[50px] relative">
                     <span className="text-[8px] font-black text-zinc-400 uppercase absolute -top-2 right-6 bg-white px-3">بيان إضافي / ADDITIONAL INFO</span>
                     <p className="text-[11px] font-black text-zinc-700 leading-snug whitespace-pre-wrap italic">
                        {customNotes || '................................................................................................................................................'}
                     </p>
                  </div>
               </div>

               <div className="flex-shrink-0 flex flex-col items-center justify-center text-white rounded-3xl px-12 py-5 ml-4 min-w-[220px] shadow-2xl" style={{ backgroundColor: getAccentColor() }}>
                  <span className="text-[11px] font-black uppercase tracking-widest mb-1 opacity-80">صافي المستحق / NET TOTAL</span>
                  <div className="text-5xl font-black font-mono tracking-tighter leading-none">{totalAmount.toLocaleString()}</div>
                  <span className="text-xs font-bold uppercase mt-2">
                     {activeCurrencySymbol}
                  </span>
               </div>
            </div>

            {/* Detailed Footer */}
            <div className="mt-auto pt-4 flex justify-between items-end">
               <div className="text-center">
                  <div className="w-44 border-b-2 border-zinc-900 mb-2"></div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">توقيع المحاسب المعتمد</span>
               </div>
               <div className="flex flex-col items-end gap-1 text-[10px] font-bold text-zinc-400">
                  <div className="flex items-center gap-4 bg-zinc-50 px-4 py-1.5 rounded-full border">
                     <div className="flex items-center gap-1"><span>{settings.address}</span></div>
                     <div className="w-px h-3 bg-zinc-200"></div>
                     <div className="flex items-center gap-1 font-mono">{settings.phone}</div>
                  </div>
                  <div className="flex items-center gap-2 font-black tracking-[0.3em] mt-1" style={{ color: getAccentColor() }}>
                     <Globe className="w-3 h-3" /> {settings.website.toUpperCase() || 'WWW.SAMLATOR.SY'}
                  </div>
               </div>
            </div>

            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none pointer-events-none z-[-1]">
               <h1 className="text-[100px] font-black -rotate-12 uppercase">{settings.companyName}</h1>
            </div>
         </div>
      </div>

      <div className="text-center text-zinc-500 text-[10px] font-bold pb-20 no-print">
         ملاحظة: يمكنك تصدير الملف كـ PDF مستقل أو طباعته مباشرة. نسخة الـ PDF مصممة بدقة عالية للطباعة الملونة.
      </div>
    </div>
  );
};

export default ProfessionalInvoiceView;
