
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Save, Trash2, Edit2, RotateCcw, Printer, FileDown, X, Calendar, Filter, RefreshCcw, Landmark, AlertCircle, CheckSquare, Square, Percent, List, Box, HardDrive } from 'lucide-react';
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
  const [isSaving, setIsSaving] = useState(false);
  
  // خيارات متقدمة لمرتجع مواد التصنيع والحسم
  const [returnMaterials, setReturnMaterials] = useState(false);
  const [returnMaterialsItems, setReturnMaterialsItems] = useState<any[]>([]);
  const [adjustedDiscount, setAdjustedDiscount] = useState(0);

  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  const getPrefix = () => {
    const activeId = localStorage.getItem('sheno_active_company_id') || 'default';
    return activeId === 'default' ? 'sheno' : `sheno_${activeId}`;
  };

  useEffect(() => {
    const prefix = getPrefix();
    const savedReturns = localStorage.getItem(`${prefix}_sales_returns`);
    const savedSettings = localStorage.getItem(`${prefix}_settings`);
    if (savedReturns) setReturnHistory(JSON.parse(savedReturns));
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    if (initialReturn && !editingReturnId) {
      handleEditReturn(initialReturn);
    }
  }, [initialReturn]);

  const totalReturnItemsAmount = returnItems.reduce((s, i) => s + (i.quantity * i.price), 0);

  const filteredHistory = returnHistory.filter(ret => {
    const matchSearch = ret.customerName.toLowerCase().includes(historySearchTerm.toLowerCase()) || 
                       ret.invoiceNumber.includes(historySearchTerm);
    const matchDate = (!historyStartDate || ret.date >= historyStartDate) && 
                     (!historyEndDate || ret.date <= historyEndDate);
    return matchSearch && matchDate;
  });

  const handleDeleteReturn = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف سجل المرتجع هذا نهائياً؟ سيتم إلغاء أثره المالي والمخزني.')) {
      const prefix = getPrefix();
      const updatedReturns = returnHistory.filter(r => r.id !== id);
      setReturnHistory(updatedReturns);
      localStorage.setItem(`${prefix}_sales_returns`, JSON.stringify(updatedReturns));
      removeAssociatedMovements(id);
    }
  };

  const handleSearch = () => {
    const prefix = getPrefix();
    const saved = localStorage.getItem(`${prefix}_sales_invoices`);
    if (saved) {
      const invoices: SalesInvoice[] = JSON.parse(saved);
      const match = invoices.find(inv => inv.invoiceNumber === invoiceSearch);
      if (match) {
        setFoundInvoice(match);
        setReturnItems(match.items.map(i => ({ ...i, quantity: 0 })));
        setAdjustedDiscount(match.discountAmount || 0);
        setReturnMaterials(false);
        setReturnMaterialsItems((match.usedMaterials || []).map(m => ({ ...m, returnQuantity: 0 })));
        setEditingReturnId(null);
      } else {
        alert('لم يتم العثور على الفاتورة الأصلية');
        setFoundInvoice(null);
      }
    }
  };

  const handleEditReturn = (ret: any) => {
    const prefix = getPrefix();
    const savedInvoices = localStorage.getItem(`${prefix}_sales_invoices`);
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
        
        // جلب كميات المواد المرجعة السابقة أو تصفيرها
        setReturnMaterialsItems((original.usedMaterials || []).map(m => {
          const prevMat = (ret.returnedMaterialsList || []).find((pm: any) => pm.code === m.code);
          return { ...m, returnQuantity: prevMat ? prevMat.quantity : 0 };
        }));

        setEditingReturnId(ret.id);
        setInvoiceSearch(ret.invoiceNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const removeAssociatedMovements = (id: string) => {
    const prefix = getPrefix();
    const stock = localStorage.getItem(`${prefix}_stock_entries`);
    if (stock) {
      const entries: StockEntry[] = JSON.parse(stock);
      localStorage.setItem(`${prefix}_stock_entries`, JSON.stringify(entries.filter(e => e.movementCode !== id)));
    }
    const cash = localStorage.getItem(`${prefix}_cash_journal`);
    if (cash) {
      const entries: CashEntry[] = JSON.parse(cash);
      localStorage.setItem(`${prefix}_cash_journal`, JSON.stringify(entries.filter(e => e.voucherNumber !== id)));
    }
  };

  const handleSaveReturn = () => {
    if (!foundInvoice || isSaving) return;
    setIsSaving(true);
    
    try {
      const totalReturnItemsAmountLocal = returnItems.reduce((s, i) => s + (i.quantity * i.price), 0);
      const returnId = editingReturnId || crypto.randomUUID();
      const returnDate = new Date().toISOString().split('T')[0];
      
      // قائمة المواد الخام المرتجعة فعلياً (بناءً على الكميات المحددة)
      const validReturnedMaterials = returnMaterialsItems.filter(m => m.returnQuantity > 0).map(m => ({
        code: m.code,
        name: m.name,
        quantity: m.returnQuantity,
        unit: m.unit
      }));

      const returnEntry = {
        id: returnId,
        invoiceNumber: foundInvoice.invoiceNumber,
        customerName: foundInvoice.customerName,
        date: returnDate,
        items: returnItems.filter(i => i.quantity > 0),
        totalReturnAmount: totalReturnItemsAmountLocal,
        discountAmount: adjustedDiscount,
        materialsReturned: returnMaterials,
        returnedMaterialsList: validReturnedMaterials, // حفظ القائمة الجديدة
        totalAmountLiteral: tafqeet(totalReturnItemsAmountLocal, settings?.currency || "ليرة سورية"),
        paymentType: foundInvoice.paymentType,
        cashAccount: foundInvoice.cashAccount
      };

      if (editingReturnId) removeAssociatedMovements(editingReturnId);

      const prefix = getPrefix();
      
      // Update History
      const savedReturns = localStorage.getItem(`${prefix}_sales_returns`);
      let currentReturns: any[] = savedReturns ? JSON.parse(savedReturns) : [];
      
      const updatedHistory = editingReturnId 
        ? currentReturns.map(r => r.id === editingReturnId ? returnEntry : r)
        : [returnEntry, ...currentReturns];

      setReturnHistory(updatedHistory);
      localStorage.setItem(`${prefix}_sales_returns`, JSON.stringify(updatedHistory));

      // 1. تحديث حركات المستودع (الأصناف المرتجعة)
      const savedStock = localStorage.getItem(`${prefix}_stock_entries`);
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

      // 2. تحديث حركات المستودع (المواد الخام بالكميات المحددة)
      let materialReturnMovements: StockEntry[] = [];
      if (returnMaterials) {
         materialReturnMovements = validReturnedMaterials.map(m => ({
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
            statement: `مرتجع مواد خام مرتبطة بفاتورة رقم (${foundInvoice.invoiceNumber})`,
            movementCode: returnId
         }));
      }

      localStorage.setItem(`${prefix}_stock_entries`, JSON.stringify([...itemReturnMovements, ...materialReturnMovements, ...currentStockEntries]));

      // 3. تحديث المالية
      const savedCash = localStorage.getItem(`${prefix}_cash_journal`);
      let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
      
      // قيد المرتجع لحساب مرتجع المبيعات (42) - مدين
      if (totalReturnItemsAmountLocal > 0) {
         cashEntries.unshift({
            id: crypto.randomUUID(),
            date: returnDate,
            statement: `مرتجع مبيعات فاتورة #${foundInvoice.invoiceNumber}`,
            receivedSYP: 0, 
            paidSYP: totalReturnItemsAmountLocal, 
            receivedUSD: 0, paidUSD: 0,
            notes: 'قيد آلي لمرتجع المبيعات',
            type: 'مرتجع', voucherNumber: returnId,
            linkedAccountCode: '42',
            linkedAccountId: '42'
         });
      }

      if (foundInvoice.paymentType === 'نقداً') {
        if (totalReturnItemsAmountLocal > 0) {
          cashEntries.unshift({
            id: crypto.randomUUID(),
            date: returnDate,
            statement: `رد نقدي لمرتجع مبيع فاتورة ${foundInvoice.invoiceNumber}`,
            receivedSYP: totalReturnItemsAmountLocal, paidSYP: 0, 
            receivedUSD: 0, paidUSD: 0,
            partyName: foundInvoice.customerName,
            notes: `للزبون: ${foundInvoice.customerName}`, 
            type: 'مرتجع', voucherNumber: returnId
          });
        }
      } else {
        // قيد العميل (دائن) لتخفيض الذمة
        cashEntries.unshift({
          id: crypto.randomUUID(),
          date: returnDate,
          statement: `تسوية رصيد (مرتجع آجل) - فاتورة رقم ${foundInvoice.invoiceNumber}`,
          receivedSYP: totalReturnItemsAmountLocal, paidSYP: 0, 
          receivedUSD: 0, paidUSD: 0,
          partyName: foundInvoice.customerName,
          notes: 'تعديل آلي للذمة',
          type: 'مرتجع', voucherNumber: returnId
        });
      }
      
      const discountDiff = adjustedDiscount - (foundInvoice.discountAmount || 0);
      if (discountDiff !== 0) {
         // تعديل قيود الحسم الأصلية بدلاً من إضافة قيود جديدة
         const isPrimary = settings?.currency === 'ليرة سورية';
         let discountUpdated = false;
         
         cashEntries = cashEntries.map(entry => {
            if (entry.voucherNumber === foundInvoice.invoiceNumber && entry.type === 'حسم') {
               discountUpdated = true;
               if (entry.linkedAccountCode === '43') {
                  return {
                     ...entry,
                     paidSYP: isPrimary ? adjustedDiscount : 0,
                     paidUSD: !isPrimary ? adjustedDiscount : 0
                  };
               } else if (entry.partyName === foundInvoice.customerName) {
                  return {
                     ...entry,
                     receivedSYP: isPrimary ? adjustedDiscount : 0,
                     receivedUSD: !isPrimary ? adjustedDiscount : 0
                  };
               }
            }
            return entry;
         });

         // إذا لم يكن هناك قيد حسم أصلي (كان الحسم 0 وأصبح له قيمة)، ننشئ قيود جديدة
         if (!discountUpdated && adjustedDiscount > 0) {
            cashEntries.unshift({
               id: crypto.randomUUID(),
               date: returnDate,
               statement: `حسم ممنوح فاتورة #${foundInvoice.invoiceNumber}`,
               receivedSYP: 0, 
               paidSYP: isPrimary ? adjustedDiscount : 0,
               receivedUSD: 0, paidUSD: !isPrimary ? adjustedDiscount : 0,
               type: 'حسم', voucherNumber: foundInvoice.invoiceNumber,
               linkedAccountCode: '43',
               linkedAccountId: '43'
            });

            cashEntries.unshift({
               id: crypto.randomUUID(),
               date: returnDate,
               statement: `حسم ممنوح فاتورة #${foundInvoice.invoiceNumber} (تخفيض رصيد)`,
               receivedSYP: isPrimary ? adjustedDiscount : 0, 
               paidSYP: 0,
               receivedUSD: !isPrimary ? adjustedDiscount : 0, paidUSD: 0,
               partyName: foundInvoice.customerName,
               type: 'حسم', voucherNumber: foundInvoice.invoiceNumber
            });
         }
      }

      // تحديث الفاتورة الأصلية (تعديل الحسم)
      const savedSales = localStorage.getItem(`${prefix}_sales_invoices`);
      if (savedSales) {
        const sales: SalesInvoice[] = JSON.parse(savedSales);
        const updatedSales = sales.map(s => s.invoiceNumber === foundInvoice.invoiceNumber ? { ...s, discountAmount: adjustedDiscount } : s);
        localStorage.setItem(`${prefix}_sales_invoices`, JSON.stringify(updatedSales));
      }

      localStorage.setItem(`${prefix}_cash_journal`, JSON.stringify(cashEntries));
      
      alert('تم حفظ المرتجع وتصحيح المخزون والمالية بنجاح.');
      setFoundInvoice(null);
      setEditingReturnId(null);
      setInvoiceSearch('');
      if (initialReturn) onBack(); 
    } catch (error) {
      console.error('Error saving return:', error);
      alert('حدث خطأ أثناء حفظ المرتجع.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all shadow-sm"><ArrowRight className="w-6 h-6" /></button>
          <div className="flex flex-col">
             <h2 className="text-2xl font-black text-readable">معالجة مرتجع المبيعات</h2>
             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Sales Return & Materials Recovery</p>
          </div>
        </div>
        <button 
           onClick={() => {
              const el = document.getElementById('history-section');
              if(el) el.scrollIntoView({ behavior: 'smooth' });
           }}
           className="bg-zinc-900 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-zinc-800 transition-all border border-zinc-800"
        >
           <List className="w-5 h-5 text-amber-500" /> عرض السجل الكامل
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row gap-6 no-print">
        <div className="flex flex-col gap-1 flex-1 max-w-sm">
          <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم الفاتورة الأصلية</label>
          <div className="flex gap-2">
            <input type="text" value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl flex-1 font-bold outline-none text-readable focus:border-primary" placeholder="رقم الفاتورة..." />
            <button onClick={handleSearch} className="bg-primary text-white px-8 rounded-2xl font-black shadow-lg hover:brightness-110 active:scale-95 transition-all">بحث</button>
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
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all border ${returnMaterials ? 'bg-emerald-500 border-emerald-400 shadow-inner' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                  >
                    {returnMaterials ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    <span className="text-xs">إعادة المواد المستخدمة للمخزون</span>
                  </button>
                )}
             </div>
          </div>

          <div className="p-6 space-y-8">
             <div className="space-y-4">
                <h4 className="text-sm font-black text-zinc-500 flex items-center gap-2 uppercase tracking-widest border-b pb-2">
                   <Box className="w-4 h-4 text-rose-600" /> الأصناف المباعة المرتجعة
                </h4>
                <div className="overflow-x-auto">
                   <table className="w-full text-right border-collapse">
                     <thead>
                       <tr className="text-[10px] text-zinc-400 font-black uppercase">
                          <th className="pb-3 pr-4">المادة / الصنف</th>
                          <th className="pb-3 text-center">الكمية المباعة</th>
                          <th className="pb-3 text-center text-rose-600">الكمية المرتجعة</th>
                          <th className="pb-3 text-center">سعر الوحدة</th>
                          <th className="pb-3 text-center">الإجمالي</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y font-bold">
                       {returnItems.map(item => (
                         <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                           <td className="py-4 pr-4 text-xs font-black">{item.name}</td>
                           <td className="py-4 text-center font-mono text-zinc-400">
                             {foundInvoice.items.find(i=>i.id===item.id || i.name === item.name)?.quantity}
                           </td>
                           <td className="py-4 text-center">
                             <input 
                                type="number" 
                                min={0} 
                                max={foundInvoice.items.find(i=>i.id===item.id || i.name === item.name)?.quantity || 9999}
                                value={item.quantity} 
                                onChange={e => setReturnItems(returnItems.map(i => i.id === item.id ? { ...i, quantity: Number(e.target.value) } : i))} 
                                className="bg-zinc-50 dark:bg-zinc-800 border-2 w-24 p-2 rounded-xl text-rose-600 font-black text-center outline-none focus:border-rose-500 transition-all shadow-inner" 
                             />
                           </td>
                           <td className="py-4 text-center font-mono text-zinc-500">{item.price.toLocaleString()}</td>
                           <td className="py-4 text-center font-mono text-emerald-600 text-lg">{(item.quantity * item.price).toLocaleString()}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {returnMaterials && foundInvoice.usedMaterials && foundInvoice.usedMaterials.length > 0 && (
                   <div className="bg-emerald-500/5 dark:bg-emerald-950/20 p-6 rounded-[2rem] border-2 border-dashed border-emerald-500/20 space-y-4 animate-in fade-in">
                      <h4 className="text-sm font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2 uppercase tracking-widest border-b border-emerald-500/10 pb-2">
                         <HardDrive className="w-4 h-4" /> تحديد كميات المواد الخام المعادة
                      </h4>
                      <div className="space-y-3">
                         {returnMaterialsItems.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border dark:border-zinc-800 shadow-sm">
                               <div className="flex flex-col">
                                  <span className="text-xs font-black text-readable">{m.name}</span>
                                  <span className="text-[9px] font-bold text-zinc-400">المصروف: {m.quantity} {m.unit}</span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <input 
                                     type="number" 
                                     min={0}
                                     max={m.quantity}
                                     className="w-20 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 p-1.5 rounded-lg font-black text-center text-emerald-600 outline-none focus:border-emerald-500"
                                     value={m.returnQuantity}
                                     onChange={e => {
                                        const newList = [...returnMaterialsItems];
                                        newList[idx].returnQuantity = Number(e.target.value);
                                        setReturnMaterialsItems(newList);
                                     }}
                                  />
                                  <span className="text-[10px] font-black text-zinc-400 uppercase">{m.unit}</span>
                               </div>
                            </div>
                         ))}
                      </div>
                      <p className="text-[9px] text-emerald-600 font-bold italic leading-relaxed">
                         * سيتم زيادة رصيد المستودع فقط بالكميات المحددة أعلاه.
                      </p>
                   </div>
                )}

                <div className={`bg-zinc-50 dark:bg-zinc-800/30 p-6 rounded-[2rem] border-2 border-dashed dark:border-zinc-700 space-y-6 flex flex-col justify-center ${(!returnMaterials || !foundInvoice.usedMaterials) ? 'lg:col-span-2' : ''}`}>
                   <h4 className="text-sm font-black text-zinc-500 flex items-center gap-2 uppercase tracking-widest border-b pb-2">خيارات الحسم والتسوية</h4>
                   
                   <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-zinc-500 flex items-center gap-1"><Percent className="w-3 h-3"/> تعديل الحسم الممنوح للفاتورة الأصلية</label>
                      <input 
                        type="number" 
                        className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 p-4 rounded-2xl font-black text-rose-600 text-3xl outline-none focus:border-primary transition-all shadow-inner"
                        value={adjustedDiscount}
                        onChange={e => setAdjustedDiscount(Number(e.target.value))}
                      />
                      <p className="text-[10px] text-zinc-400 italic font-bold">سيتم احتساب مديونية الزبون بعد طرح المرتجع والحسم الجديد.</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="p-8 bg-zinc-900 text-white flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex flex-wrap gap-10">
                <div className="flex flex-col">
                   <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">إجمالي قيمة المرتجع</span>
                   <span className="text-3xl font-mono font-black text-rose-500">{totalReturnItemsAmount.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">الحسم المعدل</span>
                   <span className="text-3xl font-mono font-black text-amber-500">{adjustedDiscount.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">المواد الخام المعادة</span>
                   <span className="text-3xl font-mono font-black text-emerald-500">
                      {returnMaterialsItems.filter(m=>m.returnQuantity > 0).length} <span className="text-xs">صنف</span>
                   </span>
                </div>
             </div>
             <div className="flex gap-3">
                <button 
                  onClick={handleSaveReturn} 
                  disabled={isSaving}
                  className={`bg-primary hover:bg-primary/90 text-white px-16 py-5 rounded-[2rem] font-black shadow-2xl shadow-primary/20 flex items-center gap-3 transition-all active:scale-95 text-xl ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                   {isSaving ? <RotateCcw className="w-7 h-7 animate-spin" /> : <Save className="w-7 h-7" />}
                   {isSaving ? 'جاري الحفظ...' : 'ترحيل وتثبيت المرتجع'}
                </button>
                <button onClick={() => { setFoundInvoice(null); setEditingReturnId(null); setInvoiceSearch(''); }} className="bg-zinc-800 text-zinc-400 px-12 py-5 rounded-[2rem] font-bold hover:text-white transition-all">إلغاء</button>
             </div>
          </div>
        </div>
      )}

      <div id="history-section" className="space-y-4 pt-6">
        <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-2">
           <h3 className="text-xl font-black flex items-center gap-2 text-readable"><RotateCcw className="w-6 h-6 text-rose-700" /> أرشيف عمليات المرتجع الموثقة</h3>
           <div className="flex items-center gap-4 no-print">
              <div className="relative">
                 <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                 <input 
                    type="text" 
                    placeholder="بحث في المرتجعات..." 
                    className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-2 pr-10 pl-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary w-64"
                    value={historySearchTerm}
                    onChange={e => setHistorySearchTerm(e.target.value)}
                 />
              </div>
           </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border dark:border-zinc-800 overflow-hidden shadow-xl">
           <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                 <thead className="bg-zinc-900 h-14 text-[10px] text-zinc-400 font-black uppercase tracking-widest border-b border-zinc-800">
                    <tr>
                       <th className="p-4 border-l border-zinc-800 text-center w-24">رقم الفاتورة</th>
                       <th className="p-4 border-l border-zinc-800">اسم الزبون</th>
                       <th className="p-4 border-l border-zinc-800 text-center">حالة المخزن</th>
                       <th className="p-4 border-l border-zinc-800 text-center">تاريخ المرتجع</th>
                       <th className="p-4 border-l border-zinc-800 text-center bg-zinc-800">قيمة المرتجع</th>
                       <th className="p-4 border-l border-zinc-800 text-center text-amber-500">الحسم الجديد</th>
                       <th className="p-4 text-center w-24 no-print">إجراءات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y font-bold text-readable dark:divide-zinc-900">
                   {filteredHistory.map(ret => (
                      <tr key={ret.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors h-14">
                         <td className="p-4 font-black text-rose-700 text-center">#{ret.invoiceNumber}</td>
                         <td className="p-4">{ret.customerName}</td>
                         <td className="p-4 text-center">
                            {ret.materialsReturned ? (
                              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black border border-emerald-500/20 flex items-center justify-center gap-1 w-fit mx-auto">
                                 <HardDrive className="w-3 h-3" /> تم استرداد مواد
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-[9px] font-black border dark:border-zinc-700 w-fit mx-auto block">مرتجع مالي فقط</span>
                            )}
                         </td>
                         <td className="p-4 text-center font-mono text-zinc-400 text-xs">{ret.date}</td>
                         <td className="p-4 text-center font-mono text-emerald-600 text-xl bg-zinc-50 dark:bg-zinc-900/40">{ret.totalReturnAmount.toLocaleString()}</td>
                         <td className="p-4 text-center font-mono text-rose-500">{ret.discountAmount?.toLocaleString() || 0}</td>
                         <td className="p-4 text-center no-print">
                           <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEditReturn(ret)} className="p-2 text-zinc-400 hover:text-amber-500 transition-colors bg-zinc-50 dark:bg-zinc-800 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                             <button onClick={() => handleDeleteReturn(ret.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-colors bg-zinc-50 dark:bg-zinc-800 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                           </div>
                         </td>
                      </tr>
                   ))}
                   {filteredHistory.length === 0 && (
                      <tr><td colSpan={7} className="p-20 text-center italic text-zinc-300 font-bold text-lg">لا توجد سجلات مرتجع تتوافق مع البحث</td></tr>
                   )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReturnView;