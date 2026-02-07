
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Save, X, ShoppingBag, Truck, ScrollText, Calendar, Hash, Box, Printer, FileDown, Coins, CreditCard, Search, MessageSquare, Tag, Percent } from 'lucide-react';
import { PurchaseInvoice, InvoiceItem, StockEntry, Party, PartyType, CashEntry, AppSettings, InventoryItem } from '../types';
import { exportToCSV } from '../utils/export';

interface PurchaseInvoiceViewProps {
  onBack: () => void;
}

const PurchaseInvoiceView: React.FC<PurchaseInvoiceViewProps> = ({ onBack }) => {
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedCurrencyType, setSelectedCurrencyType] = useState<'primary' | 'secondary'>('primary');
  
  // States for search and selection
  const [itemSearch, setItemSearch] = useState('');
  const [showItemResults, setShowItemResults] = useState(false);

  const [newInvoice, setNewInvoice] = useState<Partial<PurchaseInvoice>>({
    invoiceNumber: '',
    supplierName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    notes: '',
    paidAmount: 0,
    transportExpenses: 0,
    discountAmount: 0
  });

  const [newItem, setNewItem] = useState({ 
    name: '', 
    code: '', 
    quantity: 1, 
    unit: 'قطعة', 
    price: 0, 
    notes: '',
    isCustomUnit: false,
    customUnit: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('sheno_purchases');
    const savedParties = localStorage.getItem('sheno_parties');
    const savedSettings = localStorage.getItem('sheno_settings');
    const savedInventory = localStorage.getItem('sheno_inventory_list');

    if (saved) setPurchases(JSON.parse(saved));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    
    if (savedParties) {
       const allParties = JSON.parse(savedParties);
       setParties(allParties.filter((p: Party) => p.type === PartyType.SUPPLIER || p.type === PartyType.BOTH));
    }
  }, []);

  const handleSelectItem = (item: InventoryItem) => {
    setNewItem({
      ...newItem,
      name: item.name,
      code: item.code,
      unit: item.unit,
      price: item.price,
      isCustomUnit: !['قطعة', 'كيلو', 'متر', 'طرد', 'كرتونة'].includes(item.unit)
    });
    setItemSearch(item.name);
    setShowItemResults(false);
  };

  const handleAddItem = () => {
    if (!newItem.name || newItem.quantity <= 0) return;
    
    const finalUnit = newItem.isCustomUnit ? newItem.customUnit : newItem.unit;
    
    const item: InvoiceItem = {
      id: crypto.randomUUID(),
      code: newItem.code || ('PUR-' + Math.floor(Math.random() * 1000)),
      name: newItem.name,
      quantity: newItem.quantity,
      unit: finalUnit || 'قطعة',
      price: newItem.price,
      total: newItem.quantity * newItem.price,
      date: newInvoice.date!,
      notes: newItem.notes
    };

    setNewInvoice({ ...newInvoice, items: [...(newInvoice.items || []), item] });
    setNewItem({ name: '', code: '', quantity: 1, unit: 'قطعة', price: 0, notes: '', isCustomUnit: false, customUnit: '' });
    setItemSearch('');
  };

  const handleEdit = (p: PurchaseInvoice) => {
    setEditingId(p.id);
    setNewInvoice(p);
    if (p.currencySymbol === settings?.secondaryCurrencySymbol) setSelectedCurrencyType('secondary');
    else setSelectedCurrencyType('primary');
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

    const subTotal = (newInvoice.items || []).reduce((s, i) => s + i.total, 0);
    const transport = Number(newInvoice.transportExpenses) || 0;
    const discount = Number(newInvoice.discountAmount) || 0;
    const finalTotal = subTotal + transport - discount;
    
    const time = new Date().toLocaleTimeString('ar-SA');
    const currencySymbol = selectedCurrencyType === 'primary' ? (settings?.currencySymbol || 'ل.س') : (settings?.secondaryCurrencySymbol || '$');
    
    const invoice: PurchaseInvoice = {
      ...newInvoice as PurchaseInvoice,
      id: editingId || crypto.randomUUID(),
      time: editingId ? (newInvoice.time || time) : time,
      totalAmount: finalTotal,
      currencySymbol: currencySymbol,
      transportExpenses: transport,
      discountAmount: discount
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
      statement: `شراء من المورد: ${invoice.supplierName}`,
      notes: i.notes
    }));
    localStorage.setItem('sheno_stock_entries', JSON.stringify([...stockMoves, ...stockEntries]));

    // تسجيل الحركات في اليومية
    const savedCash = localStorage.getItem('sheno_cash_journal');
    let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
    const isPrimary = selectedCurrencyType === 'primary';

    // 1. حركة دفع ثمن المشتريات (الواصل)
    if (invoice.paidAmount > 0) {
      cashEntries.unshift({
        id: crypto.randomUUID(), date: invoice.date,
        statement: `دفعة مقابل فاتورة مشتريات رقم ${invoice.invoiceNumber} - المورد: ${invoice.supplierName}`,
        receivedSYP: 0, 
        paidSYP: isPrimary ? invoice.paidAmount : 0, 
        receivedUSD: 0, 
        paidUSD: !isPrimary ? invoice.paidAmount : 0,
        notes: invoice.notes, type: 'شراء'
      });
    }

    // 2. حركة تسجيل مصاريف النقل (تُدفع عادة من الصندوق)
    if (transport > 0) {
      cashEntries.unshift({
        id: crypto.randomUUID(), date: invoice.date,
        statement: `مصاريف نقل مشتريات للفاتورة رقم ${invoice.invoiceNumber} - المورد: ${invoice.supplierName}`,
        receivedSYP: 0,
        paidSYP: isPrimary ? transport : 0,
        receivedUSD: 0,
        paidUSD: !isPrimary ? transport : 0,
        notes: 'مصاريف نقل بضاعة', type: 'دفع'
      });
    }

    // 3. حركة الحسم المكتسب (يقلل من مديونية المورد)
    if (discount > 0) {
        // لا تسجل كحركة نقدية خارجة بل كتعديل دائن للمورد، لكن في هذا النظام المبسط نسجلها كأثر معاكس
        // أو نتركها لتظهر في كشف حساب المورد فقط من الفاتورة. 
        // سنضيف ملاحظة في اليومية لبيان الحسم.
    }

    localStorage.setItem('sheno_cash_journal', JSON.stringify(cashEntries));

    setIsAdding(false);
    setEditingId(null);
    setNewInvoice({ invoiceNumber: '', supplierName: '', date: new Date().toISOString().split('T')[0], items: [], notes: '', paidAmount: 0, transportExpenses: 0, discountAmount: 0 });
  };

  const subTotal = (newInvoice.items || []).reduce((s, i) => s + i.total, 0);
  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(itemSearch.toLowerCase()) || 
    i.code.toLowerCase().includes(itemSearch.toLowerCase())
  );

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
         <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
               <h3 className="text-xl font-black text-amber-600 flex items-center gap-2">
                  <Truck className="w-6 h-6" /> {editingId ? 'تعديل فاتورة توريد' : 'إنشاء فاتورة توريد جديدة'}
               </h3>
               <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-zinc-400 hover:text-rose-500 transition-all"><X className="w-6 h-6"/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">المورد</label>
                  <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.supplierName} onChange={e => setNewInvoice({...newInvoice, supplierName: e.target.value})}>
                    <option value="">-- اختر مورد --</option>
                    {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم الفاتورة</label>
                  <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.invoiceNumber} onChange={e => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})} placeholder="رقم الفاتورة..." />
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">العملة</label>
                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 h-[52px]">
                      <button onClick={() => setSelectedCurrencyType('primary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'primary' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500'}`}>{settings?.currencySymbol || 'ل.س'}</button>
                      <button onClick={() => setSelectedCurrencyType('secondary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'secondary' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>{settings?.secondaryCurrencySymbol || '$'}</button>
                  </div>
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">تاريخ التوريد</label>
                  <input type="date" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} />
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-primary font-black uppercase tracking-widest mr-1">مصاريف النقل (+)</label>
                  <input type="number" className="bg-primary/5 dark:bg-primary/10 p-3 rounded-2xl border border-primary/20 font-black text-primary outline-none text-xl" value={newInvoice.transportExpenses} onChange={e => setNewInvoice({...newInvoice, transportExpenses: Number(e.target.value)})} />
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-rose-500 font-black uppercase tracking-widest mr-1">الحسم المكتسب (-)</label>
                  <input type="number" className="bg-rose-50 dark:bg-rose-900/10 p-3 rounded-2xl border border-rose-200 dark:border-rose-900 outline-none font-black text-rose-500 text-xl" value={newInvoice.discountAmount} onChange={e => setNewInvoice({...newInvoice, discountAmount: Number(e.target.value)})} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">المدفوع نقداً</label>
                   <input type="number" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-black text-emerald-500 outline-none text-xl" value={newInvoice.paidAmount} onChange={e => setNewInvoice({...newInvoice, paidAmount: Number(e.target.value)})} />
                </div>
                <div className="flex flex-col gap-1 md:col-span-3">
                   <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">ملاحظات الفاتورة</label>
                   <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.notes} onChange={e => setNewInvoice({...newInvoice, notes: e.target.value})} placeholder="أضف أي ملاحظات إضافية هنا..." />
                </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border dark:border-zinc-700 space-y-6 shadow-inner">
               <h4 className="text-sm font-black text-amber-600 flex items-center gap-2 border-b pb-2 uppercase tracking-widest"><ShoppingBag className="w-4 h-4" /> إضافة بنود الفاتورة</h4>
               
               <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* Item Selection/Name */}
                  <div className="md:col-span-3 relative">
                     <label className="text-[9px] font-black text-zinc-400 mb-1 block">اسم المادة (جديدة أو من المخزن)</label>
                     <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                           type="text" 
                           placeholder="ابحث أو اكتب مادة جديدة..." 
                           className="bg-white dark:bg-zinc-950 p-3 pr-10 rounded-xl border-2 dark:border-zinc-700 font-bold outline-none w-full focus:border-amber-500 transition-all text-sm" 
                           value={itemSearch} 
                           onFocus={() => setShowItemResults(true)}
                           onChange={e => {
                              setItemSearch(e.target.value);
                              setNewItem({...newItem, name: e.target.value});
                              setShowItemResults(true);
                           }} 
                        />
                        {showItemResults && itemSearch.length > 0 && (
                           <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto">
                              {filteredInventory.length === 0 ? (
                                 <div className="p-3 text-center text-[10px] text-zinc-400 italic">مادة جديدة غير مسجلة</div>
                              ) : (
                                 filteredInventory.map(item => (
                                    <div 
                                       key={item.id} 
                                       onClick={() => handleSelectItem(item)}
                                       className="p-3 border-b dark:border-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-900/10 cursor-pointer flex justify-between items-center group transition-colors"
                                    >
                                       <span className="font-bold text-xs group-hover:text-amber-600">{item.name}</span>
                                       <span className="text-[10px] text-zinc-400 font-mono">#{item.code}</span>
                                    </div>
                                 ))
                              )}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-1">
                     <label className="text-[9px] font-black text-zinc-400 mb-1 block">الكمية</label>
                     <input type="number" placeholder="كمية" className="bg-white dark:bg-zinc-950 p-3 rounded-xl border-2 dark:border-zinc-700 text-center font-black text-emerald-500 w-full" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                  </div>

                  {/* Unit */}
                  <div className="md:col-span-2">
                     <label className="text-[9px] font-black text-zinc-400 mb-1 block">نوع الوحدة</label>
                     <div className="flex gap-1">
                        <select className="bg-white dark:bg-zinc-950 p-3 rounded-xl border-2 dark:border-zinc-700 font-bold outline-none flex-1 text-xs" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value, isCustomUnit: e.target.value === 'CUSTOM'})}>
                           <option value="قطعة">قطعة</option>
                           <option value="كيلو">كيلو</option>
                           <option value="متر">متر</option>
                           <option value="طرد">طرد</option>
                           <option value="كرتونة">كرتونة</option>
                           <option value="CUSTOM">-- وحدة مخصصة --</option>
                        </select>
                        {newItem.isCustomUnit && (
                           <input 
                              type="text" 
                              placeholder="الوحدة..." 
                              className="w-20 bg-white dark:bg-zinc-950 p-3 rounded-xl border-2 border-amber-300 dark:border-amber-900 font-bold text-xs outline-none"
                              value={newItem.customUnit}
                              onChange={e => setNewItem({...newItem, customUnit: e.target.value})}
                           />
                        )}
                     </div>
                  </div>

                  {/* Price */}
                  <div className="md:col-span-2">
                     <label className="text-[9px] font-black text-zinc-400 mb-1 block">سعر الوحدة</label>
                     <input type="number" placeholder="سعر" className="bg-white dark:bg-zinc-950 p-3 rounded-xl border-2 dark:border-zinc-700 text-center font-black text-amber-500 w-full" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
                  </div>

                  {/* Item Notes */}
                  <div className="md:col-span-3">
                     <label className="text-[9px] font-black text-zinc-400 mb-1 block">ملاحظات البند</label>
                     <div className="relative">
                        <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input type="text" placeholder="مواصفات إضافية..." className="bg-white dark:bg-zinc-950 p-3 pr-10 rounded-xl border-2 dark:border-zinc-700 font-bold outline-none w-full text-xs" value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})} />
                     </div>
                  </div>

                  {/* Add Button */}
                  <div className="md:col-span-1">
                     <button onClick={handleAddItem} className="bg-amber-600 text-white w-full h-[46px] rounded-xl shadow-lg font-black hover:bg-amber-500 transition-all">إضافة</button>
                  </div>
               </div>

               <div className="overflow-x-auto bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-700">
                  <table className="w-full text-right border-collapse">
                     <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800 text-[10px] text-zinc-500 font-black uppercase border-b h-10">
                           <th className="p-3">المادة</th>
                           <th className="p-3 text-center">الوحدة</th>
                           <th className="p-3 text-center">الكمية</th>
                           <th className="p-3 text-center">السعر</th>
                           <th className="p-3 text-center">المجموع</th>
                           <th className="p-3 text-right">ملاحظات البند</th>
                           <th className="p-3 w-16"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y dark:divide-zinc-800 font-bold">
                        {newInvoice.items?.map((item, idx) => (
                           <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="p-3">
                                 <div className="flex flex-col">
                                    <span className="font-bold text-sm text-readable">{item.name}</span>
                                    <span className="text-[9px] text-zinc-400 font-mono">#{item.code}</span>
                                 </div>
                              </td>
                              <td className="p-3 text-center font-bold text-zinc-500 text-xs">{item.unit}</td>
                              <td className="p-3 text-center font-mono font-black text-emerald-600">{item.quantity.toLocaleString()}</td>
                              <td className="p-3 text-center font-mono text-zinc-600">{item.price.toLocaleString()}</td>
                              <td className="p-3 text-center font-mono font-black text-amber-600">{(item.quantity * item.price).toLocaleString()}</td>
                              <td className="p-3 text-right text-[10px] text-zinc-400 italic truncate max-w-[200px] font-normal">{item.notes || '-'}</td>
                              <td className="p-3 text-center">
                                 <button onClick={() => setNewInvoice({...newInvoice, items: newInvoice.items?.filter(i => i.id !== item.id)})} className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                              </td>
                           </tr>
                        ))}
                        {/* عرض مصاريف النقل والحسم في الجدول كبنود إضافية */}
                        {newInvoice.transportExpenses && newInvoice.transportExpenses > 0 && (
                          <tr className="bg-primary/5 dark:bg-primary/10 italic">
                             <td className="p-3 font-black text-primary flex items-center gap-2"><Truck className="w-4 h-4" /> مصاريف نقل مشتريات</td>
                             <td className="p-3 text-center text-[10px] text-zinc-400">خدمة</td>
                             <td className="p-3 text-center font-mono">1</td>
                             <td className="p-3 text-center font-mono">{newInvoice.transportExpenses.toLocaleString()}</td>
                             <td className="p-3 text-center font-mono font-black text-primary">{newInvoice.transportExpenses.toLocaleString()}</td>
                             <td className="p-3"></td>
                             <td className="p-3"></td>
                          </tr>
                        )}
                        {newInvoice.discountAmount && newInvoice.discountAmount > 0 && (
                          <tr className="bg-rose-50 dark:bg-rose-900/10 italic">
                             <td className="p-3 font-black text-rose-600 flex items-center gap-2"><Percent className="w-4 h-4" /> حسم مكتسب من المورد</td>
                             <td className="p-3 text-center text-[10px] text-zinc-400">حسم</td>
                             <td className="p-3 text-center font-mono">1</td>
                             <td className="p-3 text-center font-mono text-rose-600">-{newInvoice.discountAmount.toLocaleString()}</td>
                             <td className="p-3 text-center font-mono font-black text-rose-600">-{newInvoice.discountAmount.toLocaleString()}</td>
                             <td className="p-3"></td>
                             <td className="p-3"></td>
                          </tr>
                        )}
                        {(!newInvoice.items || newInvoice.items.length === 0) && (
                           <tr><td colSpan={7} className="p-10 text-center text-zinc-300 font-bold text-xs italic">قم بإضافة مواد للفاتورة من الأعلى</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* ملخص الحسابات قبل الحفظ */}
            <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
               <div className="flex gap-10">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">إجمالي البنود</span>
                     <span className="text-2xl font-mono font-black text-white">{subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">مصاريف نقل</span>
                     <span className="text-2xl font-mono font-black text-primary">+{ (newInvoice.transportExpenses || 0).toLocaleString() }</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">الحسم</span>
                     <span className="text-2xl font-mono font-black text-rose-500">-{ (newInvoice.discountAmount || 0).toLocaleString() }</span>
                  </div>
                  <div className="w-px h-12 bg-zinc-800"></div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">الصافي النهائي</span>
                     <span className="text-4xl font-mono font-black text-amber-500">{ (subTotal + (newInvoice.transportExpenses || 0) - (newInvoice.discountAmount || 0)).toLocaleString() }</span>
                  </div>
               </div>
               <div className="flex justify-end gap-3">
                  <button onClick={handleSave} className="bg-amber-600 text-white px-16 py-4 rounded-2xl font-black shadow-2xl hover:brightness-110 flex items-center gap-3 active:scale-95 transition-all text-xl">
                     <Save className="w-6 h-6" /> {editingId ? 'حفظ التعديلات' : 'تثبيت وحفظ الفاتورة'}
                  </button>
                  <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-800 dark:bg-zinc-800 text-zinc-400 px-10 py-4 rounded-2xl font-bold hover:text-white transition-all">إلغاء</button>
               </div>
            </div>
         </div>
       )}

       <div className="bg-zinc-950 rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
             <table className="w-full text-right border-collapse text-[11px]">
                <thead>
                   <tr className="bg-zinc-900 text-white font-black h-14 border-b border-zinc-800 uppercase tracking-widest">
                      <th className="p-4 border-l border-zinc-800 text-center w-24">رقم الفاتورة</th>
                      <th className="p-4 border-l border-zinc-800 text-center w-32">التاريخ</th>
                      <th className="p-4 border-l border-zinc-800">المورد</th>
                      <th className="p-4 border-l border-zinc-800">الأصناف والتفاصيل</th>
                      <th className="p-4 border-l border-zinc-800 text-center w-20">نقل</th>
                      <th className="p-4 border-l border-zinc-800 text-center w-20">حسم</th>
                      <th className="p-4 border-l border-zinc-800 text-center w-24">العملة</th>
                      <th className="p-4 border-l border-zinc-800 text-center w-32 font-black text-base bg-amber-900/20">إجمالي الشراء</th>
                      <th className="p-4 border-l border-zinc-800 text-center w-32 text-rose-500">الواصل نقداً</th>
                      <th className="p-4 text-center w-32 no-print">إجراءات</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-bold text-zinc-300">
                   {purchases.map(p => (
                      <tr key={p.id} className="hover:bg-zinc-900/50 transition-colors h-14">
                         <td className="p-4 border-l border-zinc-900 text-center text-amber-500 font-black">#{p.invoiceNumber}</td>
                         <td className="p-4 border-l border-zinc-900 text-center font-mono text-zinc-500">{p.date}</td>
                         <td className="p-4 border-l border-zinc-900 text-white font-black">{p.supplierName}</td>
                         <td className="p-4 border-l border-zinc-900">
                            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                               {p.items.map((it, i) => (
                                 <div key={i} className="bg-amber-900/20 text-amber-500 px-2 py-0.5 rounded-sm text-[9px] border border-amber-900/30 flex items-center gap-2">
                                    <span>{it.name} ({it.quantity} {it.unit})</span>
                                    {it.notes && <span className="opacity-40 italic">[{it.notes.slice(0,10)}...]</span>}
                                 </div>
                               ))}
                            </div>
                         </td>
                         <td className="p-4 border-l border-zinc-900 text-center text-primary font-mono">{p.transportExpenses?.toLocaleString() || '0'}</td>
                         <td className="p-4 border-l border-zinc-900 text-center text-rose-500 font-mono">{p.discountAmount?.toLocaleString() || '0'}</td>
                         <td className="p-4 border-l border-zinc-900 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${p.currencySymbol === '$' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' : 'text-zinc-400 border-zinc-800 bg-zinc-900'}`}>
                               {p.currencySymbol || settings?.currencySymbol}
                            </span>
                         </td>
                         <td className="p-4 border-l border-zinc-900 text-center font-mono text-white text-lg bg-amber-900/5">{p.totalAmount.toLocaleString()}</td>
                         <td className="p-4 border-l border-zinc-900 text-center font-mono text-rose-500 text-lg">{p.paidAmount?.toLocaleString() || '0'}</td>
                         <td className="p-4 text-center no-print">
                            <div className="flex justify-center gap-2">
                               <button onClick={() => handleEdit(p)} className="p-2 text-zinc-500 hover:text-amber-500 transition-all bg-zinc-900 border border-zinc-800 rounded-xl" title="تعديل"><Edit2 className="w-4 h-4" /></button>
                               <button onClick={() => handleDelete(p.id, p.invoiceNumber)} className="p-2 text-zinc-500 hover:text-rose-500 transition-all bg-zinc-900 border border-zinc-800 rounded-xl" title="حذف"><Trash2 className="w-4 h-4" /></button>
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
