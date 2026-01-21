
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Save, X, ShoppingBag, Truck, ScrollText, Calendar, Hash, Box, Printer, FileDown } from 'lucide-react';
import { PurchaseInvoice, InvoiceItem, StockEntry, Party, PartyType, CashEntry } from '../types';
import { exportToCSV } from '../utils/export';

interface PurchaseInvoiceViewProps {
  onBack: () => void;
}

const PurchaseInvoiceView: React.FC<PurchaseInvoiceViewProps> = ({ onBack }) => {
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newInvoice, setNewInvoice] = useState<Partial<PurchaseInvoice>>({
    invoiceNumber: '',
    supplierName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    notes: '',
    paidAmount: 0
  });

  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: 'قطعة', price: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('sheno_purchases');
    const savedParties = localStorage.getItem('sheno_parties');
    if (saved) setPurchases(JSON.parse(saved));
    if (savedParties) {
       const allParties = JSON.parse(savedParties);
       setParties(allParties.filter((p: Party) => p.type === PartyType.SUPPLIER || p.type === PartyType.BOTH));
    }
  }, []);

  const handleAddItem = () => {
    if (!newItem.name || newItem.quantity <= 0) return;
    const item: InvoiceItem = {
      id: crypto.randomUUID(),
      code: 'PUR-' + Math.floor(Math.random() * 1000),
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      price: newItem.price,
      total: newItem.quantity * newItem.price,
      date: newInvoice.date!,
      notes: ''
    };
    setNewInvoice({ ...newInvoice, items: [...(newInvoice.items || []), item] });
    setNewItem({ name: '', quantity: 1, unit: 'قطعة', price: 0 });
  };

  const handleEdit = (p: PurchaseInvoice) => {
    setEditingId(p.id);
    setNewInvoice(p);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string, invNum: string) => {
    if (window.confirm(`حذف فاتورة المشتريات رقم ${invNum}؟`)) {
      const updated = purchases.filter(p => p.id !== id);
      setPurchases(updated);
      localStorage.setItem('sheno_purchases', JSON.stringify(updated));
      
      const stock = localStorage.getItem('sheno_stock_entries');
      if (stock) {
        localStorage.setItem('sheno_stock_entries', JSON.stringify(JSON.parse(stock).filter((e:StockEntry) => e.invoiceNumber !== invNum)));
      }
      const cash = localStorage.getItem('sheno_cash_journal');
      if (cash) {
        localStorage.setItem('sheno_cash_journal', JSON.stringify(JSON.parse(cash).filter((e:CashEntry) => !e.statement.includes(`رقم ${invNum}`))));
      }
    }
  };

  const handleSave = () => {
    if (!newInvoice.supplierName || (newInvoice.items || []).length === 0) {
      alert('يرجى اختيار المورد وإضافة مادة واحدة على الأقل.');
      return;
    }

    const total = (newInvoice.items || []).reduce((s, i) => s + i.total, 0);
    const time = new Date().toLocaleTimeString('ar-SA');
    const invoice: PurchaseInvoice = {
      ...newInvoice as PurchaseInvoice,
      id: editingId || crypto.randomUUID(),
      time: editingId ? (newInvoice.time || time) : time,
      totalAmount: total
    };

    if (editingId) {
      const stock = localStorage.getItem('sheno_stock_entries');
      if (stock) localStorage.setItem('sheno_stock_entries', JSON.stringify(JSON.parse(stock).filter((e:StockEntry) => e.invoiceNumber !== invoice.invoiceNumber)));
      const cash = localStorage.getItem('sheno_cash_journal');
      if (cash) localStorage.setItem('sheno_cash_journal', JSON.stringify(JSON.parse(cash).filter((e:CashEntry) => !e.statement.includes(`رقم ${invoice.invoiceNumber}`))));
    }

    const updated = editingId ? purchases.map(p => p.id === editingId ? invoice : p) : [invoice, ...purchases];
    setPurchases(updated);
    localStorage.setItem('sheno_purchases', JSON.stringify(updated));

    const savedStock = localStorage.getItem('sheno_stock_entries');
    let stockEntries: StockEntry[] = savedStock ? JSON.parse(savedStock) : [];
    const stockMoves: StockEntry[] = invoice.items.map(i => ({
      id: crypto.randomUUID(), date: invoice.date,
      day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date(invoice.date)),
      department: 'مشتريات وتوريد', itemCode: i.code, itemName: i.name,
      unit: i.unit, price: i.price, warehouse: 'المستودع الرئيسي',
      movementType: 'إدخال', quantity: i.quantity, invoiceNumber: invoice.invoiceNumber,
      statement: `شراء من المورد: ${invoice.supplierName}`
    }));
    localStorage.setItem('sheno_stock_entries', JSON.stringify([...stockMoves, ...stockEntries]));

    if (invoice.paidAmount > 0) {
      const savedCash = localStorage.getItem('sheno_cash_journal');
      let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
      const cashMove: CashEntry = {
        id: crypto.randomUUID(), date: invoice.date,
        statement: `دفعة مقابل فاتورة مشتريات رقم ${invoice.invoiceNumber} - المورد: ${invoice.supplierName}`,
        receivedSYP: 0, paidSYP: invoice.paidAmount, receivedUSD: 0, paidUSD: 0,
        notes: invoice.notes, type: 'شراء'
      };
      localStorage.setItem('sheno_cash_journal', JSON.stringify([cashMove, ...cashEntries]));
    }

    setIsAdding(false);
    setEditingId(null);
    setNewInvoice({ invoiceNumber: '', supplierName: '', date: new Date().toISOString().split('T')[0], items: [], notes: '', paidAmount: 0 });
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
                <ArrowRight className="w-6 h-6" />
             </button>
             <h2 className="text-2xl font-black text-readable">فواتير المشتريات والتوريد</h2>
          </div>
          <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="bg-amber-600 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 transition-all">
            <Plus className="w-5 h-5" /> فاتورة توريد جديدة
          </button>
       </div>

       {isAdding && (
         <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">المورد</label>
                  <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.supplierName} onChange={e => setNewInvoice({...newInvoice, supplierName: e.target.value})}>
                    <option value="">-- اختر مورد --</option>
                    {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
               </div>
               <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم الفاتورة</label><input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.invoiceNumber} onChange={e => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})} /></div>
               <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">تاريخ التوريد</label><input type="date" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} /></div>
               <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">المدفوع نقداً</label><input type="number" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-black text-rose-500 outline-none" value={newInvoice.paidAmount} onChange={e => setNewInvoice({...newInvoice, paidAmount: Number(e.target.value)})} /></div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border space-y-4 shadow-inner">
               <h4 className="text-sm font-black text-amber-600 flex items-center gap-2 border-b pb-2 uppercase tracking-widest"><ShoppingBag className="w-4 h-4" /> بنود التوريد</h4>
               <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <input type="text" placeholder="المادة..." className="md:col-span-2 bg-white dark:bg-zinc-900 p-3 rounded-xl border font-bold outline-none" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                  <input type="number" placeholder="كمية" className="bg-white dark:bg-zinc-900 p-3 rounded-xl border text-center font-bold" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                  <select className="bg-white dark:bg-zinc-900 p-3 rounded-xl border font-bold outline-none" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})}><option value="قطعة">قطعة</option><option value="كيلو">كيلو</option><option value="طرد">طرد</option></select>
                  <input type="number" placeholder="سعر" className="bg-white dark:bg-zinc-900 p-3 rounded-xl border text-center font-bold" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
                  <button onClick={handleAddItem} className="bg-amber-600 text-white rounded-xl shadow-lg font-black">إضافة</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-xs font-bold">
                     <thead><tr className="text-zinc-500 uppercase border-b"><th className="p-3 text-right">المادة</th><th className="p-3 text-center">الكمية</th><th className="p-3 text-center">السعر</th><th className="p-3 text-center">المجموع</th><th className="p-3"></th></tr></thead>
                     <tbody>
                        {newInvoice.items?.map(item => (
                           <tr key={item.id} className="border-b border-zinc-100"><td className="p-3">{item.name}</td><td className="p-3 text-center font-mono">{item.quantity} {item.unit}</td><td className="p-3 text-center font-mono">{item.price.toLocaleString()}</td><td className="p-3 text-center font-mono text-primary">{(item.quantity * item.price).toLocaleString()}</td><td className="p-3 text-center"><button onClick={() => setNewInvoice({...newInvoice, items: newInvoice.items?.filter(i => i.id !== item.id)})} className="text-rose-500"><Trash2 className="w-4 h-4"/></button></td></tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
               <button onClick={handleSave} className="bg-amber-600 text-white px-12 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 flex items-center gap-2"><Save className="w-5 h-5" /> {editingId ? 'تعديل وحفظ' : 'حفظ الفاتورة'}</button>
               <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-100 text-zinc-500 px-10 py-3 rounded-2xl font-bold">إلغاء</button>
            </div>
         </div>
       )}

       <div className="bg-zinc-950 rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
             <table className="w-full text-right border-collapse text-[11px]">
                <thead>
                   <tr className="bg-zinc-900 text-white font-black h-14 border-b border-zinc-800 uppercase tracking-widest">
                      <th className="p-4 border-l border-zinc-800 text-center w-20">رقم الفاتورة</th>
                      <th className="p-4 border-l border-zinc-800 text-center w-32">التاريخ</th>
                      <th className="p-4 border-l border-zinc-800">المورد</th>
                      <th className="p-4 border-l border-zinc-800">الأصناف</th>
                      <th className="p-4 border-l border-zinc-800 text-center w-32">إجمالي الشراء</th>
                      <th className="p-4 border-l border-zinc-800 text-center w-32 text-rose-500">الواصل نقداً</th>
                      <th className="p-4 text-center w-32 no-print">إجراءات</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-bold text-zinc-300">
                   {purchases.map(p => (
                      <tr key={p.id} className="hover:bg-zinc-900 transition-colors h-14">
                         <td className="p-4 border-l border-zinc-900 text-center text-amber-500 font-black">#{p.invoiceNumber}</td>
                         <td className="p-4 border-l border-zinc-900 text-center font-mono text-zinc-500">{p.date}</td>
                         <td className="p-4 border-l border-zinc-900 text-white">{p.supplierName}</td>
                         <td className="p-4 border-l border-zinc-900">
                            <div className="flex flex-wrap gap-1">
                               {p.items.map((it, i) => (<span key={i} className="bg-amber-900/20 text-amber-500 px-2 py-0.5 rounded-sm text-[9px] border border-amber-900/30">{it.name} ({it.quantity})</span>))}
                            </div>
                         </td>
                         <td className="p-4 border-l border-zinc-900 text-center font-mono text-white text-lg">{p.totalAmount.toLocaleString()}</td>
                         <td className="p-4 border-l border-zinc-900 text-center font-mono text-rose-500 text-lg">{p.paidAmount?.toLocaleString() || '0'}</td>
                         <td className="p-4 text-center no-print">
                            <div className="flex justify-center gap-2">
                               <button onClick={() => handleEdit(p)} className="p-2 text-zinc-500 hover:text-amber-500"><Edit2 className="w-4 h-4" /></button>
                               <button onClick={() => handleDelete(p.id, p.invoiceNumber)} className="p-2 text-zinc-500 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
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

export default PurchaseInvoiceView;
