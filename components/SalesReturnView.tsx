
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Save, Trash2, Edit2, RotateCcw, Printer, FileDown } from 'lucide-react';
import { SalesInvoice, InvoiceItem, StockEntry, CashEntry } from '../types';
import { exportToCSV } from '../utils/export';

const tafqeet = (n: number, prefix: string = ""): string => {
  if (n === 0) return "صفر";
  return `${prefix} ${n.toLocaleString()} ليرة سورية فقط لا غير`;
};

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
      }
    }
  };

  const removeAssociatedMovements = (id: string) => {
    const stock = localStorage.getItem('sheno_stock_entries');
    if (stock) {
      const entries: StockEntry[] = JSON.parse(stock);
      const filtered = entries.filter(e => e.movementCode !== id);
      localStorage.setItem('sheno_stock_entries', JSON.stringify(filtered));
    }
    const cash = localStorage.getItem('sheno_cash_journal');
    if (cash) {
      const entries: CashEntry[] = JSON.parse(cash);
      const filtered = entries.filter(e => e.voucherNumber !== id);
      localStorage.setItem('sheno_cash_journal', JSON.stringify(filtered));
    }
  };

  const handleSaveReturn = () => {
    if (!foundInvoice || returnItems.every(i => i.quantity <= 0)) return;
    
    const totalReturnAmount = returnItems.reduce((s, i) => s + (i.quantity * i.price), 0);
    const returnId = editingReturnId || crypto.randomUUID();
    const returnDate = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    
    const returnEntry = {
      id: returnId,
      invoiceNumber: foundInvoice.invoiceNumber,
      customerName: foundInvoice.customerName,
      date: returnDate,
      time: time,
      items: returnItems.filter(i => i.quantity > 0),
      totalReturnAmount: totalReturnAmount,
      totalAmountLiteral: tafqeet(totalReturnAmount),
      notes: editingReturnId ? 'تعديل مرتجع' : 'مرتجع مبيعات جديد'
    };

    if (editingReturnId) {
      removeAssociatedMovements(editingReturnId);
    }

    const updatedHistory = editingReturnId 
      ? returnHistory.map(r => r.id === editingReturnId ? returnEntry : r)
      : [returnEntry, ...returnHistory];

    setReturnHistory(updatedHistory);
    localStorage.setItem('sheno_sales_returns', JSON.stringify(updatedHistory));

    // Update stock entries
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

    // Update cash journal
    const savedCash = localStorage.getItem('sheno_cash_journal');
    let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
    const cashMove: CashEntry = {
      id: crypto.randomUUID(),
      date: returnDate,
      statement: `استرداد مالي لمرتجع مبيع فاتورة ${foundInvoice.invoiceNumber}`,
      receivedSYP: 0,
      paidSYP: totalReturnAmount,
      receivedUSD: 0,
      paidUSD: 0,
      notes: 'مرتجع مبيعات',
      type: 'مرتجع',
      voucherNumber: returnId
    };
    localStorage.setItem('sheno_cash_journal', JSON.stringify([cashMove, ...cashEntries]));
    
    alert(editingReturnId ? 'تم تحديث المرتجع بنجاح' : 'تم حفظ المرتجع وتحديث السجلات');
    setFoundInvoice(null);
    setInvoiceSearch('');
    setEditingReturnId(null);
  };

  const handleDeleteReturn = (id: string) => {
    if (window.confirm('حذف المرتجع نهائياً؟')) {
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
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
             <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">إدارة مرتجعات المبيعات</h2>
        </div>
        <button onClick={() => exportToCSV(returnHistory, 'sales_returns_report')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2">
           <FileDown className="w-5 h-5" /> تصدير XLSX
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border shadow-xl flex items-center gap-4 no-print">
        <div className="flex flex-col gap-1 flex-1 max-w-sm">
          <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">البحث برقم الفاتورة الأصلية</label>
          <div className="flex gap-2">
            <input type="text" value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-2xl flex-1 font-bold outline-none" />
            <button onClick={handleSearch} className="bg-primary text-white px-8 rounded-2xl font-black">بحث</button>
          </div>
        </div>
        {foundInvoice && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border flex-1 flex justify-between">
            <div><p className="text-[10px] text-zinc-400 font-black uppercase">العميل</p><p className="font-black text-lg">{foundInvoice.customerName}</p></div>
            <div><p className="text-[10px] text-zinc-400 font-black uppercase">التاريخ الأصلي</p><p className="font-mono font-bold">{foundInvoice.date}</p></div>
          </div>
        )}
      </div>

      {foundInvoice && (
        <div className={`bg-white dark:bg-zinc-900 rounded-3xl border ${editingReturnId ? 'border-amber-500' : 'border-rose-500'} overflow-hidden shadow-2xl animate-in zoom-in-95 no-print`}>
          <div className={`${editingReturnId ? 'bg-amber-600' : 'bg-rose-900'} p-3 text-white font-black flex justify-between text-sm`}>
             <span>{editingReturnId ? 'تعديل كميات المرتجع' : 'تحديد كميات المرتجع'}</span>
             <span>#{foundInvoice.invoiceNumber}</span>
          </div>
          <table className="w-full text-right border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-[10px] text-zinc-500 font-black uppercase">
              <tr><th className="p-3">المادة</th><th className="p-3 text-center">المباع</th><th className="p-3 text-center text-rose-500">المرتجع</th><th className="p-3 text-center">السعر</th><th className="p-3 text-center">المجموع</th></tr>
            </thead>
            <tbody className="divide-y">
              {returnItems.map(item => {
                const orig = foundInvoice.items.find(i => i.id === item.id);
                return (
                  <tr key={item.id}>
                    <td className="p-3 font-bold">{item.name}</td>
                    <td className="p-3 text-center font-mono text-zinc-400">{orig?.quantity}</td>
                    <td className="p-3 text-center">
                      <input type="number" max={orig?.quantity} min={0} value={item.quantity} onChange={e => setReturnItems(returnItems.map(i => i.id === item.id ? { ...i, quantity: Number(e.target.value) } : i))} className="bg-zinc-50 dark:bg-zinc-800 border-2 w-24 p-2 rounded-xl text-rose-600 font-black text-center" />
                    </td>
                    <td className="p-3 text-center font-mono">{item.price.toLocaleString()}</td>
                    <td className="p-3 text-center font-mono font-black text-emerald-600">{(item.quantity * item.price).toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end gap-3">
            <button onClick={handleSaveReturn} className="bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-xl"><Save className="w-5 h-5"/> حفظ المرتجع</button>
            <button onClick={() => { setFoundInvoice(null); setEditingReturnId(null); }} className="bg-zinc-200 dark:bg-zinc-800 px-10 py-3 rounded-2xl font-bold">إلغاء</button>
          </div>
        </div>
      )}

      {/* Redesigned History Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-[11px]">
            <thead>
              <tr className="bg-zinc-900 text-white font-black uppercase tracking-tighter border-b border-zinc-700">
                <th className="p-3 border-l border-zinc-800 text-center">تسلسل</th>
                <th className="p-3 border-l border-zinc-800 text-center">رقم الفاتورة</th>
                <th className="p-3 border-l border-zinc-800 text-center">تاريخ المرتجع</th>
                <th className="p-3 border-l border-zinc-800 text-center">العميل</th>
                <th className="p-3 border-l border-zinc-800 text-right w-64">تفاصيل الأصناف المرتجعة</th>
                <th className="p-3 border-l border-zinc-800 text-center">العدد</th>
                <th className="p-3 border-l border-zinc-800 text-center">السعر الإفرادي</th>
                <th className="p-3 border-l border-zinc-800 text-center">إجمالي المرتجع</th>
                <th className="p-3 border-l border-zinc-800 text-right w-64">التفقيط (كتابة)</th>
                <th className="p-3 border-l border-zinc-800 text-right">ملاحظات</th>
                <th className="p-3 border-l border-zinc-800 text-center">وقت</th>
                <th className="p-3 text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
              {returnHistory.length === 0 ? (
                <tr><td colSpan={12} className="p-16 text-center italic text-zinc-400">لا يوجد سجلات مرتجعات حتى الآن</td></tr>
              ) : (
                returnHistory.map((ret, idx) => (
                  <tr key={ret.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-400">{returnHistory.length - idx}</td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center text-rose-600 font-black">#{ret.invoiceNumber}</td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-xs">{ret.date}</td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-readable">{ret.customerName}</td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-col gap-0.5 max-h-24 overflow-y-auto">
                        {ret.items.map((it: any, i: number) => (
                          <div key={i} className="flex items-center gap-1">
                             {it.image && <img src={it.image} className="w-5 h-5 rounded-sm object-cover" />}
                             <span className="truncate">{it.name} <span className="text-[8px] opacity-60 font-normal">({it.serialNumber || 'بدون SN'})</span></span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono">
                      {ret.items.reduce((s: number, i: any) => s + i.quantity, 0)}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-400">
                      {ret.items[0]?.price.toLocaleString()}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-black text-rose-600 font-mono">
                      {ret.totalReturnAmount.toLocaleString()}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-xs font-normal text-zinc-500 leading-tight">
                      {ret.totalAmountLiteral}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-zinc-400 font-normal italic">
                      {ret.notes || '-'}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-[9px] text-zinc-400">
                      {ret.time || '--:--'}
                    </td>
                    <td className="p-3 text-center no-print">
                       <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => window.print()} className="p-1 text-zinc-300 hover:text-primary"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => handleEditReturn(ret)} className="p-1 text-zinc-300 hover:text-amber-500"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={() => handleDeleteReturn(ret.id)} className="p-1 text-zinc-300 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>
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
