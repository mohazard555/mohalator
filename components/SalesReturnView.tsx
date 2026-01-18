
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Save, X, Printer, Trash2, Edit2, RotateCcw } from 'lucide-react';
import { SalesInvoice, InvoiceItem, StockEntry, CashEntry } from '../types';

interface SalesReturnViewProps {
  onBack: () => void;
}

const SalesReturnView: React.FC<SalesReturnViewProps> = ({ onBack }) => {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [foundInvoice, setFoundInvoice] = useState<SalesInvoice | null>(null);
  const [returnItems, setReturnItems] = useState<InvoiceItem[]>([]);
  const [returnHistory, setReturnHistory] = useState<any[]>([]);
  const [editingReturnId, setEditingReturnId] = useState<string | null>(null);

  useEffect(() => {
    const savedReturns = localStorage.getItem('sheno_sales_returns');
    if (savedReturns) setReturnHistory(JSON.parse(savedReturns));
  }, []);

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
        alert('لم يتم العثور على الفاتورة');
        setFoundInvoice(null);
      }
    }
  };

  const handleReturnQtyChange = (itemId: string, qty: number) => {
    setReturnItems(returnItems.map(i => i.id === itemId ? { ...i, quantity: qty, total: qty * i.price } : i));
  };

  const handleEditReturn = (ret: any) => {
    const savedInvoices = localStorage.getItem('sheno_sales_invoices');
    if (savedInvoices) {
      const invoices: SalesInvoice[] = JSON.parse(savedInvoices);
      const original = invoices.find(inv => inv.invoiceNumber === ret.invoiceNumber);
      if (original) {
        setFoundInvoice(original);
        // Map original items, but set the quantity to what was previously returned
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

  const handleSaveReturn = () => {
    if (!foundInvoice || returnItems.every(i => i.quantity <= 0)) return;
    
    const totalReturnAmount = returnItems.reduce((s, i) => s + (i.quantity * i.price), 0);
    const returnDate = new Date().toISOString().split('T')[0];
    
    const returnEntry = {
      id: editingReturnId || crypto.randomUUID(),
      originalInvoiceId: foundInvoice.id,
      invoiceNumber: foundInvoice.invoiceNumber,
      customerName: foundInvoice.customerName,
      date: returnDate,
      items: returnItems.filter(i => i.quantity > 0),
      totalReturnAmount: totalReturnAmount
    };

    // 1. Update History
    let updatedHistory;
    if (editingReturnId) {
      updatedHistory = returnHistory.map(r => r.id === editingReturnId ? returnEntry : r);
      // Clean up old associated movements if editing
      removeAssociatedMovements(foundInvoice.invoiceNumber);
    } else {
      updatedHistory = [returnEntry, ...returnHistory];
    }
    setReturnHistory(updatedHistory);
    localStorage.setItem('sheno_sales_returns', JSON.stringify(updatedHistory));

    // 2. Add/Re-add Stock Movements
    const savedStock = localStorage.getItem('sheno_stock_entries');
    let stockEntries: StockEntry[] = savedStock ? JSON.parse(savedStock) : [];
    
    const returnMovements: StockEntry[] = returnEntry.items.map(item => ({
      id: crypto.randomUUID(),
      date: returnEntry.date,
      day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date(returnEntry.date)),
      department: 'مرتجعات مبيعات',
      itemCode: item.code,
      itemName: item.name,
      unit: item.unit,
      price: item.price,
      warehouse: 'المستودع الرئيسي',
      movementType: 'مرتجع',
      quantity: item.quantity,
      invoiceNumber: foundInvoice.invoiceNumber,
      statement: `مرتجع مبيعات فاتورة ${foundInvoice.invoiceNumber} - العميل ${foundInvoice.customerName}`
    }));
    localStorage.setItem('sheno_stock_entries', JSON.stringify([...returnMovements, ...stockEntries]));

    // 3. Update Cash (if money was returned)
    const savedCash = localStorage.getItem('sheno_cash_journal');
    let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
    const cashMove: CashEntry = {
      id: crypto.randomUUID(),
      date: returnEntry.date,
      statement: `استرداد مالي لمرتجع مبيع فاتورة ${foundInvoice.invoiceNumber} - العميل: ${foundInvoice.customerName}`,
      receivedSYP: 0,
      paidSYP: totalReturnAmount,
      receivedUSD: 0,
      paidUSD: 0,
      notes: 'مرتجع مبيعات',
      type: 'مرتجع'
    };
    localStorage.setItem('sheno_cash_journal', JSON.stringify([cashMove, ...cashEntries]));
    
    alert(editingReturnId ? 'تم تحديث المرتجع وتعديل السجلات بنجاح' : 'تم حفظ المرتجع وتحديث المستودع');
    setFoundInvoice(null);
    setInvoiceSearch('');
    setEditingReturnId(null);
  };

  const removeAssociatedMovements = (invNum: string) => {
    // Remove old stock entries for this return
    const stock = localStorage.getItem('sheno_stock_entries');
    if (stock) {
      const entries: StockEntry[] = JSON.parse(stock);
      const filtered = entries.filter(e => !(e.invoiceNumber === invNum && e.department === 'مرتجعات مبيعات'));
      localStorage.setItem('sheno_stock_entries', JSON.stringify(filtered));
    }
    // Remove old cash journal entries for this return
    const cash = localStorage.getItem('sheno_cash_journal');
    if (cash) {
      const entries: CashEntry[] = JSON.parse(cash);
      const filtered = entries.filter(e => !(e.statement.includes(invNum) && e.type === 'مرتجع'));
      localStorage.setItem('sheno_cash_journal', JSON.stringify(filtered));
    }
  };

  const handleDeleteReturn = (id: string, invNum: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المرتجع نهائياً؟ سيتم إلغاء تأثيره على المخزون والصندوق.')) {
      const updated = returnHistory.filter(r => r.id !== id);
      setReturnHistory(updated);
      localStorage.setItem('sheno_sales_returns', JSON.stringify(updated));
      removeAssociatedMovements(invNum);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">مرتجع مبيعات</h2>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center gap-4">
        <div className="flex flex-col gap-1 flex-1 max-w-sm">
          <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">ادخل رقم الفاتورة الأصلية</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={invoiceSearch}
              onChange={e => setInvoiceSearch(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl flex-1 font-bold outline-none"
              placeholder="مثلاً: 2723"
            />
            <button onClick={handleSearch} className="bg-primary text-white px-8 rounded-2xl font-black hover:brightness-110">بحث</button>
          </div>
        </div>
        {foundInvoice && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700 flex-1 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-zinc-400 font-black uppercase">العميل</p>
              <p className="font-black text-lg text-readable">{foundInvoice.customerName}</p>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-zinc-400 font-black uppercase">تاريخ الفاتورة</p>
              <p className="font-mono font-bold">{foundInvoice.date}</p>
            </div>
          </div>
        )}
      </div>

      {foundInvoice && (
        <div className={`bg-white dark:bg-zinc-900 rounded-3xl border ${editingReturnId ? 'border-amber-500' : 'border-rose-500'} overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300`}>
          <div className={`${editingReturnId ? 'bg-amber-600' : 'bg-rose-900'} p-3 text-white font-black flex justify-between items-center text-sm`}>
             <span className="flex items-center gap-2"><RotateCcw className="w-4 h-4"/> {editingReturnId ? 'تعديل كميات المرتجع الحالي' : 'تحديد كميات المرتجع من الفاتورة'}</span>
             <span className="opacity-75 tracking-widest uppercase">رقم الفاتورة: #{foundInvoice.invoiceNumber}</span>
          </div>
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800 h-10 text-[10px] text-zinc-500 font-black uppercase">
                <th className="p-3">المادة</th>
                <th className="p-3 text-center">الكمية المباعة</th>
                <th className="p-3 text-center text-rose-500">كمية المرتجع</th>
                <th className="p-3 text-center">السعر</th>
                <th className="p-3 text-center">القيمة المرتجعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {returnItems.map((item) => {
                const original = foundInvoice.items.find(i => i.id === item.id);
                return (
                  <tr key={item.id} className="hover:bg-rose-500/5 transition-colors">
                    <td className="p-3 font-bold">{item.name}</td>
                    <td className="p-3 text-center font-mono font-bold text-zinc-400">{original?.quantity}</td>
                    <td className="p-3 text-center">
                      <input 
                        type="number" 
                        max={original?.quantity}
                        min={0}
                        value={item.quantity}
                        onChange={e => handleReturnQtyChange(item.id, Number(e.target.value))}
                        className="bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-center w-24 py-2 rounded-xl text-rose-600 font-black outline-none focus:border-rose-500"
                      />
                    </td>
                    <td className="p-3 text-center font-mono">{item.price.toLocaleString()}</td>
                    <td className="p-3 text-center font-mono font-black text-emerald-600">{(item.quantity * item.price).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-zinc-50 dark:bg-zinc-800/30 font-bold border-t border-zinc-200 dark:border-zinc-800">
               <tr>
                 <td colSpan={4} className="p-5 text-left text-sm font-black text-readable">إجمالي قيمة المرتجع المستردة</td>
                 <td className="p-5 text-center text-rose-600 text-2xl font-black font-mono">
                   {returnItems.reduce((s, i) => s + (i.quantity * i.price), 0).toLocaleString()}
                 </td>
               </tr>
            </tfoot>
          </table>
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
            <button onClick={handleSaveReturn} className="bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 flex items-center gap-2 transition-all">
              <Save className="w-5 h-5"/> {editingReturnId ? 'حفظ تعديلات المرتجع' : 'تثبيت وحفظ المرتجع'}
            </button>
            <button onClick={() => { setFoundInvoice(null); setEditingReturnId(null); }} className="bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-10 py-3 rounded-2xl font-bold">إلغاء</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-black text-readable flex items-center gap-2 px-1">
           <RotateCcw className="w-5 h-5 text-rose-500" /> سجل مرتجعات المبيعات
        </h3>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800 h-10 text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                <th className="p-4">التاريخ</th>
                <th className="p-4">الفاتورة</th>
                <th className="p-4">العميل</th>
                <th className="p-4 text-center">المبلغ المسترد</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-bold">
              {returnHistory.length === 0 ? (
                <tr><td colSpan={5} className="p-16 text-center text-zinc-400 italic">لا توجد مرتجعات مسجلة حالياً.</td></tr>
              ) : (
                returnHistory.map(ret => (
                  <tr key={ret.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-4 font-mono text-zinc-400">{ret.date}</td>
                    <td className="p-4 font-black text-rose-600">#{ret.invoiceNumber}</td>
                    <td className="p-4">{ret.customerName}</td>
                    <td className="p-4 text-center font-mono font-black text-emerald-600">{ret.totalReturnAmount.toLocaleString()}</td>
                    <td className="p-4 text-center">
                       <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEditReturn(ret)} className="p-2 text-zinc-400 hover:text-amber-500 transition-all" title="تعديل"><Edit2 className="w-4 h-4"/></button>
                         <button onClick={() => handleDeleteReturn(ret.id, ret.invoiceNumber)} className="p-2 text-zinc-400 hover:text-rose-600 transition-all" title="حذف"><Trash2 className="w-4 h-4"/></button>
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

export default SalesReturnView;
