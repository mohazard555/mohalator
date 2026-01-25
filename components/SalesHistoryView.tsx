
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Search, FileDown, Clock, Calendar, Edit2, Trash2, Filter, Package, ChevronDown, Check, X, HardDrive, Printer, FileText } from 'lucide-react';
import { SalesInvoice, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

declare var html2pdf: any;

interface SalesHistoryViewProps {
  onBack: () => void;
  onEdit?: (invoice: SalesInvoice) => void;
}

const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ onBack, onEdit }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [uniqueItems, setUniqueItems] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const savedInv = localStorage.getItem('sheno_sales_invoices');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedInv) {
      const parsedInv: SalesInvoice[] = JSON.parse(savedInv);
      setInvoices(parsedInv);
      const itemsSet = new Set<string>();
      parsedInv.forEach(inv => {
        inv.items.forEach(it => itemsSet.add(it.name));
        inv.usedMaterials?.forEach(m => itemsSet.add(m.name));
      });
      setUniqueItems(Array.from(itemsSet).sort());
    }
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       inv.invoiceNumber.includes(searchTerm) ||
                       inv.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
    let matchItems = true;
    if (selectedItems.length > 0) {
      const invoiceAllItems = [...inv.items.map(it => it.name), ...(inv.usedMaterials?.map(m => m.name) || [])];
      matchItems = selectedItems.some(selected => invoiceAllItems.includes(selected));
    }
    return matchSearch && matchDate && matchItems;
  });

  const totalFilteredPieces = filteredInvoices.reduce((sum, inv) => sum + inv.items.reduce((s,i) => s + i.quantity, 0), 0);
  const totalFilteredAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const usedMaterialsByUnit = filteredInvoices.reduce((acc: Record<string, number>, inv) => {
    inv.usedMaterials?.forEach(m => {
      const unit = m.unit || 'قطعة';
      acc[unit] = (acc[unit] || 0) + m.quantity;
    });
    return acc;
  }, {});

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `سجل_مبيعات_${new Date().toLocaleDateString('ar-SA')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const toggleItemSelection = (name: string) => {
    setSelectedItems(prev => prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]);
  };

  const handleDelete = (id: string, invNum: string) => {
    if (window.confirm('حذف الفاتورة نهائياً؟')) {
       const updated = invoices.filter(i => i.id !== id);
       setInvoices(updated);
       localStorage.setItem('sheno_sales_invoices', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6">
      {previewImage && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-10 right-10 text-white hover:text-rose-500 transition-colors no-print">
            <X className="w-10 h-10" />
          </button>
          <img src={previewImage} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" onClick={(e) => e.stopPropagation()} alt="Full Preview" />
        </div>
      )}

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"><ArrowRight className="w-6 h-6" /></button>
          <h2 className="text-2xl font-black text-rose-700">سجل المبيعات المفلتر</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="bg-rose-700 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
             <FileText className="w-5 h-5" /> تصدير PDF
          </button>
          <button onClick={() => exportToCSV(filteredInvoices, 'full_sales_history')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
          <button onClick={() => window.print()} className="bg-rose-100 text-rose-700 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-rose-200">طباعة السجل</button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4 no-print shadow-xl">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] flex flex-col gap-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">بحث نصي (فاتورة، عميل، صنف)</label>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input type="text" placeholder="ابحث برقم الفاتورة، العميل، أو الصنف..." className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 pr-12 outline-none font-bold focus:border-rose-700 transition-all text-readable" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 min-w-[200px] flex flex-col gap-1 relative">
            <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">تحديد أصناف معينة للتحليل</label>
            <button onClick={() => setShowItemDropdown(!showItemDropdown)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 px-4 flex items-center justify-between font-bold text-readable hover:bg-zinc-100 transition-all overflow-hidden">
              <div className="flex items-center gap-2 truncate"><Package className="w-4 h-4 text-rose-500 shrink-0" /><span className="truncate">{selectedItems.length > 0 ? `مختار (${selectedItems.length}) أصناف` : 'جميع المواد'}</span></div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showItemDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showItemDropdown && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2 animate-in slide-in-from-top-2">
                <button onClick={() => setSelectedItems([])} className="w-full text-right p-2 text-[10px] font-black text-rose-500 border-b mb-1 hover:bg-rose-50 rounded-lg">إعادة تعيين (الكل)</button>
                {uniqueItems.map(item => (
                  <div key={item} onClick={() => toggleItemSelection(item)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedItems.includes(item) ? 'bg-rose-500/10 text-rose-600' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><span className="font-bold text-xs">{item}</span>{selectedItems.includes(item) && <Check className="w-4 h-4" />}</div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 h-[52px]">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <div className="flex items-center gap-2"><span className="text-[10px] font-black text-zinc-500">من</span><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-readable" /><span className="text-[10px] font-black text-zinc-500">إلى</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-readable" /></div>
          </div>
        </div>
      </div>

      {/* Report Section for PDF and Print */}
      <div ref={reportRef} className="bg-white p-4 md:p-8 rounded-3xl border border-zinc-200 shadow-sm print:shadow-none print:border-rose-700 print:rounded-none">
        {/* Report Header (Visible in PDF and Print) */}
        <div className="flex justify-between items-center bg-rose-700 p-6 rounded-t-xl text-white mb-6 border-b-0 print:m-0">
          <div className="flex items-center gap-4">
            {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
            <div>
              <h1 className="text-2xl font-black">{settings?.companyName || 'SAMLATOR'}</h1>
              <p className="text-xs opacity-80">{settings?.companyType}</p>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black underline underline-offset-8">سجل مبيعات المنشأة</h2>
            <div className="flex flex-col gap-1 mt-2">
              <p className="text-[10px] font-black">الفترة: {startDate || 'البداية'} ← {endDate || 'اليوم'}</p>
            </div>
          </div>
          <div className="text-left text-xs font-bold space-y-1">
            <p>{settings?.address}</p>
            <p>{new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>

        {/* Aggregate Summary */}
        <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 mb-6 flex flex-wrap gap-8 items-center justify-center">
          <div className="flex flex-col items-center">
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">إجمالي القطع</span>
             <span className="text-2xl font-mono font-black text-emerald-600">{totalFilteredPieces.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">إجمالي المبيعات</span>
             <span className="text-2xl font-mono font-black text-rose-600">{totalFilteredAmount.toLocaleString()} {settings?.currencySymbol}</span>
          </div>
          <div className="h-10 w-px bg-zinc-200"></div>
          {Object.entries(usedMaterialsByUnit).map(([unit, total]) => (
            <div key={unit} className="flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">استهلاك ({unit})</span>
              <span className="text-xl font-mono font-black text-zinc-700">{total.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-right border-collapse text-[10px]">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 font-black uppercase tracking-tighter border-b h-12">
                <th className="p-2 border-l w-12 text-center">م</th>
                <th className="p-2 border-l w-16 text-center">رقم</th>
                <th className="p-2 border-l w-20 text-center">تاريخ</th>
                <th className="p-2 border-l">العميل</th>
                <th className="p-2 border-l text-right w-48">الأصناف</th>
                <th className="p-2 border-l text-right w-40">المواد المستخدمة</th>
                <th className="p-2 border-l text-center w-12">العدد</th>
                <th className="p-2 border-l text-center w-24">الإجمالي</th>
                <th className="p-2 text-center w-20 no-print">إجراءات</th>
                <th className="p-2 text-center w-20">المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold">
              {filteredInvoices.map((inv, idx) => (
                <tr key={inv.id} className="hover:bg-zinc-50 transition-colors h-12">
                  <td className="p-2 border-l text-center font-mono text-zinc-400">{filteredInvoices.length - idx}</td>
                  <td className="p-2 border-l text-center text-rose-700 font-black">#{inv.invoiceNumber}</td>
                  <td className="p-2 border-l text-center font-mono">{inv.date}</td>
                  <td className="p-2 border-l truncate max-w-[120px]">{inv.customerName}</td>
                  <td className="p-2 border-l">
                    <div className="flex flex-col gap-0.5">
                      {inv.items.map((it, i) => (
                        <div key={i} className="truncate text-[8px]">• {it.name} ({it.quantity})</div>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 border-l">
                    <div className="flex flex-wrap gap-1">
                      {inv.usedMaterials?.map((m, i) => (
                        <span key={i} className="px-1 py-0.5 rounded-sm text-[8px] border bg-rose-50 text-rose-600">{m.name} ({m.quantity})</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 border-l text-center font-mono font-black">{inv.items.reduce((s,i) => s + i.quantity, 0)}</td>
                  <td className="p-2 border-l text-center font-black text-rose-600 font-mono">{inv.totalAmount.toLocaleString()}</td>
                  <td className="p-2 border-l text-center no-print">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onEdit?.(inv)} className="text-zinc-400 hover:text-amber-500 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(inv.id, inv.invoiceNumber)} className="text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                  <td className="p-2 text-center text-emerald-600 font-mono text-xs font-black">{inv.paidAmount?.toLocaleString() || '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 flex justify-between items-center text-[10px] font-black text-zinc-400 italic">
           <span>نظام SAMLATOR المحاسبي - تقارير ذكية</span>
           <span>توقيع المدير: .................................</span>
        </div>
      </div>
    </div>
  );
};

export default SalesHistoryView;
