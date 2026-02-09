import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Save, Trash2, Edit2, RotateCcw, Printer, FileDown, X, Calendar, Filter, RefreshCcw, Landmark } from 'lucide-react';
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

  // States for History Filtering
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

  const handleSearch = () => {
    const saved = localStorage.getItem('sheno_sales_invoices');
    if (saved) {
      const invoices: SalesInvoice[] = JSON.parse(saved);
      const match = invoices.find(inv => inv.invoiceNumber === invoiceSearch);
      if (match) {
        setFoundInvoice(match);
        setReturnItems(match.items.map(i => ({ ...i, quantity: 0 })));
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
    if (!foundInvoice || returnItems.every(i => i.quantity <= 0)) return;
    
    const totalReturnAmount = returnItems.reduce((s, i) => s + (i.quantity * i.price), 0);
    const returnId = editingReturnId || crypto.randomUUID();
    const returnDate = new Date().toISOString().split('T')[0];
    
    // القاعدة المحاسبية: صرف نقدي فقط إذا كانت الفاتورة نقداً
    const isCashSale = foundInvoice.paymentType === 'نقداً';
    const cashAccount = foundInvoice.cashAccount || 'الصندوق';

    const returnEntry = {
      id: returnId,
      invoiceNumber: foundInvoice.invoiceNumber,
      customerName: foundInvoice.customerName,
      date: returnDate,
      items: returnItems.filter(i => i.quantity > 0),
      totalReturnAmount: totalReturnAmount,
      totalAmountLiteral: tafqeet(totalReturnAmount, settings?.currency || "ليرة سورية"),
      notes: editingReturnId ? 'تعديل مرتجع مبيعات' : 'مرتجع مبيعات',
      paymentType: foundInvoice.paymentType,
      cashAccount: foundInvoice.cashAccount
    };

    if (editingReturnId) removeAssociatedMovements(editingReturnId);

    const updatedHistory = editingReturnId 
      ? returnHistory.map(r => r.id === editingReturnId ? returnEntry : r)
      : [returnEntry, ...returnHistory];

    setReturnHistory(updatedHistory);
    localStorage.setItem('sheno_sales_returns', JSON.stringify(updatedHistory));

    // 1. تحديث حركات المستودع
    const savedStock = localStorage.getItem('sheno_stock_entries');
    let stockEntries: StockEntry[] = savedStock ? JSON.parse(savedStock) : [];
    const returnMovements: StockEntry[] = returnEntry.items.map(item => ({
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
      statement: `مرتجع مبيعات فاتورة ${foundInvoice.invoiceNumber}`,
      movementCode: returnId
    }));
    localStorage.setItem('sheno_stock_entries', JSON.stringify([...returnMovements, ...stockEntries]));

    // 2. تحديث الحسابات المالية (فصل النقدي عن الآجل)
    const savedCash = localStorage.getItem('sheno_cash_journal');
    let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
    
    if (isCashSale) {
      // رد نقدي حقيقي
      const sourceName = cashAccount === 'المصرف' ? 'حساب المصرف البنكي' : 'الصندوق الرئيسي';
      cashEntries.unshift({
        id: crypto.randomUUID(),
        date: returnDate,
        statement: `استرداد نقدي لمرتجع مبيع فاتورة ${foundInvoice.invoiceNumber} - المصدر: ${cashAccount}`,
        receivedSYP: 0, 
        paidSYP: totalReturnAmount, 
        receivedUSD: 0, 
        paidUSD: 0,
        partyName: sourceName,
        notes: `استرجاع نقدية للزبون: ${foundInvoice.customerName}`, 
        type: 'مرتجع', 
        voucherNumber: returnId
      });
    } else {
      // تصحيح رصيد آجل فقط (لا حركة نقدية في الصندوق)
      cashEntries.unshift({
        id: crypto.randomUUID(),
        date: returnDate,
        statement: `مرتجع مبيعات آجل (إشعار دائن) - فاتورة رقم ${foundInvoice.invoiceNumber}`,
        receivedSYP: 0, 
        paidSYP: 0, // 0 لعدم التأثير على رصيد الصندوق
        receivedUSD: 0, 
        paidUSD: 0,
        partyName: foundInvoice.customerName, // ربط الحركة بالزبون لتظهر في كشف حسابه
        notes: 'تسوية رصيد الزبون آلياً',
        type: 'مرتجع',
        voucherNumber: returnId
      });
    }
    
    localStorage.setItem('sheno_cash_journal', JSON.stringify(cashEntries));
    
    alert('تم حفظ المرتجع وتحديث الأرصدة (الذمم/النقدية) وفق النظام المحاسبي.');
    setFoundInvoice(null);
    setEditingReturnId(null);
    setInvoiceSearch('');
    if (initialReturn) onBack(); 
  };

  const handleDeleteReturn = (id: string) => {
    if (window.confirm('حذف المرتجع نهائياً وإلغاء أثره؟')) {
      const updated = returnHistory.filter(r => r.id !== id);
      setReturnHistory(updated);
      localStorage.setItem('sheno_sales_returns', JSON.stringify(updated));
      removeAssociatedMovements(id);
    }
  };

  const handleCancel = () => {
    setFoundInvoice(null);
    setEditingReturnId(null);
    setInvoiceSearch('');
    if (initialReturn) onBack();
  };

  const handleResetHistoryFilters = () => {
    setHistorySearchTerm('');
    setHistoryStartDate('');
    setHistoryEndDate('');
  };

  const filteredHistory = returnHistory.filter(ret => {
    const matchSearch = (ret.customerName || '').toLowerCase().includes(historySearchTerm.toLowerCase()) || 
                       (ret.invoiceNumber || '').includes(historySearchTerm);
    const matchDate = (!historyStartDate || ret.date >= historyStartDate) && 
                     (!historyEndDate || ret.date <= historyEndDate);
    return matchSearch && matchDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-all"><ArrowRight className="w-6 h-6" /></button>
          <h2 className="text-2xl font-black text-readable">إدارة مرتجعات المبيعات</h2>
        </div>
        <div className="flex gap-2">
           <button onClick={() => exportToCSV(filteredHistory, 'returns_report')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2">
              <FileDown className="w-5 h-5" /> تصدير XLSX
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border shadow-xl flex items-center gap-4 no-print">
        <div className="flex flex-col gap-1 flex-1 max-w-sm">
          <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">البحث برقم الفاتورة الأصلية (للمرتجع الجديد)</label>
          <div className="flex gap-2">
            <input type="text" value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl flex-1 font-bold outline-none text-readable" placeholder="رقم الفاتورة..." />
            <button onClick={handleSearch} className="bg-primary text-white px-8 rounded-2xl font-black shadow-lg hover:brightness-110">بحث</button>
          </div>
        </div>
        {foundInvoice && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border flex-1 flex justify-between animate-in slide-in-from-left-2">
            <div><p className="text-[10px] text-zinc-400 font-black uppercase">العميل</p><p className="font-black text-lg">{foundInvoice.customerName}</p></div>
            <div>
              <p className="text-[10px] text-zinc-400 font-black uppercase">حالة الدفع للأصل</p>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${foundInvoice.paymentType === 'نقداً' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                {foundInvoice.paymentType} {foundInvoice.paymentType === 'نقداً' ? `(${foundInvoice.cashAccount})` : ''}
              </span>
            </div>
            <div><p className="text-[10px] text-zinc-400 font-black uppercase">تاريخ الفاتورة</p><p className="font-mono font-bold">{foundInvoice.date}</p></div>
          </div>
        )}
      </div>

      {foundInvoice && (
        <div className={`bg-white dark:bg-zinc-900 rounded-3xl border-2 ${editingReturnId ? 'border-amber-500' : 'border-rose-900'} overflow-hidden shadow-2xl animate-in zoom-in-95 no-print`}>
          <div className={`${editingReturnId ? 'bg-amber-600' : 'bg-rose-900'} p-4 text-white font-black flex justify-between items-center px-6`}>
             <span className="flex items-center gap-2"><RefreshCcw className="w-4 h-4"/> {editingReturnId ? 'تعديل كميات المرتجع' : 'تحديد كميات المرتجع'}</span>
             <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-mono">Invoice #{foundInvoice.invoiceNumber}</span>
          </div>
          <table className="w-full text-right">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-[10px] text-zinc-500 font-black uppercase">
              <tr><th className="p-4">المادة</th><th className="p-4 text-center">المباع</th><th className="p-4 text-center text-rose-500">المرتجع</th><th className="p-4 text-center">السعر</th><th className="p-4 text-center bg-rose-500/5">المجموع</th></tr>
            </thead>
            <tbody className="divide-y font-bold text-readable">
              {returnItems.map(item => (
                <tr key={item.id}>
                  <td className="p-4">{item.name}</td>
                  <td className="p-4 text-center font-mono text-zinc-400">{foundInvoice.items.find(i=>i.id===item.id || i.name === item.name)?.quantity}</td>
                  <td className="p-4 text-center">
                    <input type="number" min={0} value={item.quantity} onChange={e => setReturnItems(returnItems.map(i => i.id === item.id ? { ...i, quantity: Number(e.target.value) } : i))} className="bg-zinc-50 dark:bg-zinc-800 border-2 w-24 p-2 rounded-xl text-rose-600 font-black text-center outline-none focus:border-rose-500" />
                  </td>
                  <td className="p-4 text-center font-mono text-zinc-500">{item.price.toLocaleString()}</td>
                  <td className="p-4 text-center font-mono font-black text-rose-600 bg-rose-500/5">{(item.quantity * item.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-4 border-t dark:border-zinc-800">
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
               <AlertCircle className="w-5 h-5 text-amber-500" />
               <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                 سيتم التسوية على: <span className="text-rose-700 dark:text-rose-400 font-black">{foundInvoice.paymentType === 'نقداً' ? `رد نقدية من ${foundInvoice.cashAccount}` : 'خصم من رصيد الزبون (آجل)'}</span>
               </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSaveReturn} className="bg-primary text-white px-12 py-3.5 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:scale-105 transition-all"><Save className="w-5 h-5"/> {editingReturnId ? 'تعديل وحفظ' : 'تثبيت المرتجع'}</button>
              <button onClick={handleCancel} className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-10 py-3.5 rounded-2xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* History Filter Bar */}
      <div className="bg-zinc-900/95 p-6 rounded-[2rem] border border-zinc-800 shadow-2xl space-y-4 no-print">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] flex flex-col gap-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">بحث في السجل (عميل أو فاتورة)</label>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="ابحث في سجل المرتجعات..." 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pr-12 outline-none font-bold text-white focus:border-rose-900 transition-all shadow-inner" 
                value={historySearchTerm} 
                onChange={e => setHistorySearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950 px-6 py-2.5 rounded-2xl border border-zinc-800 h-[54px] shadow-inner">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <div className="flex items-center gap-3">
              <input type="date" value={historyStartDate} onChange={e => setHistoryStartDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-white focus:text-primary transition-colors" />
              <span className="text-zinc-700 font-black">←</span>
              <input type="date" value={historyEndDate} onChange={e => setHistoryEndDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-white focus:text-primary transition-colors" />
            </div>
          </div>

          <button 
            onClick={handleResetHistoryFilters}
            className="bg-primary text-white h-[54px] px-8 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all"
          >
             <RefreshCcw className="w-5 h-5" /> إظهار الكل
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
         <table className="w-full text-right border-collapse text-[11px]">
            <thead>
               <tr className="bg-zinc-900 text-white font-black uppercase border-b border-zinc-700 h-14">
                  <th className="p-4 border-l border-zinc-800 text-center w-20">رقم الفاتورة</th>
                  <th className="p-4 border-l border-zinc-800 text-center w-32">تاريخ المرتجع</th>
                  <th className="p-4 border-l border-zinc-800">العميل</th>
                  <th className="p-4 border-l border-zinc-800">الأصناف المرتجعة</th>
                  <th className="p-4 border-l border-zinc-800 text-center w-32">إجمالي المرتجع</th>
                  <th className="p-4 text-center w-32 no-print">إجراءات</th>
               </tr>
            </thead>
            <tbody className="divide-y font-bold text-readable">
               {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center italic text-zinc-400 font-black text-lg">لا يوجد سجلات مرتجعات مطابقة للفلاتر</td>
                  </tr>
               ) : (
                  filteredHistory.map(ret => (
                    <tr key={ret.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group h-14">
                       <td className="p-4 border-l border-zinc-100 dark:border-zinc-800 text-center text-rose-600 font-black">#{ret.invoiceNumber}</td>
                       <td className="p-4 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-500">{ret.date}</td>
                       <td className="p-4 border-l border-zinc-100 dark:border-zinc-800 text-readable">
                          <div className="flex flex-col">
                            <span>{ret.customerName}</span>
                            <span className="text-[8px] text-zinc-400 uppercase">{ret.paymentType} {ret.paymentType === 'نقداً' ? `(${ret.cashAccount})` : ''}</span>
                          </div>
                       </td>
                       <td className="p-4 border-l border-zinc-100 dark:border-zinc-800">
                          <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                             {ret.items.map((it:any, i:number) => (
                                <span key={i} className="bg-rose-900/10 text-rose-700 px-2 py-0.5 rounded text-[9px] border border-rose-200">{it.name} ({it.quantity})</span>
                             ))}
                          </div>
                       </td>
                       <td className="p-4 border-l border-zinc-100 dark:border-zinc-800 text-center font-black text-rose-600 font-mono text-sm">{ret.totalReturnAmount.toLocaleString()}</td>
                       <td className="p-4 text-center no-print">
                          <div className="flex justify-center gap-1 opacity-40 group-hover:opacity-100 transition-all">
                             <button onClick={() => handleEditReturn(ret)} className="p-2 text-zinc-400 hover:text-amber-500 transition-colors"><Edit2 className="w-4 h-4"/></button>
                             <button onClick={() => handleDeleteReturn(ret.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                       </td>
                    </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

export default SalesReturnView;