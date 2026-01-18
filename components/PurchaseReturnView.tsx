
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Save, Trash2, RotateCcw, Box, Hash, Edit2 } from 'lucide-react';
import { PurchaseInvoice, InvoiceItem, StockEntry, CashEntry } from '../types';

interface PurchaseReturnViewProps {
  onBack: () => void;
}

const PurchaseReturnView: React.FC<PurchaseReturnViewProps> = ({ onBack }) => {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [foundInvoice, setFoundInvoice] = useState<PurchaseInvoice | null>(null);
  const [returnItems, setReturnItems] = useState<InvoiceItem[]>([]);
  const [returnHistory, setReturnHistory] = useState<any[]>([]);
  const [editingReturnId, setEditingReturnId] = useState<string | null>(null);

  useEffect(() => {
    const savedReturns = localStorage.getItem('sheno_purchase_returns');
    if (savedReturns) setReturnHistory(JSON.parse(savedReturns));
  }, []);

  const handleSearch = () => {
    const saved = localStorage.getItem('sheno_purchases');
    if (saved) {
      const purchases: PurchaseInvoice[] = JSON.parse(saved);
      const match = purchases.find(inv => inv.invoiceNumber === invoiceSearch);
      if (match) {
        setFoundInvoice(match);
        setReturnItems(match.items.map(i => ({ ...i, quantity: 0 })));
        setEditingReturnId(null);
      } else {
        alert('لم يتم العثور على فاتورة التوريد بهذا الرقم.');
      }
    }
  };

  const handleReturnQtyChange = (itemId: string, qty: number) => {
    setReturnItems(returnItems.map(i => i.id === itemId ? { ...i, quantity: qty, total: qty * i.price } : i));
  };

  const handleEditReturn = (ret: any) => {
    const savedPurchases = localStorage.getItem('sheno_purchases');
    if (savedPurchases) {
      const purchases: PurchaseInvoice[] = JSON.parse(savedPurchases);
      const original = purchases.find(inv => inv.invoiceNumber === ret.invoiceNumber);
      if (original) {
        setFoundInvoice(original);
        const mappedItems = original.items.map(origItem => {
          const prevRetItem = ret.items.find((ri: any) => ri.id === origItem.id);
          return { ...origItem, quantity: prevRetItem ? prevRetItem.quantity : 0 };
        });
        setReturnItems(mappedItems);
        setEditingReturnId(ret.id);
        setInvoiceSearch(ret.invoiceNumber);
      }
    }
  };

  const removeAssociatedMovements = (invNum: string) => {
    const stock = localStorage.getItem('sheno_stock_entries');
    if (stock) {
      const entries: StockEntry[] = JSON.parse(stock);
      const filtered = entries.filter(e => !(e.invoiceNumber === invNum && e.department === 'مرتجع مشتريات'));
      localStorage.setItem('sheno_stock_entries', JSON.stringify(filtered));
    }
    const cash = localStorage.getItem('sheno_cash_journal');
    if (cash) {
      const entries: CashEntry[] = JSON.parse(cash);
      const filtered = entries.filter(e => !(e.statement.includes(invNum) && e.type === 'مرتجع'));
      localStorage.setItem('sheno_cash_journal', JSON.stringify(filtered));
    }
  };

  const handleSaveReturn = () => {
    if (!foundInvoice || returnItems.every(i => i.quantity <= 0)) return;
    
    const totalReturnAmount = returnItems.reduce((s, i) => s + (i.quantity * i.price), 0);
    const returnDate = new Date().toISOString().split('T')[0];
    
    const returnEntry = {
      id: editingReturnId || crypto.randomUUID(),
      invoiceNumber: foundInvoice.invoiceNumber,
      supplierName: foundInvoice.supplierName,
      date: returnDate,
      items: returnItems.filter(i => i.quantity > 0),
      totalReturnAmount
    };

    let updatedHistory;
    if (editingReturnId) {
      updatedHistory = returnHistory.map(r => r.id === editingReturnId ? returnEntry : r);
      removeAssociatedMovements(foundInvoice.invoiceNumber);
    } else {
      updatedHistory = [returnEntry, ...returnHistory];
    }
    setReturnHistory(updatedHistory);
    localStorage.setItem('sheno_purchase_returns', JSON.stringify(updatedHistory));

    const savedStock = localStorage.getItem('sheno_stock_entries');
    let stockEntries: StockEntry[] = savedStock ? JSON.parse(savedStock) : [];
    const stockMoves: StockEntry[] = returnEntry.items.map(item => ({
      id: crypto.randomUUID(),
      date: returnEntry.date,
      day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date(returnEntry.date)),
      department: 'مرتجع مشتريات',
      itemCode: item.code,
      itemName: item.name,
      unit: item.unit,
      price: item.price,
      warehouse: 'المستودع الرئيسي',
      movementType: 'صرف',
      quantity: item.quantity,
      invoiceNumber: foundInvoice.invoiceNumber,
      statement: `مرتجع مشتريات للمورد: ${foundInvoice.supplierName}`
    }));
    localStorage.setItem('sheno_stock_entries', JSON.stringify([...stockMoves, ...stockEntries]));

    const savedCash = localStorage.getItem('sheno_cash_journal');
    let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
    const cashMove: CashEntry = {
      id: crypto.randomUUID(),
      date: returnEntry.date,
      statement: `استرداد مالي لمرتجع شراء فاتورة ${foundInvoice.invoiceNumber} - المورد: ${foundInvoice.supplierName}`,
      receivedSYP: totalReturnAmount,
      paidSYP: 0,
      receivedUSD: 0,
      paidUSD: 0,
      notes: 'مرتجع مشتريات',
      type: 'مرتجع'
    };
    localStorage.setItem('sheno_cash_journal', JSON.stringify([cashMove, ...cashEntries]));
    
    alert(editingReturnId ? 'تم تحديث مرتجع الشراء بنجاح' : 'تم حفظ مرتجع المشتريات وتحديث السجلات');
    setFoundInvoice(null);
    setInvoiceSearch('');
    setEditingReturnId(null);
  };

  const handleDeleteReturn = (id: string, invNum: string) => {
    if (window.confirm('هل أنت متأكد من حذف مرتجع المشتريات هذا؟')) {
      const updated = returnHistory.filter(r => r.id !== id);
      setReturnHistory(updated);
      localStorage.setItem('sheno_purchase_returns', JSON.stringify(updated));
      removeAssociatedMovements(invNum);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl">
          <ArrowRight className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-black text-readable">مرتجع المشتريات (للموردين)</h2>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 shadow-xl">
        <div className="flex flex-col gap-1 flex-1 max-w-sm">
           <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم فاتورة المورد الأصلية</label>
           <div className="flex gap-2">
             <input type="text" value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl flex-1 font-bold outline-none" placeholder="ادخل الرقم..." />
             <button onClick={handleSearch} className="bg-primary text-white px-8 rounded-2xl font-black hover:brightness-110">بحث</button>
           </div>
        </div>
        {foundInvoice && (
          <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700 flex justify-between items-center">
             <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 font-black uppercase">المورد</span>
                <span className="font-black text-lg text-readable">{foundInvoice.supplierName}</span>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-[10px] text-zinc-400 font-black uppercase">تاريخ التوريد</span>
                <span className="font-mono font-bold">{foundInvoice.date}</span>
             </div>
          </div>
        )}
      </div>

      {foundInvoice && (
        <div className={`bg-white dark:bg-zinc-900 rounded-3xl border-2 ${editingReturnId ? 'border-amber-500' : 'border-rose-900/30'} shadow-2xl overflow-hidden animate-in zoom-in-95`}>
           <div className={`${editingReturnId ? 'bg-amber-600' : 'bg-rose-900'} p-3 text-white font-black text-center text-sm uppercase tracking-widest flex justify-between px-6`}>
              <span>تحديد الكميات المرجعة للمورد</span>
              <span className="opacity-75">رقم التوريد: #{foundInvoice.invoiceNumber}</span>
           </div>
           <table className="w-full text-right border-collapse">
              <thead>
                 <tr className="bg-zinc-50 dark:bg-zinc-800 h-10 text-[10px] text-zinc-500 font-black uppercase">
                    <th className="p-3">المادة</th>
                    <th className="p-3 text-center">الكمية المستلمة</th>
                    <th className="p-3 text-center text-rose-500">الكمية المرتجعة</th>
                    <th className="p-3 text-center">السعر</th>
                    <th className="p-3 text-center">القيمة المستردة</th>
                 </tr>
              </thead>
              <tbody className="font-bold divide-y divide-zinc-100 dark:divide-zinc-800">
                 {returnItems.map(item => {
                    const original = foundInvoice.items.find(i => i.id === item.id);
                    return (
                       <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                          <td className="p-3">{item.name}</td>
                          <td className="p-3 text-center font-mono text-zinc-400">{original?.quantity}</td>
                          <td className="p-3 text-center">
                             <input 
                               type="number" 
                               max={original?.quantity} 
                               min={0}
                               value={item.quantity} 
                               onChange={e => handleReturnQtyChange(item.id, Number(e.target.value))} 
                               className="w-24 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-center rounded-xl p-2 font-black text-rose-600 outline-none focus:border-rose-500" 
                             />
                          </td>
                          <td className="p-3 text-center font-mono">{item.price.toLocaleString()}</td>
                          <td className="p-3 text-center font-mono font-black text-emerald-600">{(item.quantity * item.price).toLocaleString()}</td>
                       </tr>
                    )
                 })}
              </tbody>
           </table>
           <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <div className="flex flex-col">
                 <span className="text-[10px] text-zinc-400 font-black uppercase">إجمالي القيمة المستردة للصندوق</span>
                 <div className="text-2xl font-black text-emerald-600 font-mono">{ returnItems.reduce((s,i) => s + (i.quantity * i.price), 0).toLocaleString() }</div>
              </div>
              <div className="flex gap-3">
                 <button onClick={handleSaveReturn} className="bg-primary text-white px-10 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 flex items-center gap-2">
                    <Save className="w-5 h-5"/> {editingReturnId ? 'تحديث المرتجع' : 'تثبيت المرتجع'}
                 </button>
                 <button onClick={() => { setFoundInvoice(null); setEditingReturnId(null); }} className="bg-zinc-200 dark:bg-zinc-800 px-8 py-3 rounded-2xl font-bold">إلغاء</button>
              </div>
           </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-black text-readable flex items-center gap-2 px-1">
           <RotateCcw className="w-5 h-5 text-amber-500" /> سجل مرتجعات المشتريات
        </h3>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
           <table className="w-full text-right text-sm">
              <thead>
                 <tr className="bg-zinc-50 dark:bg-zinc-800 h-10 text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                    <th className="p-4">التاريخ</th>
                    <th className="p-4">رقم الفاتورة</th>
                    <th className="p-4">المورد</th>
                    <th className="p-4 text-center">القيمة المستردة</th>
                    <th className="p-4 text-center">إجراءات</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-bold">
                 {returnHistory.length === 0 ? (
                    <tr><td colSpan={5} className="p-16 text-center text-zinc-400 italic font-bold">لا توجد سجلات مرتجعة حالياً.</td></tr>
                 ) : (
                    returnHistory.map(ret => (
                       <tr key={ret.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                          <td className="p-4 font-mono text-zinc-400">{ret.date}</td>
                          <td className="p-4 font-black text-amber-600">#{ret.invoiceNumber}</td>
                          <td className="p-4">{ret.supplierName}</td>
                          <td className="p-4 text-center font-mono font-black text-emerald-600">{ret.totalReturnAmount.toLocaleString()}</td>
                          <td className="p-4 text-center">
                             <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditReturn(ret)} className="p-2 text-zinc-400 hover:text-amber-500 transition-all"><Edit2 className="w-4 h-4"/></button>
                                <button onClick={() => handleDeleteReturn(ret.id, ret.invoiceNumber)} className="p-2 text-zinc-400 hover:text-rose-600 transition-all"><Trash2 className="w-4 h-4"/></button>
                             </div>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReturnView;
