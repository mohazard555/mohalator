
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Save, Trash2, Edit2, RotateCcw, Printer, FileDown, X } from 'lucide-react';
import { SalesInvoice, InvoiceItem, StockEntry, CashEntry } from '../types';
import { exportToCSV } from '../utils/export';
import { tafqeet } from '../utils/tafqeet';

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
          const prevRetItem = ret.items.find((ri: any) => ri.id === origItem.id);
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
    
    const returnEntry = {
      id: returnId,
      invoiceNumber: foundInvoice.invoiceNumber,
      customerName: foundInvoice.customerName,
      date: returnDate,
      items: returnItems.filter(i => i.quantity > 0),
      totalReturnAmount: totalReturnAmount,
      totalAmountLiteral: tafqeet(totalReturnAmount, "ليرة سورية"),
      notes: editingReturnId ? 'تعديل مرتجع مبيعات' : 'مرتجع مبيعات'
    };

    if (editingReturnId) removeAssociatedMovements(editingReturnId);

    const updatedHistory = editingReturnId 
      ? returnHistory.map(r => r.id === editingReturnId ? returnEntry : r)
      : [returnEntry, ...returnHistory];

    setReturnHistory(updatedHistory);
    localStorage.setItem('sheno_sales_returns', JSON.stringify(updatedHistory));

    // Update stock & cash
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

    const savedCash = localStorage.getItem('sheno_cash_journal');
    let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
    const cashMove: CashEntry = {
      id: crypto.randomUUID(),
      date: returnDate,
      statement: `استرداد مالي لمرتجع مبيع فاتورة ${foundInvoice.invoiceNumber}`,
      receivedSYP: 0, paidSYP: totalReturnAmount, receivedUSD: 0, paidUSD: 0,
      notes: 'مرتجع مبيعات', type: 'مرتجع', voucherNumber: returnId
    };
    localStorage.setItem('sheno_cash_journal', JSON.stringify([cashMove, ...cashEntries]));
    
    alert('تم حفظ المرتجع وتحديث السجلات بنجاح');
    setFoundInvoice(null);
    setEditingReturnId(null);
    setInvoiceSearch('');
  };

  const handleDeleteReturn = (id: string) => {
    if (window.confirm('حذف المرتجع نهائياً وإلغاء تأثيره؟')) {
      const updated = returnHistory.filter(r => r.id !== id);
      setReturnHistory(updated);
      localStorage.setItem('sheno_sales_returns', JSON.stringify(updated));
      removeAssociatedMovements(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-all"><ArrowRight className="w-6 h-6" /></button>
          <h2 className="text-2xl font-black text-readable">إدارة مرتجعات المبيعات</h2>
        </div>
        <button onClick={() => exportToCSV(returnHistory, 'returns_report')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2">
           <FileDown className="w-5 h-5" /> تصدير XLSX
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border shadow-xl flex items-center gap-4 no-print">
        <div className="flex flex-col gap-1 flex-1 max-w-sm">
          <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">البحث برقم الفاتورة الأصلية</label>
          <div className="flex gap-2">
            <input type="text" value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl flex-1 font-bold outline-none" placeholder="0000" />
            <button onClick={handleSearch} className="bg-primary text-white px-8 rounded-2xl font-black">بحث</button>
          </div>
        </div>
        {foundInvoice && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border flex-1 flex justify-between">
            <div><p className="text-[10px] text-zinc-400 font-black uppercase">العميل</p><p className="font-black text-lg">{foundInvoice.customerName}</p></div>
            <div><p className="text-[10px] text-zinc-400 font-black uppercase">تاريخ الفاتورة</p><p className="font-mono font-bold">{foundInvoice.date}</p></div>
          </div>
        )}
      </div>

      {foundInvoice && (
        <div className={`bg-white dark:bg-zinc-900 rounded-3xl border-2 ${editingReturnId ? 'border-amber-500' : 'border-rose-900'} overflow-hidden shadow-2xl animate-in zoom-in-95 no-print`}>
          <div className={`${editingReturnId ? 'bg-amber-600' : 'bg-rose-900'} p-3 text-white font-black flex justify-between text-sm px-6`}>
             <span>{editingReturnId ? 'تعديل كميات المرتجع' : 'تحديد كميات المرتجع'}</span>
             <span>#{foundInvoice.invoiceNumber}</span>
          </div>
          <table className="w-full text-right">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-[10px] text-zinc-500 font-black uppercase">
              <tr><th className="p-3">المادة</th><th className="p-3 text-center">المباع</th><th className="p-3 text-center text-rose-500">المرتجع</th><th className="p-3 text-center">المجموع</th></tr>
            </thead>
            <tbody className="divide-y font-bold">
              {returnItems.map(item => (
                <tr key={item.id}>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3 text-center font-mono text-zinc-400">{foundInvoice.items.find(i=>i.id===item.id)?.quantity}</td>
                  <td className="p-3 text-center">
                    <input type="number" min={0} value={item.quantity} onChange={e => setReturnItems(returnItems.map(i => i.id === item.id ? { ...i, quantity: Number(e.target.value) } : i))} className="bg-zinc-50 border-2 w-24 p-2 rounded-xl text-rose-600 font-black text-center" />
                  </td>
                  <td className="p-3 text-center font-mono text-emerald-600">{(item.quantity * item.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end gap-3">
            <button onClick={handleSaveReturn} className="bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-xl"><Save className="w-5 h-5"/> حفظ المرتجع</button>
            <button onClick={() => { setFoundInvoice(null); setEditingReturnId(null); }} className="bg-zinc-200 dark:bg-zinc-800 px-10 py-3 rounded-2xl font-bold">إلغاء</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
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
            <tbody className="divide-y font-bold">
               {returnHistory.map(ret => (
                  <tr key={ret.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group h-14">
                     <td className="p-4 border-l border-zinc-100 dark:border-zinc-800 text-center text-rose-600 font-black">#{ret.invoiceNumber}</td>
                     <td className="p-4 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-500">{ret.date}</td>
                     <td className="p-4 border-l border-zinc-100 dark:border-zinc-800 text-readable">{ret.customerName}</td>
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
  );
};

export default SalesReturnView;
