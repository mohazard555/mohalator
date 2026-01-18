
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Save, X, ShoppingBag, Truck, ScrollText, Calendar, Hash } from 'lucide-react';
import { PurchaseInvoice, InvoiceItem, StockEntry, Party, PartyType, CashEntry } from '../types';

const tafqeet = (n: number): string => {
  if (n === 0) return "صفر";
  return `${n.toLocaleString()} ليرة سورية فقط لا غير`;
};

interface PurchaseInvoiceViewProps {
  onBack: () => void;
}

const PurchaseInvoiceView: React.FC<PurchaseInvoiceViewProps> = ({ onBack }) => {
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newInvoice, setNewInvoice] = useState<Partial<PurchaseInvoice>>({
    invoiceNumber: '',
    supplierName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    notes: '',
    paidAmount: 0
  });

  const [newItem, setNewItem] = useState({ name: '', quantity: 1, price: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('sheno_purchases');
    const savedParties = localStorage.getItem('sheno_parties');
    if (saved) setPurchases(JSON.parse(saved));
    if (savedParties) setParties(JSON.parse(savedParties).filter((p: Party) => p.type === PartyType.SUPPLIER));
  }, []);

  const handleAddItem = () => {
    if (!newItem.name || newItem.quantity <= 0) return;
    const item: InvoiceItem = {
      id: crypto.randomUUID(),
      code: 'PUR-' + Math.floor(Math.random() * 1000),
      name: newItem.name,
      quantity: newItem.quantity,
      price: newItem.price,
      unit: 'قطعة',
      total: newItem.quantity * newItem.price,
      date: newInvoice.date!,
      notes: ''
    };
    setNewInvoice({ ...newInvoice, items: [...(newInvoice.items || []), item] });
    setNewItem({ name: '', quantity: 1, price: 0 });
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
      id: crypto.randomUUID(),
      time,
      totalAmount: total
    };

    // 1. Save Purchase Record
    const updated = [invoice, ...purchases];
    setPurchases(updated);
    localStorage.setItem('sheno_purchases', JSON.stringify(updated));

    // 2. Add items to Stock (إدخال)
    const savedStock = localStorage.getItem('sheno_stock_entries');
    let stockEntries: StockEntry[] = savedStock ? JSON.parse(savedStock) : [];
    const stockMoves: StockEntry[] = invoice.items.map(i => ({
      id: crypto.randomUUID(),
      date: invoice.date,
      day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date(invoice.date)),
      department: 'مشتريات وتوريد',
      itemCode: i.code,
      itemName: i.name,
      unit: i.unit,
      price: i.price,
      warehouse: 'المستودع الرئيسي',
      movementType: 'إدخال',
      quantity: i.quantity,
      invoiceNumber: invoice.invoiceNumber,
      statement: `شراء من المورد: ${invoice.supplierName}`
    }));
    localStorage.setItem('sheno_stock_entries', JSON.stringify([...stockMoves, ...stockEntries]));

    // 3. Log to Cash Journal (صرف مالي)
    if (invoice.paidAmount > 0) {
      const savedCash = localStorage.getItem('sheno_cash_journal');
      let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
      const cashMove: CashEntry = {
        id: crypto.randomUUID(),
        date: invoice.date,
        statement: `دفعة مقابل فاتورة مشتريات رقم ${invoice.invoiceNumber} - المورد: ${invoice.supplierName}`,
        receivedSYP: 0,
        paidSYP: invoice.paidAmount,
        receivedUSD: 0,
        paidUSD: 0,
        notes: invoice.notes,
        type: 'شراء'
      };
      localStorage.setItem('sheno_cash_journal', JSON.stringify([cashMove, ...cashEntries]));
    }

    setIsAdding(false);
    setNewInvoice({ invoiceNumber: '', supplierName: '', date: new Date().toISOString().split('T')[0], items: [], notes: '', paidAmount: 0 });
    alert('تم حفظ فاتورة المشتريات وتحديث المستودع والصندوق بنجاح.');
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
          <button onClick={() => setIsAdding(true)} className="bg-amber-600 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-amber-500/20 hover:brightness-110 transition-all active:scale-95">
            <Plus className="w-5 h-5" /> فاتورة توريد جديدة
          </button>
       </div>

       {isAdding && (
         <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">المورد</label>
                  <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.supplierName} onChange={e => setNewInvoice({...newInvoice, supplierName: e.target.value})}>
                    <option value="">-- اختر مورد --</option>
                    {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">رقم فاتورة المورد</label>
                  <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.invoiceNumber} onChange={e => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})} />
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">تاريخ التوريد</label>
                  <input type="date" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} />
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">المبلغ المدفوع (صرف من الصندوق)</label>
                  <input type="number" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-black text-rose-500 outline-none" value={newInvoice.paidAmount} onChange={e => setNewInvoice({...newInvoice, paidAmount: Number(e.target.value)})} />
               </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
               <h4 className="text-sm font-black text-amber-600 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 uppercase tracking-widest">
                  <ShoppingBag className="w-4 h-4" /> بنود التوريد (المواد المستلمة)
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="text" placeholder="اسم المادة..." className="md:col-span-2 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                  <input type="number" placeholder="الكمية" className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center font-bold" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                  <div className="flex gap-2">
                     <input type="number" placeholder="سعر الشراء" className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center font-bold" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
                     <button onClick={handleAddItem} className="bg-amber-600 text-white p-3 rounded-xl shadow-lg hover:bg-amber-500 transition-all font-bold">إضافة</button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                     <thead className="text-zinc-500 font-black uppercase">
                        <tr className="border-b border-zinc-200 dark:border-zinc-800">
                           <th className="p-3 text-right">المادة</th>
                           <th className="p-3 text-center">الكمية</th>
                           <th className="p-3 text-center">السعر</th>
                           <th className="p-3 text-center">المجموع</th>
                           <th className="p-3"></th>
                        </tr>
                     </thead>
                     <tbody className="font-bold">
                        {newInvoice.items?.map(item => (
                           <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                              <td className="p-3">{item.name}</td>
                              <td className="p-3 text-center font-mono">{item.quantity}</td>
                              <td className="p-3 text-center font-mono">{item.price.toLocaleString()}</td>
                              <td className="p-3 text-center font-mono text-primary">{(item.quantity * item.price).toLocaleString()}</td>
                              <td className="p-3 text-center">
                                 <button onClick={() => setNewInvoice({...newInvoice, items: newInvoice.items?.filter(i => i.id !== item.id)})} className="text-rose-500 hover:bg-rose-500/10 p-1 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-zinc-100 dark:border-zinc-800 gap-6">
               <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">إجمالي الفاتورة</span>
                  <div className="text-2xl font-black text-primary font-mono">{ (newInvoice.items?.reduce((s,i) => s + i.total, 0) || 0).toLocaleString() }</div>
               </div>
               <div className="flex gap-3 w-full md:w-auto">
                  <button onClick={handleSave} className="flex-1 md:flex-none bg-amber-600 text-white px-12 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" /> حفظ الفاتورة وتثبيتها
                  </button>
                  <button onClick={() => setIsAdding(false)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-10 py-3 rounded-2xl font-bold">إلغاء</button>
               </div>
            </div>
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4">
               <Truck className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mx-auto" />
               <p className="text-zinc-400 font-bold italic">لا توجد فواتير توريد مسجلة حالياً.</p>
            </div>
          ) : purchases.map(p => (
            <div key={p.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 shadow-lg group relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>
               <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                     <h3 className="text-xl font-black text-readable">{p.supplierName}</h3>
                     <span className="text-[10px] font-black text-zinc-400 font-mono tracking-widest uppercase">INV: #{p.invoiceNumber}</span>
                  </div>
                  <div className="bg-amber-500/10 text-amber-600 p-2 rounded-xl"><Truck className="w-5 h-5" /></div>
               </div>
               <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex flex-col">
                     <span className="text-[10px] text-zinc-400 font-black uppercase">التاريخ</span>
                     <span className="text-xs font-bold font-mono">{p.date}</span>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] text-zinc-400 font-black uppercase">الإجمالي</span>
                     <span className="text-lg font-black font-mono text-readable">{p.totalAmount.toLocaleString()}</span>
                  </div>
               </div>
               <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-rose-500">المدفوع نقداً</span>
                  <span className="font-mono font-black text-rose-500">{p.paidAmount?.toLocaleString() || '0'}</span>
               </div>
               <div className="absolute inset-0 bg-primary/0 group-hover:bg-zinc-900/5 transition-all pointer-events-none"></div>
            </div>
          ))}
       </div>
    </div>
  );
};

export default PurchaseInvoiceView;
