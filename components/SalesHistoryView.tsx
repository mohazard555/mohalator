
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Search, FileDown, Clock, Calendar, Edit2, Trash2, Filter, Package, ChevronDown, Check, X, HardDrive, Printer, FileText, Upload } from 'lucide-react';
import { SalesInvoice, AppSettings, InvoiceItem } from '../types';
import { exportToCSV } from '../utils/export';
import { PdfExportService } from '../utils/PdfExportService';
import { tafqeet } from '../utils/tafqeet';
// استيراد مكتبة Excel برمجياً عبر esm.sh لضمان التوافق
import * as XLSX from 'https://esm.sh/xlsx';

interface SalesHistoryViewProps {
  onBack: () => void;
  onEdit?: (invoice: SalesInvoice) => void;
}

const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ onBack, onEdit }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [uniqueItems, setUniqueItems] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadInvoices();
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const loadInvoices = () => {
    const savedInv = localStorage.getItem('sheno_sales_invoices');
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
  };

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

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    await PdfExportService.export({
      element: reportRef.current,
      fileName: `سجل_مبيعات_${new Date().toLocaleDateString('ar-SA')}`,
      orientation: 'landscape',
      format: 'a4'
    });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) throw new Error("الملف فارغ");

        const importedInvoices: SalesInvoice[] = jsonData.map((row, idx) => {
          const rawItems = row['الأصناف'] || row['Items'] || "";
          const items: InvoiceItem[] = String(rawItems).split('|').map(itemStr => {
            const cleanStr = itemStr.replace('•', '').trim();
            const name = cleanStr.split('(')[0].trim();
            const qtyMatch = cleanStr.match(/\(([^)]+)\)/);
            const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
            return {
              id: crypto.randomUUID(),
              code: 'IMPORTED',
              name: name || 'صنف مستورد',
              quantity: isNaN(quantity) ? 1 : quantity,
              price: 0,
              unit: 'قطعة',
              total: 0,
              date: row['التاريخ'] || row['Date'] || new Date().toISOString().split('T')[0],
              notes: 'مستورد'
            };
          }).filter(it => it.name !== 'صنف مستورد' || it.quantity > 0);

          const total = parseFloat(String(row['الإجمالي'] || row['Total'] || "0").replace(/,/g, ''));

          return {
            id: crypto.randomUUID(),
            invoiceNumber: String(row['رقم'] || row['InvoiceNo'] || (Date.now() + idx)),
            date: row['التاريخ'] || row['Date'] || new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('ar-SA'),
            customerName: row['العميل'] || row['Customer'] || 'عميل مستورد',
            items: items.length > 0 ? items : [{ id: crypto.randomUUID(), code: 'IMP', name: 'بضاعة عامة', quantity: 1, price: total, unit: 'قطعة', total: total, date: '', notes: '' }],
            totalAmount: total,
            totalAmountLiteral: tafqeet(total, settings?.currency || "ليرة سورية"),
            notes: row['ملاحظات'] || row['Notes'] || 'مستورد',
            paidAmount: parseFloat(String(row['المدفوع'] || row['Paid'] || "0").replace(/,/g, '')),
            paymentType: 'نقداً',
            currencySymbol: settings?.currencySymbol || 'ل.س'
          };
        });

        if (window.confirm(`تم العثور على ${importedInvoices.length} سجل. دمج البيانات؟`)) {
          const merged = [...importedInvoices, ...invoices];
          const unique = Array.from(new Map(merged.map(inv => [inv.invoiceNumber, inv])).values());
          localStorage.setItem('sheno_sales_invoices', JSON.stringify(unique));
          setInvoices(unique);
          alert('تم الاستيراد بنجاح!');
        }
      } catch (err) {
        alert('خطأ في قراءة الملف.');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
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
          <h2 className="text-2xl font-black text-rose-700">سجل المبيعات العام</h2>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".xlsx, .xls, .csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg transition-all">
             {isImporting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Upload className="w-5 h-5" />}
             استيراد Excel
          </button>
          <button onClick={handleExportPDF} className="bg-rose-700 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
             <FileText className="w-5 h-5" /> تصدير PDF
          </button>
          <button onClick={() => exportToCSV(filteredInvoices, 'sales_history')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4 no-print shadow-xl">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] flex flex-col gap-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">بحث نصي (فاتورة، عميل، صنف)</label>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input type="text" placeholder="ابحث..." className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 pr-12 outline-none font-bold text-readable" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 min-w-[200px] flex flex-col gap-1 relative">
            <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">تحديد مواد</label>
            <button onClick={() => setShowItemDropdown(!showItemDropdown)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 px-4 flex items-center justify-between font-bold text-readable">
              <div className="flex items-center gap-2 truncate"><Package className="w-4 h-4 text-rose-500 shrink-0" /><span className="truncate">{selectedItems.length > 0 ? `مختار (${selectedItems.length})` : 'جميع المواد'}</span></div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showItemDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showItemDropdown && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2">
                <button onClick={() => setSelectedItems([])} className="w-full text-right p-2 text-[10px] font-black text-rose-500 border-b mb-1 hover:bg-rose-50 rounded-lg">إعادة تعيين</button>
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

      <div ref={reportRef} className="bg-white p-4 md:p-8 rounded-3xl border border-zinc-200 shadow-sm print:shadow-none print:border-rose-700 print:rounded-none">
        <div className="flex justify-between items-center bg-rose-700 p-6 rounded-t-xl text-white mb-6 print:m-0">
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

        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-right border-collapse text-[10px]">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 font-black border-b h-12">
                <th className="p-2 border-l w-12 text-center">م</th>
                <th className="p-2 border-l w-16 text-center">رقم</th>
                <th className="p-2 border-l w-20 text-center">تاريخ</th>
                <th className="p-2 border-l">العميل</th>
                <th className="p-2 border-l text-right w-48">الأصناف</th>
                <th className="p-2 border-l text-center w-12">العدد</th>
                <th className="p-2 border-l text-center w-24">الإجمالي</th>
                <th className="p-2 text-center w-20 no-print">إجراءات</th>
                <th className="p-2 text-center w-20">المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold">
              {filteredInvoices.map((inv, idx) => (
                <tr key={inv.id} className="hover:bg-zinc-50 transition-colors h-12">
                  <td className="p-2 border-l text-center font-mono">{filteredInvoices.length - idx}</td>
                  <td className="p-2 border-l text-center text-rose-700 font-black">#{inv.invoiceNumber}</td>
                  <td className="p-2 border-l text-center font-mono">{inv.date}</td>
                  <td className="p-2 border-l truncate max-w-[120px]">{inv.customerName}</td>
                  <td className="p-2 border-l">
                    <div className="flex flex-col gap-0.5">
                      {inv.items.map((it, i) => (
                        <div key={i} className="truncate text-[9px]">• {it.name} ({it.quantity})</div>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 border-l text-center font-mono">{inv.items.reduce((s,i) => s + i.quantity, 0)}</td>
                  <td className="p-2 border-l text-center font-black text-rose-600 font-mono">{inv.totalAmount.toLocaleString()}</td>
                  <td className="p-2 border-l text-center no-print">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onEdit?.(inv)} className="text-zinc-500 hover:text-amber-500 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(inv.id, inv.invoiceNumber)} className="text-zinc-500 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                  <td className="p-2 text-center text-emerald-600 font-mono text-xs font-black">{inv.paidAmount?.toLocaleString() || '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesHistoryView;
