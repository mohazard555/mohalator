
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Plus, Trash2, Edit2, Save, X, Box, Clock, FileDown, User, Hash, HardDrive, ScrollText, Image as ImageIcon, CreditCard, Coins } from 'lucide-react';
import { SalesInvoice, InvoiceItem, StockEntry, Party, PartyType, InventoryItem, CashEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

// وظيفة التفقيط الديناميكية بناءً على العملة
const tafqeet = (n: number, currencyName: string): string => {
  if (n === 0) return "صفر";
  return `${n.toLocaleString()} ${currencyName} فقط لا غير`;
};

interface SalesInvoiceViewProps {
  onBack: () => void;
}

const SalesInvoiceView: React.FC<SalesInvoiceViewProps> = ({ onBack }) => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const [selectedCurrencyType, setSelectedCurrencyType] = useState<'primary' | 'secondary'>('primary');

  const [newInvoice, setNewInvoice] = useState<Partial<SalesInvoice>>({
    invoiceNumber: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    usedMaterials: [],
    notes: '',
    paidAmount: 0,
    paymentType: 'نقداً'
  });

  const [manualItem, setManualItem] = useState({ 
    name: '', 
    quantity: 1, 
    price: 0, 
    serialNumber: '', 
    image: '' 
  });
  
  const [usedMaterial, setUsedMaterial] = useState({ code: '', name: '', quantity: 1 });

  useEffect(() => {
    const savedInv = localStorage.getItem('sheno_sales_invoices');
    const savedParties = localStorage.getItem('sheno_parties');
    const savedInventory = localStorage.getItem('sheno_inventory_list');
    const savedSettings = localStorage.getItem('sheno_settings');

    if (savedInv) setInvoices(JSON.parse(savedInv));
    if (savedParties) setParties(JSON.parse(savedParties).filter((p: Party) => p.type === PartyType.CUSTOMER));
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualItem(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddManualItem = () => {
    if (!manualItem.name) return;
    const item: InvoiceItem = {
      id: crypto.randomUUID(),
      code: 'ITEM',
      name: manualItem.name,
      quantity: manualItem.quantity,
      price: manualItem.price,
      unit: 'قطعة',
      total: manualItem.quantity * manualItem.price,
      date: newInvoice.date!,
      notes: '',
      image: manualItem.image,
      serialNumber: manualItem.serialNumber
    };
    setNewInvoice({ ...newInvoice, items: [...(newInvoice.items || []), item] });
    setManualItem({ name: '', quantity: 1, price: 0, serialNumber: '', image: '' });
  };

  const handleAddUsedMaterial = () => {
    const mat = inventory.find(i => i.code === usedMaterial.code);
    if (!mat || usedMaterial.quantity <= 0) return;
    const item = { id: crypto.randomUUID(), code: mat.code, name: mat.name, quantity: usedMaterial.quantity, unit: mat.unit };
    setNewInvoice({ ...newInvoice, usedMaterials: [...(newInvoice.usedMaterials || []), item] });
    setUsedMaterial({ code: '', name: '', quantity: 1 });
  };

  const handleSaveInvoice = () => {
    if (!newInvoice.customerName || (newInvoice.items || []).length === 0) {
      alert('يرجى اختيار العميل وإضافة بند واحد على الأقل للفاتورة');
      return;
    }
    
    const total = (newInvoice.items || []).reduce((sum, item) => sum + item.total, 0);
    const time = newInvoice.time || new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const invNum = newInvoice.invoiceNumber || (invoices.length + 3000).toString();

    const currencyName = selectedCurrencyType === 'primary' 
      ? (settings?.currency || 'ليرة سورية') 
      : (settings?.secondaryCurrency || 'دولار');
    
    const currencySymbol = selectedCurrencyType === 'primary' 
      ? (settings?.currencySymbol || 'ل.س') 
      : (settings?.secondaryCurrencySymbol || '$');

    const invoice: SalesInvoice = {
      ...newInvoice as SalesInvoice,
      id: editingId || crypto.randomUUID(),
      invoiceNumber: invNum,
      time,
      totalAmount: total,
      currencySymbol: currencySymbol,
      totalAmountLiteral: tafqeet(total, currencyName)
    };

    if (editingId) {
      const oldInv = invoices.find(i => i.id === editingId);
      if (oldInv) removeAssociatedEntries(oldInv.invoiceNumber);
    }

    const updated = editingId 
      ? invoices.map(i => i.id === editingId ? invoice : i)
      : [invoice, ...invoices];

    setInvoices(updated);
    localStorage.setItem('sheno_sales_invoices', JSON.stringify(updated));

    if (invoice.usedMaterials && invoice.usedMaterials.length > 0) {
      const savedStock = localStorage.getItem('sheno_stock_entries');
      let stock: StockEntry[] = savedStock ? JSON.parse(savedStock) : [];
      const deductions: StockEntry[] = (invoice.usedMaterials as any[]).map(m => ({
        id: crypto.randomUUID(),
        date: invoice.date,
        day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date(invoice.date)),
        department: 'قسم المبيعات',
        itemCode: m.code,
        itemName: m.name,
        unit: m.unit || 'قطعة',
        price: 0,
        warehouse: 'المستودع الرئيسي',
        movementType: 'صرف',
        quantity: m.quantity,
        invoiceNumber: invNum,
        partyName: invoice.customerName,
        statement: `صرف مواد مستخدمة للفاتورة رقم ${invNum} - العميل: ${invoice.customerName}`
      }));
      localStorage.setItem('sheno_stock_entries', JSON.stringify([...deductions, ...stock]));
    }

    if (invoice.paidAmount! > 0) {
      const savedCash = localStorage.getItem('sheno_cash_journal');
      let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
      const isPrimary = selectedCurrencyType === 'primary';
      const cashMove: CashEntry = {
        id: crypto.randomUUID(),
        date: invoice.date,
        statement: `مقبوضات فاتورة مبيعات ${invNum} (${invoice.paymentType}) - العميل: ${invoice.customerName}`,
        receivedSYP: isPrimary ? invoice.paidAmount! : 0,
        paidSYP: 0,
        receivedUSD: !isPrimary ? invoice.paidAmount! : 0,
        paidUSD: 0,
        notes: invoice.notes,
        type: 'بيع'
      };
      localStorage.setItem('sheno_cash_journal', JSON.stringify([cashMove, ...cashEntries]));
    }

    setIsAdding(false);
    setEditingId(null);
    setNewInvoice({ invoiceNumber: '', customerName: '', date: new Date().toISOString().split('T')[0], items: [], usedMaterials: [], notes: '', paidAmount: 0, paymentType: 'نقداً' });
  };

  const removeAssociatedEntries = (invNum: string) => {
    const savedStock = localStorage.getItem('sheno_stock_entries');
    if (savedStock) {
      const stock: StockEntry[] = JSON.parse(savedStock);
      localStorage.setItem('sheno_stock_entries', JSON.stringify(stock.filter(s => s.invoiceNumber !== invNum)));
    }
    const savedCash = localStorage.getItem('sheno_cash_journal');
    if (savedCash) {
      const cash: CashEntry[] = JSON.parse(savedCash);
      localStorage.setItem('sheno_cash_journal', JSON.stringify(cash.filter(c => !c.statement.includes(`مبيعات ${invNum}`))));
    }
  };

  const handleEdit = (inv: SalesInvoice) => {
    setNewInvoice(inv);
    setEditingId(inv.id);
    setIsAdding(true);
    setSelectedCurrencyType(inv.currencySymbol === '$' ? 'secondary' : 'primary');
  };

  const handleDelete = (id: string, invNum: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      const updated = invoices.filter(i => i.id !== id);
      setInvoices(updated);
      localStorage.setItem('sheno_sales_invoices', JSON.stringify(updated));
      removeAssociatedEntries(invNum);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">{editingId ? 'تعديل فاتورة مبيعات' : 'فواتير المبيعات المتطورة'}</h2>
        </div>
        <div className="flex gap-2">
          {!isAdding && (
            <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
              <Plus className="w-5 h-5" /> فاتورة مبيعات جديدة
            </button>
          )}
          <button onClick={() => exportToCSV(invoices, 'sales_report')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-8 animate-in zoom-in-95 no-print">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="flex flex-col gap-1 md:col-span-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">العميل</label>
              <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.customerName} onChange={e => setNewInvoice({...newInvoice, customerName: e.target.value})}>
                <option value="">-- اختر زبون --</option>
                {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم الفاتورة</label>
               <input type="text" placeholder="تلقائي" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={newInvoice.invoiceNumber} onChange={e => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">عملة الفاتورة</label>
               <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 h-[52px]">
                  <button onClick={() => setSelectedCurrencyType('primary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'primary' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500'}`}>{settings?.currencySymbol || '1'}</button>
                  <button onClick={() => setSelectedCurrencyType('secondary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'secondary' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>{settings?.secondaryCurrencySymbol || '2'}</button>
               </div>
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">طريقة الدفع</label>
               <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.paymentType} onChange={e => setNewInvoice({...newInvoice, paymentType: e.target.value as any})}>
                  <option value="نقداً">نقداً (كاش)</option>
                  <option value="آجل">آجل (ذمم)</option>
               </select>
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">تاريخ العملية</label>
               <input type="date" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">المبلغ المدفوع</label>
               <input type="number" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-black text-emerald-500" value={newInvoice.paidAmount} onChange={e => setNewInvoice({...newInvoice, paidAmount: Number(e.target.value)})} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                <h4 className="text-sm font-black text-primary flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 uppercase tracking-widest">
                   <ScrollText className="w-4 h-4" /> الأصناف المباعة (للفاتورة فقط)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                   <input type="text" placeholder="اسم الصنف..." className="md:col-span-2 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} />
                   <input type="text" placeholder="S/N" className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono text-xs outline-none" value={manualItem.serialNumber} onChange={e => setManualItem({...manualItem, serialNumber: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                   <div className="flex gap-2">
                      <input type="number" placeholder="الكمية" className="w-20 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center font-bold" value={manualItem.quantity} onChange={e => setManualItem({...manualItem, quantity: Number(e.target.value)})} />
                      <input type="number" placeholder="السعر" className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center font-bold text-emerald-600" value={manualItem.price} onChange={e => setManualItem({...manualItem, price: Number(e.target.value)})} />
                   </div>
                   <div className="relative group cursor-pointer flex items-center justify-center border-2 border-dashed border-zinc-300 rounded-xl p-2 bg-white dark:bg-zinc-900 hover:border-primary transition-all">
                      {manualItem.image ? (
                        <img src={manualItem.image} className="h-10 w-auto object-contain rounded" />
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold"><ImageIcon className="w-4 h-4"/> صورة</div>
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
                   </div>
                   <button onClick={handleAddManualItem} className="bg-zinc-800 text-white p-3 rounded-xl shadow-lg hover:bg-zinc-700 transition-all font-bold flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> إضافة صنف
                   </button>
                </div>
             </div>

             <div className="bg-rose-500/5 dark:bg-rose-500/10 p-6 rounded-3xl border border-rose-500/20 space-y-4">
                <h4 className="text-sm font-black text-rose-600 flex items-center gap-2 border-b border-rose-500/20 pb-2 uppercase tracking-widest">
                   <HardDrive className="w-4 h-4" /> المواد المستخدمة (تخصم من المخزون)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <select className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={usedMaterial.code} onChange={e => {
                      const mat = inventory.find(i => i.code === e.target.value);
                      setUsedMaterial({ ...usedMaterial, code: e.target.value, name: mat?.name || '' });
                   }}>
                      <option value="">-- اختر مادة مخزنية --</option>
                      {inventory.map(i => <option key={i.id} value={i.code}>{i.name} (رصيد: {i.currentBalance})</option>)}
                   </select>
                   <div className="flex gap-2">
                      <input type="number" placeholder="الكمية" className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center font-bold" value={usedMaterial.quantity} onChange={e => setUsedMaterial({...usedMaterial, quantity: Number(e.target.value)})} />
                      <button onClick={handleAddUsedMaterial} className="bg-rose-600 text-white p-3 rounded-xl shadow-lg hover:bg-rose-500 transition-all font-bold">خصم مادة</button>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-zinc-100 dark:border-zinc-800 gap-6">
             <div className="text-primary font-black text-xl bg-primary/5 px-8 py-3 rounded-2xl border border-primary/20 w-full md:w-auto text-center flex items-center gap-3">
                <CreditCard className="w-6 h-6" />
                <span>{tafqeet(newInvoice.items?.reduce((s,i) => s + i.total, 0) || 0, selectedCurrencyType === 'primary' ? (settings?.currency || 'ليرة سورية') : (settings?.secondaryCurrency || 'دولار'))}</span>
             </div>
             <div className="flex gap-3 w-full md:w-auto">
               <button onClick={handleSaveInvoice} className="flex-1 md:flex-none bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 active:scale-95 flex items-center justify-center gap-2">
                 <Save className="w-5 h-5" /> {editingId ? 'تعديل الفاتورة' : 'حفظ الفاتورة والخصم من المستودع'}
               </button>
               <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-10 py-3 rounded-2xl font-bold">إلغاء</button>
             </div>
          </div>
        </div>
      )}

      {/* Table Section - Updated to match image structure */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-[10px]">
            <thead>
              <tr className="bg-zinc-900 text-white font-black border-b border-zinc-700 h-14 uppercase tracking-tighter">
                <th className="p-2 border-l border-zinc-800 text-center w-12">تسلسل</th>
                <th className="p-2 border-l border-zinc-800 text-center w-16">رقم</th>
                <th className="p-2 border-l border-zinc-800 text-center w-20">تاريخ</th>
                <th className="p-2 border-l border-zinc-800 text-center">العميل</th>
                <th className="p-2 border-l border-zinc-800 text-right w-48">تفاصيل الأصناف</th>
                <th className="p-2 border-l border-zinc-800 text-right w-40">المواد المستخدمة</th>
                <th className="p-2 border-l border-zinc-800 text-center w-12">العدد</th>
                <th className="p-2 border-l border-zinc-800 text-center w-20">السعر الإفرادي</th>
                <th className="p-2 border-l border-zinc-800 text-center w-24">الإجمالي</th>
                <th className="p-2 border-l border-zinc-800 text-right w-48">التفقيط (كتابة)</th>
                <th className="p-2 border-l border-zinc-800 text-right">ملاحظات</th>
                <th className="p-2 border-l border-zinc-800 text-center w-16">وقت</th>
                <th className="p-2 border-l border-zinc-800 text-center w-20 no-print">إجراءات</th>
                <th className="p-2 text-center w-20">المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
              {invoices.map((inv, idx) => (
                <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group h-12">
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-400">{invoices.length - idx}</td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center text-primary">#{inv.invoiceNumber}</td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-[9px]">{inv.date}</td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-readable truncate max-w-[100px]">{inv.customerName}</td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col gap-0.5 max-h-12 overflow-y-auto">
                      {inv.items.map((it, i) => (
                        <span key={i} className="truncate">{it.name}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                       {inv.usedMaterials?.map((m, i) => (
                         <span key={i} className="bg-rose-500/10 text-rose-600 px-1 py-0.5 rounded-sm text-[8px]">{m.name}</span>
                       ))}
                    </div>
                  </td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono">{inv.items.reduce((s,i) => s + i.quantity, 0)}</td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-400">{inv.items[0]?.price.toLocaleString()}</td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-black text-rose-600 font-mono text-sm bg-rose-50/30 print:bg-transparent">
                    {inv.totalAmount.toLocaleString()}
                  </td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-[8px] font-normal text-zinc-500 leading-tight">
                    {inv.totalAmountLiteral}
                  </td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-zinc-400 font-normal italic truncate max-w-[100px]" title={inv.notes}>
                    {inv.notes || '-'}
                  </td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-[8px] text-zinc-400">
                    {inv.time}
                  </td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center no-print">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => window.print()} className="p-1 text-zinc-400 hover:text-primary transition-all"><Printer className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleEdit(inv)} className="p-1 text-zinc-400 hover:text-amber-500 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(inv.id, inv.invoiceNumber)} className="p-1 text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                  <td className="p-2 text-center text-emerald-600 font-mono text-xs">
                    {inv.paidAmount?.toLocaleString() || '0'}
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

export default SalesInvoiceView;
