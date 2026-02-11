
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Save, Trash2, Edit2, RotateCcw, Printer, FileDown, X, Calendar, Filter, RefreshCcw, Landmark, AlertCircle, CheckSquare, Square, Percent } from 'lucide-react';
import { SalesInvoice, InvoiceItem, StockEntry, CashEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';
import { tafqeet } from '../utils/tafqeet';

interface SalesReturnViewProps {
  onBack: () => void;
  initialReturn?: any;
}

const SalesReturnView: React.FC<SalesReturnViewProps> = ({ onBack, initialReturn }) => {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [foundInvoice, setFoundInvoice] = useState<SalesInvoice | null>(null);
  const [returnItems, setReturnItems] = useState<InvoiceItem[]>([]);
  const [returnHistory, setReturnHistory] = useState<any[]>([]);
  const [editingReturnId, setEditingReturnId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // خيارات متقدمة لمرتجع مواد التصنيع والحسم
  const [returnMaterials, setReturnMaterials] = useState(false);
  const [adjustedDiscount, setAdjustedDiscount] = useState(0);

  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  useEffect(() => {
    const savedReturns = localStorage.getItem('sheno_sales_returns');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedReturns) setReturnHistory(JSON.parse(savedReturns));
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    if (initialReturn && !editingReturnId) {
      handleEditReturn(initialReturn);
    }
  }, [initialReturn]);

  // Fix: Calculate current return summary for display in UI
  const totalReturnItemsAmount = returnItems.reduce((s, i) => s + (i.quantity * i.price), 0);

  // Fix: Filter history based on search terms and date range
  const filteredHistory = returnHistory.filter(ret => {
    const matchSearch = ret.customerName.toLowerCase().includes(historySearchTerm.toLowerCase()) || 
                       ret.invoiceNumber.includes(historySearchTerm);
    const matchDate = (!historyStartDate || ret.date >= historyStartDate) && 
                     (!historyEndDate || ret.date <= historyEndDate);
    return matchSearch && matchDate;
  });

  // Fix: Added missing handleDeleteReturn function
  const handleDeleteReturn = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف سجل المرتجع هذا نهائياً؟ سيتم إلغاء أثره المالي والمخزني.')) {
      const updatedReturns = returnHistory.filter(r => r.id !== id);
      setReturnHistory(updatedReturns);
      localStorage.setItem('sheno_sales_returns', JSON.stringify(updatedReturns));
      removeAssociatedMovements(id);
    }
  };

  const handleSearch = () => {
    const saved = localStorage.getItem('sheno_sales_invoices');
    if (saved) {
      const invoices: SalesInvoice[] = JSON.parse(saved);
      const match = invoices.find(inv => inv.invoiceNumber === invoiceSearch);
      if (match) {
        setFoundInvoice(match);
        setReturnItems(match.items.map(i => ({ ...i, quantity: 0 })));
        setAdjustedDiscount(match.discountAmount || 0);
        setReturnMaterials(false);
        setEditingReturnId(null);
      } else {
        alert('لم يتم العثور على الفاتورة الأصلية');
        setFoundInvoice(null);
      }
    }
  };

  const handleEditReturn = (ret: any) => {
    const savedInvoices = localStorage.getItem('sheno_sales_invoices');
    if (savedInvoices) {
      const invoices: SalesInvoice[] = JSON.parse(savedInvoices);
      const original = invoices.find(inv => inv.invoiceNumber === ret.invoiceNumber);
      if (original) {
        setFoundInvoice(original);
        const mappedItems = original.items.map(origItem => {
          const prevRetItem = ret.items.find((ri: any) => ri.id === origItem.id || ri.name === origItem.name);
          return { ...origItem, quantity: prevRetItem ? prevRetItem.quantity : 0 };
        });
        setReturnItems(mappedItems);
        setAdjustedDiscount(ret.discountAmount || 0);
        setReturnMaterials(ret.materialsReturned || false);
        setEditingReturnId(ret.id);
        setInvoiceSearch(ret.invoiceNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const removeAssociatedMovements = (id: string) => {
    const stock = localStorage.getItem('sheno_stock_entries');
    if (stock) {
      const entries: StockEntry[] = JSON.parse(stock);
      localStorage.setItem('sheno_stock_entries', JSON.stringify(entries.filter(e => e.movementCode !== id)));
    }
    const cash = localStorage.getItem('sheno_cash_journal');
    if (cash) {
      const entries: CashEntry[] = JSON.parse(cash);
      localStorage.setItem('sheno_cash_journal', JSON.stringify(entries.filter(e => e.voucherNumber !== id)));
    }
  };

  const handleSaveReturn = () => {
    if (!foundInvoice) return;
    
    const totalReturnItemsAmountLocal = returnItems.reduce((s, i) => s + (i.quantity * i.price), 0);
    const returnId = editingReturnId || crypto.randomUUID();
    const returnDate = new Date().toISOString().split('T')[0];
    
    const returnEntry = {
      id: returnId,
      invoiceNumber: foundInvoice.invoiceNumber,
      customerName: foundInvoice.customerName,
      date: returnDate,
      items: returnItems.filter(i => i.quantity > 0),
      totalReturnAmount: totalReturnItemsAmountLocal,
      discountAmount: adjustedDiscount, // الحسم المعدل المستقل
      materialsReturned: returnMaterials,
      totalAmountLiteral: tafqeet(totalReturnItemsAmountLocal, settings?.currency || "ليرة سورية"),
      paymentType: foundInvoice.paymentType,
      cashAccount: foundInvoice.cashAccount
    };

    if (editingReturnId) removeAssociatedMovements(editingReturnId);

    const updatedHistory = editingReturnId 
      ? returnHistory.map(r => r.id === editingReturnId ? returnEntry : r)
      : [returnEntry, ...returnHistory];

    setReturnHistory(updatedHistory);
    localStorage.setItem('sheno_sales_returns', JSON.stringify(updatedHistory));

    // 1. تحديث حركات المستودع (الأصناف المباعة المرتجعة)
    const savedStock = localStorage.getItem('sheno_stock_entries');
    let currentStockEntries: StockEntry[] = savedStock ? JSON.parse(savedStock) : [];
    
    const itemReturnMovements: StockEntry[] = returnEntry.items.map(item => ({
      id: crypto.randomUUID(),
      date: returnDate,
      day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date()),
      department: 'مرتجع مبيعات',
      itemCode: item.code,
      itemName: item.name,
      unit: item.unit,
      price: item.price,
      warehouse: 'المستودع الرئيسي',
      movementType: 'مرتجع',
      quantity: item.quantity,
      invoiceNumber: foundInvoice.invoiceNumber,
      statement: `مرتجع مبيع فاتورة ${foundInvoice.invoiceNumber}`,
      movementCode: returnId
    }));

    // 2. تحديث حركات المستودع (إعادة مواد التصنيع بالوصف المطلوب)
    let materialReturnMovements: StockEntry[] = [];
    if (returnMaterials && foundInvoice.usedMaterials && foundInvoice.usedMaterials.length > 0) {
       materialReturnMovements = foundInvoice.usedMaterials.map(m => ({
          id: crypto.randomUUID(),
          date: returnDate,
          day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date()),
          department: 'مرتجع مواد تصنيع',
          itemCode: m.code,
          itemName: m.name,
          unit: m.unit || 'قطعة',
          price: 0,
          warehouse: 'المستودع الرئيسي',
          movementType: 'إدخال',
          quantity: m.quantity,
          invoiceNumber: foundInvoice.invoiceNumber,
          statement: `مرتجع مواد تصنيع مرتبط بفاتورة رقم (${foundInvoice.invoiceNumber})`,
          movementCode: returnId
       }));
    }

    localStorage.setItem('sheno_stock_entries', JSON.stringify([...itemReturnMovements, ...materialReturnMovements, ...currentStockEntries]));

    // 3. تحديث المالية (نقدي أو آجل)
    const savedCash = localStorage.getItem('sheno_cash_journal');
    let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
    
    if (foundInvoice.paymentType === 'نقداً') {
      const sourceName = foundInvoice.cashAccount === 'المصرف' ? 'حساب المصرف البنكي' : 'الصندوق الرئيسي';
      if (totalReturnItemsAmountLocal > 0) {
        cashEntries.unshift({
          id: crypto.randomUUID(),
          date: returnDate,
          statement: `رد نقدي لمرتجع مبيع فاتورة ${foundInvoice.invoiceNumber}`,
          receivedSYP: 0, paidSYP: totalReturnItemsAmountLocal, 
          receivedUSD: 0, paidUSD: 0,
          partyName: sourceName,
          notes: `للزبون: ${foundInvoice.customerName}`, 
          type: 'مرتجع', voucherNumber: returnId
        });
      }
    } else {
      // آجل: تسوية مديونية الزبون
      cashEntries.unshift({
        id: crypto.randomUUID(),
        date: returnDate,
        statement: `تسوية رصيد (مرتجع آجل) - فاتورة رقم ${foundInvoice.invoiceNumber}`,
        receivedSYP: 0, paidSYP: 0, 
        receivedUSD: 0, paidUSD: 0,
        partyName: foundInvoice.customerName,
        notes: 'تعديل آلي للذمة',
        type: 'مرتجع', voucherNumber: returnId
      });
    }
    
    // معالجة الحسم الممنوح المعدل (قيد تسوية للفرق)
    const discountDiff = adjustedDiscount - (foundInvoice.discountAmount || 0);
    if (discountDiff !== 0) {
       cashEntries.unshift({
          id: crypto.randomUUID(),
          date: returnDate,
          statement: `تعديل حسم ممنوح (مرتجع) للفاتورة رقم ${foundInvoice.invoiceNumber}`,
          receivedSYP: discountDiff < 0 ? Math.abs(discountDiff) : 0, 
          paidSYP: discountDiff > 0 ? discountDiff : 0,
          receivedUSD: 0, paidUSD: 0,
          partyName: foundInvoice.customerName,
          notes: 'تصحيح قيمة الحسم الممنوح بشكل مستقل',
          type: 'حسم', voucherNumber: returnId
       });
    }

    localStorage.setItem('sheno_cash_journal', JSON.stringify(cashEntries));
    
    alert('تم حفظ المرتجع وتصحيح المخزون والمالية بنجاح.');
    setFoundInvoice(null);
    setEditingReturnId(null);
    setInvoiceSearch('');
    if (initialReturn) onBack(); 
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-all"><ArrowRight className="w-6 h-6" /></button>
          <h2 className="text-2xl font-black text-readable">إدارة المرتجعات وتصحيح مواد التصنيع</h2>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row gap-6 no-print">
        <div className="flex flex-col gap-1 flex-1 max-w-sm">
          <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم الفاتورة الأصلية</label>
          <div className="flex gap-2">
            <input type="text" value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl flex-1 font-bold outline-none text-readable" placeholder="رقم الفاتورة..." />
            <button onClick={handleSearch} className="bg-primary text-white px-8 rounded-2xl font-black shadow-lg">بحث في السجلات</button>
          </div>
        </div>
        {foundInvoice && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border flex-1 flex flex-wrap justify-between gap-4 animate-in slide-in-from-left-2">
            <div><p className="text-[10px] text-zinc-400 font-black uppercase">العميل</p><p className="font-black text-lg">{foundInvoice.customerName}</p></div>
            <div>
              <p className="text-[10px] text-zinc-400 font-black uppercase">نوع الفاتورة</p>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${foundInvoice.paymentType === 'نقداً' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                {foundInvoice.paymentType} {foundInvoice.paymentType === 'نقداً' ? `(${foundInvoice.cashAccount})` : ''}
              </span>
            </div>
            <div>
               <p className="text-[10px] text-zinc-400 font-black uppercase">الحسم الحالي</p>
               <p className="font-mono font-black text-rose-600">{foundInvoice.discountAmount || 0}</p>
            </div>
          </div>
        )}
      </div>

      {foundInvoice && (
        <div className={`bg-white dark:bg-zinc-900 rounded-3xl border-2 ${editingReturnId ? 'border-amber-500' : 'border-rose-900'} overflow-hidden shadow-2xl animate-in zoom-in-95 no-print`}>
          <div className={`${editingReturnId ? 'bg-amber-600' : 'bg-rose-900'} p-4 text-white font-black flex justify-between items-center px-6`}>
             <span className="flex items-center gap-2"><RefreshCcw className="w-4 h-4"/> معالجة مرتجع الفاتورة #{foundInvoice.invoiceNumber}</span>
             <div className="flex items-center gap-4">
                {foundInvoice.usedMaterials && foundInvoice.usedMaterials.length > 0 && (
                  <button 
                    onClick={() => setReturnMaterials(!returnMaterials)}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-1 rounded-lg transition-all"
                  >
                    {returnMaterials ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    <span className="text-xs">إعادة المواد المستخدمة إلى المخزون</span>
                  </button>
                )}
             </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b dark:border-zinc-800">
             <div className="space-y-4">
                <h4 className="text-sm font-black text-zinc-500 flex items-center gap-2 uppercase tracking-widest border-b pb-2">تحديد الكميات المرتجعة للقطع</h4>
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-[10px] text-zinc-400 font-black uppercase"><th className="pb-2">المادة</th><th className="pb-2 text-center">المباع</th><th className="pb-2 text-center">المرتجع</th><th className="pb-2 text-center">السعر</th></tr>
                  </thead>
                  <tbody className="divide-y font-bold">
                    {returnItems.map(item => (
                      <tr key={item.id}>
                        <td className="py-3 text-xs">{item.name}</td>
                        <td className="py-3 text-center font-mono text-zinc-400">{foundInvoice.items.find(i=>i.id===item.id || i.name === item.name)?.quantity}</td>
                        <td className="py-3 text-center">
                          <input type="number" min={0} value={item.quantity} onChange={e => setReturnItems(returnItems.map(i => i.id === item.id ? { ...i, quantity: Number(e.target.value) } : i))} className="bg-zinc-50 dark:bg-zinc-800 border-2 w-20 p-1.5 rounded-lg text-rose-600 font-black text-center outline-none focus:border-rose-500" />
                        </td>
                        <td className="py-3 text-center font-mono text-xs">{item.price.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>

             <div className="bg-zinc-50 dark:bg-zinc-800/30 p-6 rounded-2xl border-2 border-dashed dark:border-zinc-700 space-y-6">
                <h4 className="text-sm font-black text-zinc-500 flex items-center gap-2 uppercase tracking-widest border-b pb-2">خيارات الحسم والتسوية</h4>
                
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-zinc-500 flex items-center gap-1"><Percent className="w-3 h-3"/> تعديل الحسم الممنوح (مستقل)</label>
                   <input 
                     type="number" 
                     className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 p-3 rounded-xl font-black text-rose-600 text-2xl outline-none focus:border-primary transition-all"
                     value={adjustedDiscount}
                     onChange={e => setAdjustedDiscount(Number(e.target.value))}
                   />
                   <p className="text-[10px] text-zinc-400 italic font-bold">صافي المبيعات = الإجمالي - المرتجع - الحسم الجديد</p>
                </div>

                {returnMaterials && foundInvoice.usedMaterials && (
                   <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 animate-in fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-black text-emerald-700">المواد الخام التي ستُعاد للرصيد:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {foundInvoice.usedMaterials.map((m, idx) => (
                           <span key={idx} className="bg-white dark:bg-zinc-800 px-2 py-1 rounded text-[9px] font-bold border dark:border-zinc-700">{m.name} ({m.quantity})</span>
                        ))}
                      </div>
                   </div>
                )}
             </div>
          </div>

          <div className="p-6 bg-zinc-900 text-white flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex gap-8">
                <div className="flex flex-col">
                   <span className="text-[10px] text-zinc-500 uppercase font-black">إجمالي قيمة المرتجع</span>
                   <span className="text-2xl font-mono font-black text-rose-500">{totalReturnItemsAmount.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] text-zinc-500 uppercase font-black">الحسم المعتمد للسند</span>
                   <span className="text-2xl font-mono font-black text-amber-500">{adjustedDiscount.toLocaleString()}</span>
                </div>
             </div>
             <div className="flex gap-3">
                <button onClick={handleSaveReturn} className="bg-primary hover:bg-primary/90 text-white px-12 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 transition-all active:scale-95 text-lg">
                   <Save className="w-6 h-6" /> ترحيل وتثبيت المرتجع
                </button>
                <button onClick={() => { setFoundInvoice(null); setEditingReturnId(null); }} className="bg-zinc-800 text-zinc-400 px-10 py-4 rounded-2xl font-bold hover:text-white transition-all">إلغاء</button>
             </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-black flex items-center gap-2"><RotateCcw className="w-5 h-5 text-rose-700" /> أرشيف عمليات المرتجع الموثقة</h3>
        <div className="bg-white dark:bg-zinc-950 rounded-3xl border overflow-hidden shadow-xl">
           <table className="w-full text-right text-sm">
              <thead className="bg-zinc-900 h-12 text-[10px] text-zinc-400 font-black uppercase">
                 <tr>
                    <th className="p-4 border-l border-zinc-800 text-center w-24">الفاتورة</th>
                    <th className="p-4 border-l border-zinc-800">الزبون</th>
                    <th className="p-4 border-l border-zinc-800 text-center">حالة المخزن</th>
                    <th className="p-4 border-l border-zinc-800 text-center">قيمة المرتجع</th>
                    <th className="p-4 border-l border-zinc-800 text-center">الحسم النهائي</th>
                    <th className="p-4 text-center w-24 no-print">إجراءات</th>
                 </tr>
              </thead>
              <tbody className="divide-y font-bold text-readable">
                {filteredHistory.map(ret => (
                   <tr key={ret.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors h-14">
                      <td className="p-4 font-black text-rose-700 text-center">#{ret.invoiceNumber}</td>
                      <td className="p-4">{ret.customerName}</td>
                      <td className="p-4 text-center">
                         {ret.materialsReturned ? (
                           <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black border border-emerald-500/20">تمت استعادة المواد</span>
                         ) : (
                           <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-[9px] font-black border dark:border-zinc-700">مرتجع مالي</span>
                         )}
                      </td>
                      <td className="p-4 text-center font-mono text-emerald-600 text-lg">{ret.totalReturnAmount.toLocaleString()}</td>
                      <td className="p-4 text-center font-mono text-rose-500">{ret.discountAmount?.toLocaleString() || 0}</td>
                      <td className="p-4 text-center no-print">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditReturn(ret)} className="p-2 text-zinc-400 hover:text-amber-500"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={() => handleDeleteReturn(ret.id)} className="p-2 text-zinc-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                   </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReturnView;
