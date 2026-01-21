
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Search, FileDown, Clock, Calendar, Edit2, Trash2, Filter, Package, ChevronDown, Check, X } from 'lucide-react';
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

  const materialsAnalysis = selectedItems.length > 0 ? selectedItems.map(itemName => {
    let totalQty = 0;
    let totalVal = 0;
    filteredInvoices.forEach(inv => {
      inv.items.forEach(it => { if (it.name === itemName) { totalQty += it.quantity; totalVal += it.total; } });
      inv.usedMaterials?.forEach(m => { if (m.name === itemName) totalQty += m.quantity; });
    });
    return { name: itemName, qty: totalQty, val: totalVal };
  }) : [];

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

      <div className="print-only print-header flex justify-between items-center bg-rose-700 p-6 rounded-t-xl text-white mb-0 border-b-0">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
          <div>
            <h1 className="text-2xl font-black">{settings?.companyName}</h1>
            <p className="text-xs opacity-80">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black underline decoration-white/30 underline-offset-8">سجل المبيعات المفلتر</h2>
          <div className="flex gap-4 justify-center mt-2">
            <p className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded">إجمالي القطع: {totalFilteredPieces.toLocaleString()}</p>
            <p className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded">إجمالي القيمة: {totalFilteredAmount.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-left text-xs font-bold space-y-1">
          <p>{settings?.address}</p>
          <p>{startDate || 'البداية'} ← {endDate || 'اليوم'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"><ArrowRight className="w-6 h-6" /></button>
          <h2 className="text-2xl font-black text-rose-700">سجل المبيعات العام والتحليل</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(filteredInvoices, 'full_sales_history')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg"><FileDown className="w-5 h-5" /> تصدير XLSX</button>
          <button onClick={() => window.print()} className="bg-rose-100 text-rose-700 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-rose-200"><Printer className="w-5 h-5" /> طباعة السجل المفلتر</button>
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

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl print:border-rose-700 print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-[10px]">
            <thead>
              <tr className="bg-rose-700 text-white font-black uppercase tracking-tighter border-b border-rose-800 h-14">
                <th className="p-3 border-l border-rose-800 text-center w-12">تسلسل</th>
                <th className="p-3 border-l border-rose-800 text-center w-16">رقم</th>
                <th className="p-3 border-l border-rose-800 text-center w-20">تاريخ</th>
                <th className="p-3 border-l border-rose-800 text-center">العميل</th>
                <th className="p-3 border-l border-rose-800 text-right w-48">الأصناف المباعة</th>
                <th className="p-3 border-l border-rose-800 text-right w-40">المواد المستخدمة</th>
                <th className="p-3 border-l border-rose-800 text-center w-12">العدد</th>
                <th className="p-3 border-l border-rose-800 text-center w-24">إجمالي الفاتورة</th>
                <th className="p-3 border-l border-rose-800 text-right w-48">التفقيط</th>
                <th className="p-3 border-l border-zinc-800 text-center w-16">وقت</th>
                <th className="p-3 border-l border-zinc-800 text-center w-20 no-print">إجراءات</th>
                <th className="p-3 text-center w-20">المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold print:divide-zinc-300">
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={12} className="p-16 text-center italic text-zinc-400">لا يوجد سجلات مبيعات تطابق الفلترة</td></tr>
              ) : (
                <>
                  {filteredInvoices.map((inv, idx) => (
                    <tr key={inv.id} className="hover:bg-rose-50 dark:hover:bg-zinc-800/30 transition-colors h-12">
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-400">{filteredInvoices.length - idx}</td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center text-rose-700 font-black">#{inv.invoiceNumber}</td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono">{inv.date}</td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-readable truncate max-w-[120px]">{inv.customerName}</td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-col gap-0.5 max-h-12 overflow-y-auto">
                          {inv.items.map((it, i) => (
                            <div key={i} className={`flex items-center gap-1 truncate ${selectedItems.includes(it.name) || (searchTerm && it.name.toLowerCase().includes(searchTerm.toLowerCase())) ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded px-1 font-black' : ''}`}>
                               {it.image && <img src={it.image} className="w-5 h-5 rounded-sm object-cover cursor-zoom-in" onClick={() => setPreviewImage(it.image!)} />}
                               • {it.name} ({it.quantity})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                          {inv.usedMaterials?.map((m, i) => (
                            <span key={i} className={`px-1 py-0.5 rounded-sm text-[8px] border ${selectedItems.includes(m.name) ? 'bg-emerald-600 text-white border-emerald-700 font-black' : 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900'}`}>{m.name} ({m.quantity})</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono font-black text-rose-700">{inv.items.reduce((s,i) => s + i.quantity, 0)}</td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-black text-rose-600 font-mono text-xs bg-rose-50/30 dark:bg-rose-950/20 print:bg-transparent">{inv.totalAmount.toLocaleString()} {inv.currencySymbol}</td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-[8px] font-normal text-zinc-500 leading-tight">{inv.totalAmountLiteral}</td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-[8px] text-zinc-400">{inv.time}</td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => window.print()} className="p-1 text-zinc-400 hover:text-primary transition-all"><Printer className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(inv.id, inv.invoiceNumber)} className="p-1 text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                      <td className="p-2 text-center text-emerald-600 font-mono text-xs font-black">{inv.paidAmount?.toLocaleString() || '0'}</td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-50 dark:bg-zinc-800 h-12 border-t-2 border-rose-700">
                    <td colSpan={6} className="p-2 text-center font-black uppercase tracking-widest text-zinc-500">إجمالي السجل المفلتر</td>
                    <td className="p-2 text-center font-mono font-black text-rose-700 text-sm">{totalFilteredPieces.toLocaleString()}</td>
                    <td className="p-2 text-center font-mono font-black text-rose-700 text-sm bg-rose-100/50 dark:bg-rose-900/30">{totalFilteredAmount.toLocaleString()} {settings?.currencySymbol}</td>
                    <td colSpan={4} className="p-2"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesHistoryView;
