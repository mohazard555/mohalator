
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Plus, Trash2, Edit2, Save, X, Box, Clock, FileDown, User, Hash, HardDrive, ScrollText, Image as ImageIcon, CreditCard, Coins, Upload, Search, Filter, Calendar, Package, ChevronDown, Check } from 'lucide-react';
import { SalesInvoice, InvoiceItem, StockEntry, Party, PartyType, InventoryItem, CashEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';
import { tafqeet } from '../utils/tafqeet';

interface SalesInvoiceViewProps {
  onBack: () => void;
  initialInvoice?: SalesInvoice;
}

const SalesInvoiceView: React.FC<SalesInvoiceViewProps> = ({ onBack, initialInvoice }) => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedCurrencyType, setSelectedCurrencyType] = useState<'primary' | 'secondary'>('primary');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const [manualItem, setManualItem] = useState({ name: '', quantity: 1, price: 0, serialNumber: '', image: '' });
  const [usedMaterial, setUsedMaterial] = useState({ code: '', name: '', quantity: 1 });

  // Load Initial Data
  useEffect(() => {
    const savedInv = localStorage.getItem('sheno_sales_invoices');
    const savedParties = localStorage.getItem('sheno_parties');
    const savedInventory = localStorage.getItem('sheno_inventory_list');
    const savedEntries = localStorage.getItem('sheno_stock_entries');
    const savedSettings = localStorage.getItem('sheno_settings');

    if (savedInv) setInvoices(JSON.parse(savedInv));
    if (savedParties) {
       const allParties = JSON.parse(savedParties);
       setParties(allParties.filter((p: Party) => p.type === PartyType.CUSTOMER || p.type === PartyType.BOTH));
    }

    if (savedInventory) {
       const baseItems: InventoryItem[] = JSON.parse(savedInventory);
       const entries: StockEntry[] = savedEntries ? JSON.parse(savedEntries) : [];
       const updatedInventory = baseItems.map(item => {
         const itemEntries = entries.filter(e => e.itemCode === item.code);
         const added = itemEntries.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
         const issued = itemEntries.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
         const returned = itemEntries.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
         return { ...item, currentBalance: (item.openingStock || 0) + added - issued + returned };
       });
       setInventory(updatedInventory);
    }
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    // Handle Edit Mode from props once
    if (initialInvoice && !editingId) {
      setEditingId(initialInvoice.id);
      setNewInvoice(initialInvoice);
      setIsAdding(true);
      if (initialInvoice.currencySymbol === (JSON.parse(savedSettings || '{}').secondaryCurrencySymbol)) {
         setSelectedCurrencyType('secondary');
      }
    }
  }, [initialInvoice]);

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

  const handleEdit = (inv: SalesInvoice) => {
    setEditingId(inv.id);
    setNewInvoice(inv);
    setIsAdding(true);
    if (inv.currencySymbol === settings?.secondaryCurrencySymbol) setSelectedCurrencyType('secondary');
    else setSelectedCurrencyType('primary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveInvoice = () => {
    if (!newInvoice.customerName || (newInvoice.items || []).length === 0) {
      alert('يرجى اختيار العميل وإضافة بند واحد على الأقل');
      return;
    }
    const total = (newInvoice.items || []).reduce((sum, item) => sum + item.total, 0);
    const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const invNum = newInvoice.invoiceNumber || (invoices.length + 3000).toString();
    const currencyName = selectedCurrencyType === 'primary' ? (settings?.currency || 'ليرة سورية') : (settings?.secondaryCurrency || 'دولار');
    const currencySymbol = selectedCurrencyType === 'primary' ? (settings?.currencySymbol || 'ل.س') : (settings?.secondaryCurrencySymbol || '$');

    const invoice: SalesInvoice = {
      ...newInvoice as SalesInvoice,
      id: editingId || crypto.randomUUID(),
      invoiceNumber: invNum,
      time: editingId ? (newInvoice.time || time) : time,
      totalAmount: total,
      currencySymbol: currencySymbol,
      totalAmountLiteral: tafqeet(total, currencyName)
    };

    const savedStock = localStorage.getItem('sheno_stock_entries');
    let stockEntries: StockEntry[] = savedStock ? JSON.parse(savedStock) : [];
    
    if (editingId) {
      stockEntries = stockEntries.filter(e => e.invoiceNumber !== invoice.invoiceNumber);
    }

    const usedStockMoves: StockEntry[] = (invoice.usedMaterials || []).map(m => ({
      id: crypto.randomUUID(),
      date: invoice.date,
      day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date(invoice.date)),
      department: 'مبيعات (مواد مستخدمة)',
      itemCode: m.code,
      itemName: m.name,
      unit: m.unit || 'قطعة',
      price: 0,
      warehouse: 'المستودع الرئيسي',
      movementType: 'صرف',
      quantity: m.quantity,
      invoiceNumber: invoice.invoiceNumber,
      partyName: invoice.customerName,
      statement: `مواد مستخدمة في الفاتورة رقم ${invoice.invoiceNumber}`,
      notes: invoice.notes
    }));

    localStorage.setItem('sheno_stock_entries', JSON.stringify([...usedStockMoves, ...stockEntries]));

    const updated = editingId ? invoices.map(i => i.id === editingId ? invoice : i) : [invoice, ...invoices];
    setInvoices(updated);
    localStorage.setItem('sheno_sales_invoices', JSON.stringify(updated));
    
    // Reset and Close
    setIsAdding(false);
    setEditingId(null);
    setNewInvoice({
      invoiceNumber: '', customerName: '', date: new Date().toISOString().split('T')[0],
      items: [], usedMaterials: [], notes: '', paidAmount: 0, paymentType: 'نقداً'
    });
    
    if (initialInvoice) onBack(); 
  };

  const handleDelete = (id: string) => {
    if (window.confirm('حذف الفاتورة نهائياً؟')) {
      const invToDelete = invoices.find(i => i.id === id);
      const updated = invoices.filter(i => i.id !== id);
      setInvoices(updated);
      localStorage.setItem('sheno_sales_invoices', JSON.stringify(updated));
      
      if (invToDelete) {
        const savedStock = localStorage.getItem('sheno_stock_entries');
        if (savedStock) {
           const stock = JSON.parse(savedStock).filter((e: StockEntry) => e.invoiceNumber !== invToDelete.invoiceNumber);
           localStorage.setItem('sheno_stock_entries', JSON.stringify(stock));
        }
      }
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       inv.invoiceNumber.includes(searchTerm) ||
                       inv.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
    let matchItems = true;
    if (selectedItems.length > 0) {
      const invoiceAllItems = [...inv.items.map(it => it.name), ...(inv.usedMaterials?.map(m => m.name) || [])];
      matchItems = selectedItems.some(selected => invoiceAllItems.includes(selected));
    }
    return matchSearch && matchDate && matchItems;
  });

  const toggleItemSelection = (name: string) => {
    setSelectedItems(prev => prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]);
  };

  const handleCancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewInvoice({
      invoiceNumber: '', customerName: '', date: new Date().toISOString().split('T')[0],
      items: [], usedMaterials: [], notes: '', paidAmount: 0, paymentType: 'نقداً'
    });
    if (initialInvoice) onBack();
  };

  return (
    <div className="space-y-6">
      {/* Print Header Ledger Style - Enhanced with Period Filter */}
      <div className="print-only print-header flex justify-between items-center bg-white p-6 rounded-t-xl text-zinc-900 mb-0 border-b-4 border-primary">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg border border-zinc-100" />}
          <div>
            <h1 className="text-2xl font-black">{settings?.companyName}</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{settings?.companyType}</p>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black underline decoration-zinc-200 underline-offset-8">سجل مبيعات المنشأة المفلتر</h2>
          
          {/* Filter Range Display for Print */}
          <div className="flex flex-col items-center gap-1">
             <span className="text-[9px] font-black text-primary uppercase tracking-widest">فترة التقرير المفلترة</span>
             <div className="bg-zinc-50 border border-zinc-200 px-6 py-1 rounded-full flex items-center gap-3">
                <span className="font-mono font-black text-xs">{startDate || 'البداية'}</span>
                <span className="text-zinc-300 font-bold">←</span>
                <span className="font-mono font-black text-xs">{endDate || 'اليوم'}</span>
             </div>
          </div>

          <p className="text-[9px] mt-3 font-bold flex items-center justify-center gap-1 opacity-50"><Calendar className="w-3 h-3"/> تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        <div className="text-left text-xs font-bold text-zinc-500 space-y-1">
          <p className="flex items-center justify-end gap-1">{settings?.address} <Box className="w-3 h-3 opacity-30"/></p>
          <p className="flex items-center justify-end gap-1" dir="ltr">{settings?.phone}</p>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 md:p-20 animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-10 right-10 text-white hover:text-rose-500 transition-colors no-print">
            <X className="w-10 h-10" />
          </button>
          <img 
            src={previewImage} 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" 
            onClick={(e) => e.stopPropagation()} 
            alt="Full Preview"
          />
        </div>
      )}

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">فواتير المبيعات الذكية</h2>
        </div>
        <div className="flex gap-2">
          {!isAdding && (
            <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
              <Plus className="w-5 h-5" /> فاتورة مبيعات جديدة
            </button>
          )}
          <button onClick={() => window.print()} className="bg-zinc-100 dark:bg-zinc-800 text-readable px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-zinc-200">
             <Printer className="w-5 h-5" /> طباعة السجل المفلتر
          </button>
          <button onClick={() => exportToCSV(filteredInvoices, 'sales_report')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-8 animate-in zoom-in-95 no-print text-readable">
          <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h3 className="text-xl font-black text-primary flex items-center gap-2">
              {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingId ? 'تعديل فاتورة مبيعات' : 'إنشاء فاتورة مبيعات جديدة'}
            </h3>
            <button onClick={handleCancelEdit} className="text-zinc-400 hover:text-rose-500 transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">العميل</label>
              <select className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none text-readable" value={newInvoice.customerName} onChange={e => setNewInvoice({...newInvoice, customerName: e.target.value})}>
                <option value="">-- اختر زبون --</option>
                {parties.map(p => <option key={p.id} value={p.name}>{p.name} {p.type === PartyType.BOTH ? '(مشترك)' : ''}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم الفاتورة</label>
               <input type="text" className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold text-readable" value={newInvoice.invoiceNumber} onChange={e => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})} placeholder="تلقائي" />
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">العملة</label>
               <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 h-[52px]">
                  <button onClick={() => setSelectedCurrencyType('primary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'primary' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500'}`}>{settings?.currencySymbol || '1'}</button>
                  <button onClick={() => setSelectedCurrencyType('secondary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'secondary' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>{settings?.secondaryCurrencySymbol || '2'}</button>
               </div>
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">تاريخ العملية</label>
               <input type="date" className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold text-readable" value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">المبلغ المدفوع</label>
               <input type="number" className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-black text-emerald-500 text-xl" value={newInvoice.paidAmount} onChange={e => setNewInvoice({...newInvoice, paidAmount: Number(e.target.value)})} />
            </div>

            <div className="flex flex-col gap-1 md:col-span-5">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">ملاحظات الفاتورة العامة</label>
               <input 
                 type="text" 
                 className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold text-readable focus:border-primary transition-all"
                 value={newInvoice.notes}
                 onChange={e => setNewInvoice({...newInvoice, notes: e.target.value})}
                 placeholder="أضف أي ملاحظات إضافية هنا..."
               />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-inner">
                <h4 className="text-sm font-black text-primary flex items-center justify-end gap-2 pb-2 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">الأصناف المباعة <ScrollText className="w-5 h-5" /></h4>
                <div className="flex items-center gap-2">
                   <button onClick={() => {
                      if(!manualItem.name) return;
                      const item: InvoiceItem = { id: crypto.randomUUID(), code: 'ITEM', name: manualItem.name, quantity: manualItem.quantity, price: manualItem.price, unit: 'قطعة', total: manualItem.quantity * manualItem.price, date: newInvoice.date!, notes: '', image: manualItem.image };
                      setNewInvoice({ ...newInvoice, items: [...(newInvoice.items || []), item] });
                      setManualItem({ name: '', quantity: 1, price: 0, serialNumber: '', image: '' });
                   }} className="bg-zinc-800 dark:bg-zinc-900 text-zinc-400 p-3 rounded-xl border border-zinc-700 hover:text-white transition-all"><Plus className="w-6 h-6"/></button>
                   <input type="number" placeholder="0" className="w-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center font-black text-emerald-500 outline-none" value={manualItem.quantity} onChange={e => setManualItem({...manualItem, quantity: Number(e.target.value)})} />
                   <input type="number" placeholder="السعر" className="w-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center font-black text-amber-500 outline-none" value={manualItem.price} onChange={e => setManualItem({...manualItem, price: Number(e.target.value)})} />
                   <div className="relative w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center cursor-pointer hover:border-zinc-600 transition-all overflow-hidden shrink-0" onClick={() => manualItem.image && setPreviewImage(manualItem.image)}>
                      {manualItem.image ? <><img src={manualItem.image} className="w-full h-full object-cover" /><button onClick={(e) => { e.stopPropagation(); setManualItem(prev => ({ ...prev, image: '' })); }} className="absolute top-0 right-0 bg-rose-600 text-white p-0.5 rounded-bl shadow-lg hover:bg-rose-500 z-10"><X className="w-3 h-3" /></button></> : <><ImageIcon className="w-5 h-5 text-zinc-600" /><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" /></>}
                   </div>
                   <input type="text" placeholder="اسم الصنف..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-right font-black text-white outline-none focus:border-zinc-600" value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} />
                </div>
                <div className="space-y-2 mt-4 max-h-40 overflow-y-auto custom-scrollbar">
                   {newInvoice.items?.map((it, idx) => (
                      <div key={it.id} className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                         <div className="flex items-center gap-3">
                           <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-black">#{idx + 1}</span>
                           {it.image && (
                             <img 
                               src={it.image} 
                               className="w-8 h-8 object-cover rounded cursor-zoom-in border border-zinc-200 dark:border-zinc-700" 
                               onClick={() => setPreviewImage(it.image!)} 
                             />
                           )}
                           <span className="font-bold text-sm">{it.name}</span>
                         </div>
                         <div className="flex items-center gap-4"><span className="font-mono text-zinc-500">{it.quantity} x {it.price.toLocaleString()}</span><button onClick={() => setNewInvoice({...newInvoice, items: newInvoice.items?.filter(i => i.id !== it.id)})} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="bg-rose-500/5 dark:bg-rose-950/20 p-5 rounded-[2rem] border border-rose-500/20 space-y-4 shadow-inner">
                <h4 className="text-sm font-black text-rose-500 flex items-center justify-end gap-2 pb-2 uppercase tracking-widest border-b border-rose-500/10">المواد المستخدمة (خصم مخزني) <HardDrive className="w-5 h-5" /></h4>
                <div className="flex items-center gap-2">
                   <button onClick={() => {
                      const mat = inventory.find(i => i.code === usedMaterial.code);
                      if (!mat) return;
                      const item = { id: crypto.randomUUID(), code: mat.code, name: mat.name, quantity: usedMaterial.quantity, unit: mat.unit };
                      setNewInvoice({ ...newInvoice, usedMaterials: [...(newInvoice.usedMaterials || []), item] });
                      setUsedMaterial({ code: '', name: '', quantity: 1 });
                   }} className="bg-primary text-white px-6 py-3 rounded-xl font-black shadow-lg hover:brightness-110 active:scale-95 transition-all">خصم</button>
                   <input type="number" placeholder="الكمية" className="w-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center font-black text-rose-500 outline-none" value={usedMaterial.quantity} onChange={e => setUsedMaterial({...usedMaterial, quantity: Number(e.target.value)})} />
                   <select className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-right font-black text-white outline-none appearance-none" value={usedMaterial.code} onChange={e => {
                      const mat = inventory.find(i => i.code === e.target.value);
                      setUsedMaterial({ ...usedMaterial, code: e.target.value, name: mat?.name || '' });
                   }}>
                      <option value="">-- اختر مادة مخزنية --</option>
                      {inventory.map(i => <option key={i.id} value={i.code}>{i.name} (رصيد متاح: {i.currentBalance})</option>)}
                   </select>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                   {newInvoice.usedMaterials?.map(m => (
                      <div key={m.id} className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 px-3 py-1.5 rounded-xl flex items-center gap-2">
                         <span className="text-xs font-bold text-rose-700">{m.name} ({m.quantity})</span>
                         <button onClick={() => setNewInvoice({...newInvoice, usedMaterials: newInvoice.usedMaterials?.filter(x => x.id !== m.id)})} className="text-rose-300 hover:text-rose-600 transition-colors"><X className="w-3 h-3"/></button>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
             <button onClick={handleSaveInvoice} className="bg-primary text-white px-16 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 transition-all text-lg">{editingId ? 'تحديث الفاتورة' : 'تثبيت وحفظ الفاتورة'}</button>
             <button onClick={handleCancelEdit} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-10 py-4 rounded-2xl font-bold">إلغاء</button>
          </div>
        </div>
      )}

      {/* Advanced Filter Bar */}
      <div className="bg-zinc-900/90 dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 shadow-2xl space-y-4 no-print">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] flex flex-col gap-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase mr-1 tracking-widest">بحث نصي (فاتورة، عميل، صنف)</label>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="ابحث برقم الفاتورة، العميل، أو الصنف..." 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pr-12 outline-none font-bold text-white focus:border-rose-900 transition-all shadow-inner" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className="flex-1 min-w-[200px] flex flex-col gap-1 relative">
            <label className="text-[10px] font-black text-zinc-500 uppercase mr-1 tracking-widest">تحديد أصناف معينة للتحليل</label>
            <button 
              onClick={() => setShowItemDropdown(!showItemDropdown)} 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-6 flex items-center justify-between font-black text-white hover:bg-zinc-900 transition-all overflow-hidden shadow-inner"
            >
              <div className="flex items-center gap-2 truncate">
                <Package className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="truncate text-lg">
                  {selectedItems.length > 0 ? `تم اختيار (${selectedItems.length}) أصناف` : 'جميع المواد'}
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${showItemDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showItemDropdown && (
              <div className="absolute top-full right-0 left-0 mt-3 bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-50 max-h-64 overflow-y-auto p-3 animate-in zoom-in-95">
                <button 
                  onClick={() => { setSelectedItems([]); setShowItemDropdown(false); }} 
                  className="w-full text-center p-2 text-[11px] font-black text-rose-500 border-b border-zinc-800 mb-2 hover:bg-rose-900/10 rounded-xl transition-colors uppercase tracking-widest"
                >
                  إعادة تعيين (عرض الكل)
                </button>
                {inventory.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => toggleItemSelection(item.name)} 
                    className={`flex items-center justify-between p-3 mb-1 rounded-xl cursor-pointer transition-all ${selectedItems.includes(item.name) ? 'bg-primary text-white shadow-lg' : 'hover:bg-zinc-800 text-zinc-400'}`}
                  >
                    <span className="font-black text-sm">{item.name}</span>
                    {selectedItems.includes(item.name) && <Check className="w-4 h-4" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 bg-zinc-950 px-6 py-2.5 rounded-2xl border border-zinc-800 h-[54px] shadow-inner">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">من</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-white focus:text-primary transition-colors" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إلى</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none text-white focus:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)] print:border-zinc-300 print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-[10px]">
            <thead>
              <tr className="bg-zinc-900 text-white font-black border-b border-zinc-800 h-16 uppercase tracking-tighter shadow-md print:bg-zinc-100 print:text-zinc-900 print:border-zinc-300">
                <th className="p-3 border-l border-zinc-800 text-center w-12 text-zinc-400 print:border-zinc-300">تسلسل</th>
                <th className="p-3 border-l border-zinc-800 text-center w-16 text-rose-500 print:border-zinc-300">رقم</th>
                <th className="p-3 border-l border-zinc-800 text-center w-20 print:border-zinc-300">تاريخ</th>
                <th className="p-3 border-l border-zinc-800 text-center print:border-zinc-300">العميل</th>
                <th className="p-3 border-l border-zinc-800 text-right w-48 print:border-zinc-300">الأصناف</th>
                <th className="p-3 border-l border-zinc-800 text-center w-20 text-amber-500 print:border-zinc-300">سعر الوحدة</th>
                <th className="p-3 border-l border-zinc-800 text-right w-40 print:border-zinc-300">المواد المستخدمة</th>
                <th className="p-3 border-l border-zinc-800 text-center w-12 print:border-zinc-300">العدد</th>
                <th className="p-3 border-l border-zinc-800 text-center w-24 print:border-zinc-300">الإجمالي</th>
                <th className="p-3 border-l border-zinc-800 text-right w-48 print:border-zinc-300">التفقيط (كتابة)</th>
                <th className="p-3 border-l border-zinc-800 text-right print:border-zinc-300">ملاحظات</th>
                <th className="p-3 border-l border-zinc-800 text-center w-20 no-print">إجراءات</th>
                <th className="p-3 text-center w-20 text-emerald-500 print:text-emerald-700">المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-bold bg-zinc-950 text-zinc-300 print:bg-white print:text-zinc-900 print:divide-zinc-200">
              {filteredInvoices.map((inv, idx) => (
                <tr key={inv.id} className="hover:bg-zinc-900 transition-colors h-14 print:hover:bg-white">
                  <td className="p-2 border-l border-zinc-900 text-center font-mono text-zinc-500 print:border-zinc-200">{filteredInvoices.length - idx}</td>
                  <td className="p-2 border-l border-zinc-900 text-center text-rose-500 font-black print:border-zinc-200">#{inv.invoiceNumber}</td>
                  <td className="p-2 border-l border-zinc-900 text-center font-mono text-zinc-400 print:border-zinc-200">{inv.date}</td>
                  <td className="p-2 border-l border-zinc-900 text-zinc-100 truncate max-w-[100px] print:text-zinc-900 print:border-zinc-200">{inv.customerName}</td>
                  <td className="p-2 border-l border-zinc-900 print:border-zinc-200">
                    <div className="flex flex-col gap-0.5 max-h-12 overflow-y-auto">
                      {inv.items.map((it, i) => ( 
                        <div key={i} className="flex items-center gap-1 truncate text-[10px] text-zinc-100 print:text-zinc-900">
                          • {it.name} ({it.quantity})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 border-l border-zinc-900 text-center font-mono text-amber-500 print:border-zinc-200">
                    {inv.items.length === 1 ? inv.items[0].price.toLocaleString() : <span className="text-[8px] text-zinc-500 uppercase">متعدد</span>}
                  </td>
                  <td className="p-2 border-l border-zinc-900 print:border-zinc-200">
                    <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                       {inv.usedMaterials?.map((m, i) => ( <span key={i} className="bg-rose-900/30 text-rose-400 px-1 py-0.5 rounded-sm text-[8px] font-black print:bg-zinc-100 print:text-rose-900">{m.name} ({m.quantity})</span> ))}
                    </div>
                  </td>
                  <td className="p-2 border-l border-zinc-900 text-center font-mono text-zinc-100 print:text-zinc-900 print:border-zinc-200">{inv.items.reduce((s,i) => s + i.quantity, 0)}</td>
                  <td className="p-2 border-l border-zinc-900 text-center font-black text-rose-500 font-mono text-sm bg-rose-900/10 print:bg-transparent print:border-zinc-200">
                    {inv.totalAmount.toLocaleString()}
                  </td>
                  <td className="p-2 border-l border-zinc-900 text-[10px] font-black text-zinc-400 leading-tight print:text-zinc-900 print:border-zinc-200">
                    {inv.totalAmountLiteral}
                  </td>
                  <td className="p-2 border-l border-zinc-900 text-zinc-400 font-bold italic truncate max-w-[100px] print:text-zinc-700 print:border-zinc-200">
                    {inv.notes || '-'}
                  </td>
                  <td className="p-2 border-l border-zinc-900 text-center no-print">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(inv)} className="p-1.5 bg-zinc-900 rounded-lg text-zinc-500 hover:text-amber-500 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(inv.id)} className="p-1.5 bg-zinc-900 rounded-lg text-zinc-500 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                  <td className="p-2 text-center text-emerald-500 font-mono text-xs font-black print:text-emerald-700">
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
