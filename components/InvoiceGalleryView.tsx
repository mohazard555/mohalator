
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Search, ImageIcon, FileText, Calendar, User, Hash, FileDown, Eye, X, ZoomIn, Download, ExternalLink, Share2, DollarSign } from 'lucide-react';
import { SalesInvoice, PurchaseInvoice, AppSettings } from '../types';
import { ImageExportService } from '../utils/ImageExportService';

interface InvoiceGalleryViewProps {
  onBack: () => void;
}

interface GalleryItem {
  url: string;
  inv: any;
  type: string;
  item: string;
  partyName: string;
}

const InvoiceGalleryView: React.FC<InvoiceGalleryViewProps> = ({ onBack }) => {
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const sSales = localStorage.getItem('sheno_sales_invoices');
    const sPurch = localStorage.getItem('sheno_purchases');
    const sSett = localStorage.getItem('sheno_settings');
    if (sSales) setSales(JSON.parse(sSales));
    if (sPurch) setPurchases(JSON.parse(sPurch));
    if (sSett) setSettings(JSON.parse(sSett));
  }, []);

  const allImages: GalleryItem[] = [
    ...sales.flatMap(inv => inv.items.filter(it => it.image).map(it => ({ 
      url: it.image!, 
      inv, 
      type: 'مبيعات', 
      item: it.name,
      partyName: inv.customerName
    }))),
    ...purchases.flatMap(inv => inv.items.filter(it => it.image).map(it => ({ 
      url: it.image!, 
      inv, 
      type: 'مشتريات', 
      item: it.name,
      partyName: inv.supplierName
    })))
  ].filter(img => 
    img.inv.invoiceNumber.includes(searchTerm) || 
    img.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCard = async (id: string, name: string) => {
    const el = itemRefs.current[id];
    if (el) {
      await ImageExportService.exportAsPng(el, `بطاقة_فاتورة_${name}`);
    }
  };

  const handleShare = async () => {
    if (!selectedImage) return;

    try {
      const response = await fetch(selectedImage.url);
      const blob = await response.blob();
      const file = new File([blob], `invoice_${selectedImage.inv.invoiceNumber}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `فاتورة ${selectedImage.type} رقم ${selectedImage.inv.invoiceNumber}`,
          text: `فاتورة ${selectedImage.type} رقم ${selectedImage.inv.invoiceNumber}\nالطرف الثاني: ${selectedImage.partyName}\nالمادة: ${selectedImage.item}\nالقيمة: ${selectedImage.inv.totalAmount.toLocaleString()} ${settings?.currencySymbol}`,
        });
      } else {
        await navigator.share({
          title: `فاتورة ${selectedImage.type} رقم ${selectedImage.inv.invoiceNumber}`,
          text: `تفاصيل الفاتورة رقم ${selectedImage.inv.invoiceNumber} للطرف ${selectedImage.partyName}`,
          url: window.location.href
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center p-4 md:p-20 animate-in fade-in" onClick={() => setSelectedImage(null)}>
           <button className="absolute top-10 right-10 text-white hover:text-rose-500 z-[501]"><X className="w-10 h-10" /></button>
           <div className="relative max-w-5xl w-full flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="flex-1 bg-zinc-100 flex items-center justify-center p-4">
                 <img src={selectedImage.url} className="max-h-[80vh] object-contain shadow-lg rounded-xl border border-zinc-200" alt="Full" />
              </div>
              <div className="w-full md:w-80 p-8 flex flex-col gap-6 text-right" dir="rtl">
                 <div className="space-y-1">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{selectedImage.type}</span>
                    <h2 className="text-2xl font-black text-zinc-900 leading-tight">#{selectedImage.inv.invoiceNumber}</h2>
                 </div>
                 <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                       <User className="w-5 h-5 text-zinc-400" />
                       <div><p className="text-[9px] font-bold text-zinc-400 uppercase">الطرف الثاني</p><p className="font-black text-zinc-800">{selectedImage.partyName}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                       <Calendar className="w-5 h-5 text-zinc-400" />
                       <div><p className="text-[9px] font-bold text-zinc-400 uppercase">تاريخ العملية</p><p className="font-mono font-bold text-zinc-800">{selectedImage.inv.date}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                       <DollarSign className="w-5 h-5 text-zinc-400" />
                       <div><p className="text-[9px] font-bold text-zinc-400 uppercase">إجمالي الفاتورة</p><p className="font-mono font-black text-rose-700 text-xl">{selectedImage.inv.totalAmount.toLocaleString()} <span className="text-xs">{settings?.currencySymbol}</span></p></div>
                    </div>
                 </div>
                 
                 <div className="flex flex-col gap-2 mt-auto">
                    <button 
                       onClick={handleShare}
                       className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:brightness-110 transition-all"
                    >
                       <Share2 className="w-5 h-5" /> مشاركة المستند
                    </button>
                    
                    <button onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedImage.url;
                      link.download = `فاتورة_${selectedImage.inv.invoiceNumber}.png`;
                      link.click();
                    }} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all">
                       <Download className="w-5 h-5" /> حفظ الصورة الأصلية
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all"><ArrowRight className="w-6 h-6" /></button>
          <div className="flex items-center gap-3">
             <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl"><ImageIcon className="w-8 h-8" /></div>
             <div>
                <h2 className="text-2xl font-black text-readable">معرض صور وبطاقات الفواتير</h2>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">تصفح مرئي لكافة المستندات والمرفقات الصورية</p>
             </div>
          </div>
        </div>
        <div className="relative w-full md:w-96 no-print">
           <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
           <input type="text" placeholder="بحث باسم الزبون، رقم الفاتورة..." className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 pr-12 rounded-2xl font-bold outline-none focus:border-primary shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
         {allImages.map((img, i) => {
           const cardId = `card-${i}`;
           return (
             <div key={i} ref={el => { itemRefs.current[cardId] = el; }} className="bg-white dark:bg-zinc-950 p-4 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl group hover:shadow-2xl transition-all export-fix">
                <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 shadow-inner bg-zinc-50 dark:bg-zinc-900">
                   <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Invoice Attachment" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 no-print">
                      <button onClick={() => setSelectedImage(img)} className="bg-white text-zinc-900 p-3 rounded-full shadow-2xl hover:scale-110 transition-transform"><ZoomIn className="w-6 h-6" /></button>
                      <button onClick={() => handleExportCard(cardId, img.inv.invoiceNumber)} className="bg-white text-zinc-900 p-3 rounded-full shadow-2xl hover:scale-110 transition-transform"><Share2 className="w-6 h-6" /></button>
                   </div>
                   <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${img.type === 'مبيعات' ? 'bg-primary' : 'bg-emerald-600'}`}>
                      سند {img.type}
                   </div>
                </div>

                <div className="px-4 space-y-4 text-right" dir="rtl">
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="font-black text-xl text-zinc-900 dark:text-white leading-tight">#{img.inv.invoiceNumber}</h3>
                         <p className="text-xs font-bold text-zinc-400 mt-1">{img.inv.date}</p>
                      </div>
                      <div className="text-left">
                         <span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">صافي القيمة</span>
                         <span className="text-xl font-mono font-black text-rose-700 dark:text-rose-400">{img.inv.totalAmount.toLocaleString()}</span>
                      </div>
                   </div>
                   
                   <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border dark:border-zinc-800 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400"><User className="w-3.5 h-3.5" /> {img.partyName}</div>
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400"><Hash className="w-3.5 h-3.5" /> {img.item}</div>
                   </div>
                   
                   <button onClick={() => setSelectedImage(img)} className="w-full bg-zinc-900 dark:bg-zinc-800 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 group-hover:bg-primary transition-colors no-print">
                      <ExternalLink className="w-4 h-4" /> عرض تفاصيل المستند بالكامل
                   </button>
                </div>
             </div>
           );
         })}
         {allImages.length === 0 && (
           <div className="col-span-full py-40 text-center space-y-4 opacity-50">
              <ImageIcon className="w-20 h-20 text-zinc-200 dark:text-zinc-800 mx-auto" />
              <p className="text-zinc-500 font-bold text-xl">لا توجد صور فواتير مرفقة حالياً في النظام.</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default InvoiceGalleryView;
