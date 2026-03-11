
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Plus, Trash2, Edit2, Save, X, Box, Clock, FileDown, User, Hash, HardDrive, ScrollText, Image as ImageIcon, CreditCard, Coins, Upload, Search, Filter, Calendar, Package, ChevronDown, Check, Landmark, Percent } from 'lucide-react';
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

  const getPrefix = () => {
    const activeId = localStorage.getItem('sheno_active_company_id') || 'default';
    return activeId === 'default' ? 'sheno' : `sheno_${activeId}`;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialResults, setShowMaterialResults] = useState(false);

  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null);

  const [newInvoice, setNewInvoice] = useState<Partial<SalesInvoice>>({
    invoiceNumber: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    usedMaterials: [],
    notes: '',
    paidAmount: 0,
    discountAmount: 0,
    paymentType: 'نقداً',
    cashAccount: 'الصندوق'
  });

  const [manualItem, setManualItem] = useState({ name: '', quantity: 1, price: 0, serialNumber: '', image: '' });
  const [usedMaterial, setUsedMaterial] = useState({ code: '', name: '', quantity: 1 });

  const loadData = () => {
    const prefix = getPrefix();
    const savedInv = localStorage.getItem(`${prefix}_sales_invoices`);
    const savedParties = localStorage.getItem(`${prefix}_parties`);
    const savedInventory = localStorage.getItem(`${prefix}_inventory_list`);
    const savedEntries = localStorage.getItem(`${prefix}_stock_entries`);
    const savedSettings = localStorage.getItem(`${prefix}_settings`);

    if (savedInv) setInvoices(JSON.parse(savedInv));
    if (savedParties) {
       const allParties = JSON.parse(savedParties);
       setParties(allParties.filter((p: Party) => p.type === PartyType.CUSTOMER || p.type === PartyType.BOTH));
    }

    if (savedInventory) {
       try {
          const baseItems: InventoryItem[] = JSON.parse(savedInventory);
          const entries: StockEntry[] = savedEntries ? JSON.parse(savedEntries) : [];
          const updatedInventory = baseItems.map(item => {
            const itemEntries = entries.filter(e => e.itemCode === item.code);
            const added = itemEntries.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
            const issued = itemEntries.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
            const returned = itemEntries.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
            return { 
               ...item, 
               currentBalance: (Number(item.openingStock) || 0) + added - issued + returned 
            };
          });
          setInventory(updatedInventory);
       } catch (err) {
          console.error("Error calculating inventory balances", err);
       }
    }
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  };

  useEffect(() => {
    loadData();
    if (initialInvoice && !editingId) {
      const prefix = getPrefix();
      setEditingId(initialInvoice.id);
      setNewInvoice(initialInvoice);
      setIsAdding(true);
      const s = JSON.parse(localStorage.getItem(`${prefix}_settings`) || '{}');
      if (initialInvoice.currencySymbol === s.secondaryCurrencySymbol) {
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

  const handleAddOrUpdateItem = () => {
    if(!manualItem.name) return;
    
    const item: InvoiceItem = { 
      id: editingItemIndex !== null ? (newInvoice.items![editingItemIndex].id) : crypto.randomUUID(), 
      code: 'ITEM', 
      name: manualItem.name, 
      quantity: manualItem.quantity, 
      price: manualItem.price, 
      unit: 'قطعة', 
      total: manualItem.quantity * manualItem.price, 
      date: newInvoice.date!, 
      notes: '', 
      image: manualItem.image 
    };

    if (editingItemIndex !== null) {
      const updatedItems = [...(newInvoice.items || [])];
      updatedItems[editingItemIndex] = item;
      setNewInvoice({ ...newInvoice, items: updatedItems });
      setEditingItemIndex(null);
    } else {
      setNewInvoice({ ...newInvoice, items: [...(newInvoice.items || []), item] });
    }
    
    setManualItem({ name: '', quantity: 1, price: 0, serialNumber: '', image: '' });
  };

  const startEditItem = (idx: number) => {
    const item = newInvoice.items![idx];
    setManualItem({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      serialNumber: item.serialNumber || '',
      image: item.image || ''
    });
    setEditingItemIndex(idx);
    
    const inputArea = document.getElementById('item-input-area');
    if (inputArea) {
      inputArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleAddOrUpdateUsedMaterial = () => {
    if (!usedMaterial.code) {
      alert("يرجى اختيار مادة من القائمة");
      return;
    }
    const mat = inventory.find(i => i.code === usedMaterial.code);
    if (!mat) return;
    
    const item = { 
      id: editingMaterialIndex !== null ? (newInvoice.usedMaterials![editingMaterialIndex].id) : crypto.randomUUID(), 
      code: mat.code, 
      name: mat.name, 
      quantity: usedMaterial.quantity, 
      unit: mat.unit 
    };

    if (editingMaterialIndex !== null) {
      const updatedMats = [...(newInvoice.usedMaterials || [])];
      updatedMats[editingMaterialIndex] = item as any;
      setNewInvoice({ ...newInvoice, usedMaterials: updatedMats });
      setEditingMaterialIndex(null);
    } else {
      setNewInvoice({ ...newInvoice, usedMaterials: [...(newInvoice.usedMaterials || []), item] });
    }

    setUsedMaterial({ code: '', name: '', quantity: 1 });
    setMaterialSearch('');
  };

  const startEditMaterial = (idx: number) => {
    const mat = newInvoice.usedMaterials![idx];
    setUsedMaterial({
      code: mat.code,
      name: mat.name,
      quantity: mat.quantity
    });
    setMaterialSearch(mat.name);
    setEditingMaterialIndex(idx);
    
    const matInputArea = document.getElementById('material-input-area');
    if (matInputArea) {
      matInputArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSaveInvoice = () => {
    if (!newInvoice.customerName || (newInvoice.items || []).length === 0) {
      alert('يرجى اختيار العميل وإضافة بند واحد على الأقل');
      return;
    }

    const itemsTotal = (newInvoice.items || []).reduce((sum, item) => sum + item.total, 0);
    const discount = Number(newInvoice.discountAmount) || 0;
    const finalTotal = itemsTotal - discount;
    
    const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const invNum = newInvoice.invoiceNumber || (invoices.length + 3000).toString();
    const currencyName = selectedCurrencyType === 'primary' ? (settings?.currency || 'ليرة سورية') : (settings?.secondaryCurrency || 'دولار');
    const currencySymbol = selectedCurrencyType === 'primary' ? (settings?.currencySymbol || 'ل.س') : (settings?.secondaryCurrencySymbol || '$');

    const invoice: SalesInvoice = {
      ...newInvoice as SalesInvoice,
      id: editingId || crypto.randomUUID(),
      invoiceNumber: invNum,
      time: editingId ? (newInvoice.time || time) : time,
      totalAmount: finalTotal,
      paidAmount: newInvoice.paymentType === 'نقداً' ? finalTotal : (newInvoice.paidAmount || 0),
      currencySymbol: currencySymbol,
      totalAmountLiteral: tafqeet(finalTotal, currencyName)
    };

    const prefix = getPrefix();

    // 1. تحديث حركات المخزون
    const savedStock = localStorage.getItem(`${prefix}_stock_entries`);
    let stockEntries: StockEntry[] = savedStock ? JSON.parse(savedStock) : [];
    if (editingId) {
      const oldInvoice = invoices.find(i => i.id === editingId);
      if (oldInvoice) {
        stockEntries = stockEntries.filter(e => e.invoiceNumber !== oldInvoice.invoiceNumber);
      }
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

    localStorage.setItem(`${prefix}_stock_entries`, JSON.stringify([...usedStockMoves, ...stockEntries]));

    // 2. تحديث المالية (دفتر القيود) - المصدر الوحيد للحقيقة
    const savedCash = localStorage.getItem(`${prefix}_cash_journal`);
    let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
    
    // عكس القيود القديمة في حال التعديل
    if (editingId) {
      const oldInvoice = invoices.find(i => i.id === editingId);
      if (oldInvoice) {
        cashEntries = cashEntries.filter(e => e.voucherNumber !== oldInvoice.invoiceNumber);
      }
    }

    const isPrimary = selectedCurrencyType === 'primary';
    const isCash = invoice.paymentType === 'نقداً';
    const netAmount = itemsTotal - discount;

    if (isCash) {
      // قيد مبيعات نقدية: من حـ/ الصندوق إلى حـ/ المبيعات
      // 1. طرف المبيعات (دائن)
      cashEntries.unshift({
        id: crypto.randomUUID(),
        date: invoice.date,
        statement: `مبيعات نقدية فاتورة #${invoice.invoiceNumber}`,
        receivedSYP: isPrimary ? netAmount : 0,
        paidSYP: 0,
        receivedUSD: !isPrimary ? netAmount : 0,
        paidUSD: 0,
        type: 'بيع',
        voucherNumber: invoice.invoiceNumber,
        linkedAccountCode: '41',
        linkedAccountId: '41'
      });
      // 2. طرف الصندوق (مدين)
      cashEntries.unshift({
        id: crypto.randomUUID(),
        date: invoice.date,
        statement: `مبيعات نقدية فاتورة #${invoice.invoiceNumber}`,
        receivedSYP: isPrimary ? netAmount : 0,
        paidSYP: 0,
        receivedUSD: !isPrimary ? netAmount : 0,
        paidUSD: 0,
        type: 'بيع',
        voucherNumber: invoice.invoiceNumber,
        cashAccount: invoice.cashAccount || 'الصندوق'
      });
    } else {
      // قيد مبيعات آجلة: من حـ/ الزبون إلى حـ/ المبيعات
      // 1. طرف المبيعات (دائن)
      cashEntries.unshift({
        id: crypto.randomUUID(),
        date: invoice.date,
        statement: `مبيعات آجلة فاتورة #${invoice.invoiceNumber}`,
        receivedSYP: isPrimary ? itemsTotal : 0,
        paidSYP: 0,
        receivedUSD: !isPrimary ? itemsTotal : 0,
        paidUSD: 0,
        type: 'بيع',
        voucherNumber: invoice.invoiceNumber,
        linkedAccountCode: '41',
        linkedAccountId: '41'
      });
      // 2. طرف الزبون (مدين)
      cashEntries.unshift({
        id: crypto.randomUUID(),
        date: invoice.date,
        statement: `مبيعات آجلة فاتورة #${invoice.invoiceNumber}`,
        receivedSYP: 0,
        paidSYP: isPrimary ? itemsTotal : 0,
        receivedUSD: 0,
        paidUSD: !isPrimary ? itemsTotal : 0,
        partyName: invoice.customerName,
        type: 'بيع',
        voucherNumber: invoice.invoiceNumber
      });

      // ج. قيد الحسم الممنوح (حساب 43) - مدين (إذا وجد)
      if (discount > 0) {
        // 1. طرف الحسم (مدين)
        cashEntries.unshift({
          id: crypto.randomUUID(),
          date: invoice.date,
          statement: `حسم ممنوح فاتورة #${invoice.invoiceNumber}`,
          receivedSYP: 0,
          paidSYP: isPrimary ? discount : 0,
          receivedUSD: 0,
          paidUSD: !isPrimary ? discount : 0,
          type: 'حسم',
          voucherNumber: invoice.invoiceNumber,
          linkedAccountCode: '43',
          linkedAccountId: '43'
        });
        // 2. طرف الزبون (دائن)
        cashEntries.unshift({
          id: crypto.randomUUID(),
          date: invoice.date,
          statement: `حسم ممنوح فاتورة #${invoice.invoiceNumber} (تخفيض رصيد)`,
          receivedSYP: isPrimary ? discount : 0,
          paidSYP: 0,
          receivedUSD: !isPrimary ? discount : 0,
          paidUSD: 0,
          partyName: invoice.customerName,
          type: 'حسم',
          voucherNumber: invoice.invoiceNumber
        });
      }

      // د. قيد الدفعة النقدية (تسوية دفعة)
      if (invoice.paidAmount && invoice.paidAmount > 0) {
        // 1. طرف الزبون (دائن)
        cashEntries.unshift({
          id: crypto.randomUUID(),
          date: invoice.date,
          statement: `دفعة من فاتورة مبيعات رقم ${invoice.invoiceNumber}`,
          receivedSYP: isPrimary ? invoice.paidAmount : 0,
          paidSYP: 0,
          receivedUSD: !isPrimary ? invoice.paidAmount : 0,
          paidUSD: 0,
          partyName: invoice.customerName,
          type: 'قبض',
          voucherNumber: invoice.invoiceNumber
        });
        // 2. طرف الصندوق (مدين)
        cashEntries.unshift({
          id: crypto.randomUUID(),
          date: invoice.date,
          statement: `دفعة من فاتورة مبيعات رقم ${invoice.invoiceNumber}`,
          receivedSYP: isPrimary ? invoice.paidAmount : 0,
          paidSYP: 0,
          receivedUSD: !isPrimary ? invoice.paidAmount : 0,
          paidUSD: 0,
          type: 'قبض',
          voucherNumber: invoice.invoiceNumber,
          cashAccount: invoice.cashAccount || 'الصندوق'
        });
      }
    }

    localStorage.setItem(`${prefix}_cash_journal`, JSON.stringify(cashEntries));

    const updated = editingId ? invoices.map(i => i.id === editingId ? invoice : i) : [invoice, ...invoices];
    setInvoices(updated);
    localStorage.setItem(`${prefix}_sales_invoices`, JSON.stringify(updated));
    
    setIsAdding(false);
    setEditingId(null);
    setEditingItemIndex(null);
    setEditingMaterialIndex(null);
    setNewInvoice({
      invoiceNumber: '', customerName: '', date: new Date().toISOString().split('T')[0],
      items: [], usedMaterials: [], notes: '', paidAmount: 0, discountAmount: 0, paymentType: 'نقداً', cashAccount: 'الصندوق'
    });
    
    loadData();
    if (initialInvoice) onBack(); 
  };

  const handleDelete = (id: string, invoiceNumber: string) => {
    if (window.confirm('حذف الفاتورة نهائياً؟')) {
      const prefix = getPrefix();
      const invToDelete = invoices.find(i => i.id === id);
      const updated = invoices.filter(i => i.id !== id);
      setInvoices(updated);
      localStorage.setItem(`${prefix}_sales_invoices`, JSON.stringify(updated));
      
      if (invToDelete) {
        const savedStock = localStorage.getItem(`${prefix}_stock_entries`);
        if (savedStock) {
           const stock = JSON.parse(savedStock).filter((e: StockEntry) => e.invoiceNumber !== invToDelete.invoiceNumber);
           localStorage.setItem(`${prefix}_stock_entries`, JSON.stringify(stock));
        }
        const savedCash = localStorage.getItem(`${prefix}_cash_journal`);
        if (savedCash) {
           const cash = JSON.parse(savedCash).filter((e: CashEntry) => e.voucherNumber !== invToDelete.invoiceNumber);
           localStorage.setItem(`${prefix}_cash_journal`, JSON.stringify(cash));
        }
      }
      loadData();
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
    setEditingItemIndex(null);
    setEditingMaterialIndex(null);
    setNewInvoice({
      invoiceNumber: '', customerName: '', date: new Date().toISOString().split('T')[0],
      items: [], usedMaterials: [], notes: '', paidAmount: 0, discountAmount: 0, paymentType: 'نقداً', cashAccount: 'الصندوق'
    });
    if (initialInvoice) onBack();
  };

  const getDynamicBalance = (item: InventoryItem) => {
    const pendingQty = (newInvoice.usedMaterials || [])
      .filter(m => m.code === item.code)
      .reduce((sum, m) => sum + m.quantity, 0);
    return item.currentBalance - pendingQty;
  };

  const filteredInventoryForUsed = inventory.filter(i => 
    (i.name || '').toLowerCase().includes(materialSearch.toLowerCase()) || 
    (i.code || '').toLowerCase().includes(materialSearch.toLowerCase())
  );

  const handleSelectUsedMaterial = (item: InventoryItem) => {
    setUsedMaterial({ ...usedMaterial, code: item.code, name: item.name });
    setMaterialSearch(item.name);
    setShowMaterialResults(false);
  };

  const currentItemsTotal = (newInvoice.items || []).reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      {/* Print Header Ledger Style */}
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

      {previewImage && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 md:p-20 animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-10 right-10 text-white hover:text-rose-500 transition-colors no-print">
            <X className="w-10 h-10" />
          </button>
          <img src={previewImage} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" onClick={(e) => e.stopPropagation()} alt="Full Preview" />
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

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">العميل</label>
              <select className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none text-readable" value={newInvoice.customerName} onChange={e => setNewInvoice({...newInvoice, customerName: e.target.value})}>
                <option value="">-- اختر زبون --</option>
                {parties.map(p => <option key={p.id} value={p.name}>{p.name} {p.type === PartyType.BOTH ? '(مشترك)' : ''}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم الفاتورة</label>
               <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold text-readable" value={newInvoice.invoiceNumber} onChange={e => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})} placeholder="تلقائي" />
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">تاريخ العملية</label>
               <input type="date" className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold text-readable" value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">العملة</label>
               <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 h-[52px]">
                  <button onClick={() => setSelectedCurrencyType('primary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'primary' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500'}`}>{settings?.currencySymbol || '1'}</button>
                  <button onClick={() => setSelectedCurrencyType('secondary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'secondary' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>{settings?.secondaryCurrencySymbol || '$'}</button>
               </div>
            </div>
            
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">طريقة الدفع</label>
               <select 
                 className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none text-readable" 
                 value={newInvoice.paymentType} 
                 onChange={e => setNewInvoice({...newInvoice, paymentType: e.target.value as 'نقداً' | 'آجل'})}
               >
                 <option value="نقداً">نقداً (كاش)</option>
                 <option value="آجل">آجل (على الحساب)</option>
               </select>
            </div>

            {newInvoice.paymentType === 'نقداً' && (
              <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-right-2">
                 <label className="text-[10px] text-primary font-black uppercase tracking-widest mr-1 flex items-center gap-1"><Landmark className="w-3 h-3" /> استلام إلى</label>
                 <select 
                   className="bg-primary/5 border-2 border-primary/20 p-3 rounded-2xl font-black outline-none text-primary" 
                   value={newInvoice.cashAccount} 
                   onChange={e => setNewInvoice({...newInvoice, cashAccount: e.target.value as 'الصندوق' | 'المصرف'})}
                 >
                   <option value="الصندوق">الصندوق الرئيسي</option>
                   <option value="المصرف">حساب المصرف</option>
                 </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-rose-500 font-black uppercase tracking-widest mr-1 flex items-center gap-1"><Percent className="w-3 h-3" /> الحسم الممنوح</label>
               <input type="number" className="bg-rose-50 dark:bg-rose-900/10 p-3 rounded-2xl border border-rose-200 dark:border-rose-900 outline-none font-black text-rose-600 text-xl" value={newInvoice.discountAmount} onChange={e => setNewInvoice({...newInvoice, discountAmount: Number(e.target.value)})} />
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mr-1">المبلغ المدفوع (الواصل)</label>
               <input type="number" className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900 outline-none font-black text-emerald-600 text-xl" value={newInvoice.paidAmount} onChange={e => setNewInvoice({...newInvoice, paidAmount: Number(e.target.value)})} />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">ملاحظات الفاتورة</label>
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
             <div id="item-input-area" className={`bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-[2rem] border-2 space-y-4 shadow-inner transition-all ${editingItemIndex !== null ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
                <h4 className="text-sm font-black text-primary flex items-center justify-end gap-2 pb-2 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">
                   {editingItemIndex !== null ? 'تعديل الصنف المختار' : 'الأصناف المباعة'} <ScrollText className="w-5 h-5" />
                </h4>
                <div className="flex items-center gap-2">
                   <button 
                      onClick={handleAddOrUpdateItem} 
                      className={`p-3 rounded-xl border transition-all ${editingItemIndex !== null ? 'bg-amber-600 border-amber-400 text-white animate-pulse' : 'bg-zinc-800 dark:bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'}`}
                      title={editingItemIndex !== null ? 'تأكيد التحديث' : 'إضافة صنف'}
                   >
                      {editingItemIndex !== null ? <Check className="w-6 h-6"/> : <Plus className="w-6 h-6"/>}
                   </button>
                   <input type="number" placeholder="0" className="w-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center font-black text-emerald-500 outline-none" value={manualItem.quantity} onChange={e => setManualItem({...manualItem, quantity: Number(e.target.value)})} />
                   <input type="number" placeholder="السعر" className="w-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center font-black text-amber-500 outline-none" value={manualItem.price} onChange={e => setManualItem({...manualItem, price: Number(e.target.value)})} />
                   <div className="relative w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center cursor-pointer hover:border-zinc-600 transition-all overflow-hidden shrink-0" onClick={() => manualItem.image && setPreviewImage(manualItem.image)}>
                      {manualItem.image ? <><img src={manualItem.image} className="w-full h-full object-cover" /><button onClick={(e) => { e.stopPropagation(); setManualItem(prev => ({ ...prev, image: '' })); }} className="absolute top-0 right-0 bg-rose-600 text-white p-0.5 rounded-bl shadow-lg hover:bg-rose-500 z-10"><X className="w-3 h-3" /></button></> : <><ImageIcon className="w-5 h-5 text-zinc-600" /><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" /></>}
                   </div>
                   <input type="text" placeholder="اسم الصنف..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-right font-black text-white outline-none focus:border-zinc-600" value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} />
                   {editingItemIndex !== null && (
                      <button onClick={() => { setEditingItemIndex(null); setManualItem({ name: '', quantity: 1, price: 0, serialNumber: '', image: '' }); }} className="p-3 bg-zinc-800 text-zinc-400 rounded-xl hover:text-rose-500" title="إلغاء التعديل"><X className="w-5 h-5"/></button>
                   )}
                </div>
                <div className="space-y-2 mt-4 max-h-40 overflow-y-auto custom-scrollbar">
                   {newInvoice.items?.map((it, idx) => (
                      <div key={it.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${editingItemIndex === idx ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/10' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'}`}>
                         <div className="flex items-center gap-3">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-black ${editingItemIndex === idx ? 'bg-amber-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>#{idx + 1}</span>
                           {it.image && (
                             <img 
                               src={it.image} 
                               className="w-8 h-8 object-cover rounded cursor-zoom-in border border-zinc-200 dark:border-zinc-700" 
                               onClick={() => setPreviewImage(it.image!)} 
                             />
                           )}
                           <span className={`font-bold text-sm ${editingItemIndex === idx ? 'text-amber-700 dark:text-amber-400' : ''}`}>{it.name}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="font-mono text-zinc-500 ml-2">{it.quantity} x {it.price.toLocaleString()}</span>
                            <button onClick={() => startEditItem(idx)} className={`p-1.5 rounded-lg transition-colors ${editingItemIndex === idx ? 'bg-amber-500 text-white' : 'text-amber-500 hover:bg-amber-100'}`}><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => { 
                               setNewInvoice({...newInvoice, items: newInvoice.items?.filter(i => i.id !== it.id)});
                               if(editingItemIndex === idx) { setEditingItemIndex(null); setManualItem({ name: '', quantity: 1, price: 0, serialNumber: '', image: '' }); }
                            }} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div id="material-input-area" className={`p-5 rounded-[2rem] border-2 space-y-4 shadow-inner relative transition-all ${editingMaterialIndex !== null ? 'bg-amber-500/5 border-amber-500' : 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/20'}`}>
                <h4 className="text-sm font-black text-rose-500 flex items-center justify-end gap-2 pb-2 uppercase tracking-widest border-b border-rose-500/10">
                   {editingMaterialIndex !== null ? 'تعديل المادة المستخدمة' : 'المواد المستخدمة (خصم مخزني)'} <HardDrive className="w-5 h-5" />
                </h4>
                
                <div className="space-y-2">
                   <div className="relative">
                      <div className="flex items-center gap-2">
                        <button 
                           onClick={handleAddOrUpdateUsedMaterial} 
                           className={`px-6 py-3 rounded-xl font-black shadow-lg transition-all ${editingMaterialIndex !== null ? 'bg-amber-600 text-white animate-pulse' : 'bg-primary text-white hover:brightness-110 active:scale-95'}`}
                        >
                           {editingMaterialIndex !== null ? <Check className="w-5 h-5"/> : 'خصم'}
                        </button>
                        
                        <input type="number" placeholder="الكمية" className="w-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center font-black text-rose-500 outline-none" value={usedMaterial.quantity} onChange={e => setUsedMaterial({...usedMaterial, quantity: Number(e.target.value)})} />
                        
                        <div className="relative flex-1">
                           <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                           <input 
                             type="text" 
                             placeholder="ابحث باسم المادة أو الكود..." 
                             className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold outline-none focus:border-rose-500 transition-all shadow-sm text-readable"
                             value={materialSearch}
                             onFocus={() => setShowMaterialResults(true)}
                             onChange={e => {
                               setMaterialSearch(e.target.value);
                               setShowMaterialResults(true);
                             }}
                           />
                           {showMaterialResults && materialSearch.length > 0 && (
                             <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto animate-in fade-in zoom-in-95">
                                {filteredInventoryForUsed.length === 0 ? (
                                  <div className="p-4 text-center text-xs text-zinc-400 italic font-bold">لا يوجد نتائج تطابق بحثك</div>
                                ) : (
                                  filteredInventoryForUsed.map(item => {
                                    const activeBalance = getDynamicBalance(item);
                                    return (
                                      <div 
                                        key={item.id} 
                                        onClick={() => handleSelectUsedMaterial(item)}
                                        className="p-3 border-b dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer flex justify-between items-center group transition-colors"
                                      >
                                        <div className="flex flex-col">
                                          <span className="text-[11px] font-black group-hover:text-rose-600">{item.name}</span>
                                          <span className="text-[8px] font-mono text-zinc-400">{item.code}</span>
                                        </div>
                                        <div className="text-left flex flex-col items-end">
                                          <span className={`text-[10px] font-black ${activeBalance <= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{activeBalance} {item.unit}</span>
                                          <span className="text-[7px] text-zinc-400 uppercase font-black">الرصيد المتاح حالياً</span>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                             </div>
                           )}
                        </div>
                        {editingMaterialIndex !== null && (
                          <button onClick={() => { setEditingMaterialIndex(null); setUsedMaterial({ code: '', name: '', quantity: 1 }); setMaterialSearch(''); }} className="p-3 bg-zinc-800 text-zinc-400 rounded-xl hover:text-rose-500" title="إلغاء التعديل"><X className="w-5 h-5"/></button>
                        )}
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 max-h-40 overflow-y-auto">
                   {newInvoice.usedMaterials?.map((m, idx) => (
                      <div key={m.id} className={`border px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm transition-all ${editingMaterialIndex === idx ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white dark:bg-zinc-900 border-rose-200 dark:border-rose-900/50'}`}>
                         <span className={`text-xs font-bold ${editingMaterialIndex === idx ? 'text-amber-700' : 'text-rose-700'}`}>{m.name} ({m.quantity} {m.unit})</span>
                         <button onClick={() => startEditMaterial(idx)} className="text-amber-500 hover:text-amber-700 transition-colors"><Edit2 className="w-3.5 h-3.5"/></button>
                         <button onClick={() => { 
                            setNewInvoice({...newInvoice, usedMaterials: newInvoice.usedMaterials?.filter(x => x.id !== m.id)});
                            if(editingMaterialIndex === idx) { setEditingMaterialIndex(null); setUsedMaterial({ code: '', name: '', quantity: 1 }); setMaterialSearch(''); }
                         }} className="text-rose-300 hover:text-rose-600 transition-colors"><X className="w-3.5 h-3.5"/></button>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
             <div className="flex gap-12">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">إجمالي المواد</span>
                   <span className="text-2xl font-mono font-black text-white">{currentItemsTotal.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">الحسم</span>
                   <span className="text-2xl font-mono font-black text-rose-500">-{ (newInvoice.discountAmount || 0).toLocaleString() }</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">الصافي النهائي</span>
                   <span className="text-4xl font-mono font-black text-primary">{ (currentItemsTotal - (newInvoice.discountAmount || 0)).toLocaleString() }</span>
                </div>
             </div>
             <div className="flex gap-3">
                <button onClick={handleSaveInvoice} className="bg-primary text-white px-16 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 transition-all text-lg flex items-center gap-3"><Save className="w-6 h-6" /> {editingId ? 'تحديث الفاتورة' : 'تثبيت وحفظ الفاتورة'}</button>
                <button onClick={handleCancelEdit} className="bg-zinc-800 text-zinc-400 px-10 py-4 rounded-2xl font-bold hover:text-white transition-all">إلغاء</button>
             </div>
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
                <th className="p-3 border-l border-zinc-800 text-center w-24 text-amber-500 print:border-zinc-300">السعر الإفرادي</th>
                <th className="p-3 border-l border-zinc-800 text-center w-20 text-amber-500 print:border-zinc-300">الدفع</th>
                <th className="p-3 border-l border-zinc-800 text-right w-40 print:border-zinc-300">المواد المستخدمة</th>
                <th className="p-3 border-l border-zinc-800 text-center w-12 print:border-zinc-300">العدد</th>
                <th className="p-3 border-l border-zinc-800 text-center w-24 print:border-zinc-300">إجمالي الصافي</th>
                <th className="p-3 border-l border-zinc-800 text-right w-48 print:border-zinc-300">التفقيط (كتابة)</th>
                <th className="p-3 border-l border-zinc-800 text-right print:border-zinc-300">ملاحظات</th>
                <th className="p-3 border-l border-zinc-800 text-center w-20 no-print">إجراءات</th>
                <th className="p-3 text-center w-20 text-emerald-500 print:text-emerald-700">الواصل</th>
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
                    <div className="flex flex-col gap-0.5 max-h-16 overflow-y-auto">
                      {inv.items.map((it, i) => ( 
                        <div key={i} className="flex items-center gap-1 truncate text-[10px] text-zinc-100 print:text-zinc-900">
                          {it.image && (
                            <img 
                              src={it.image} 
                              className="w-5 h-5 object-cover rounded border border-zinc-800 cursor-zoom-in" 
                              onClick={() => setPreviewImage(it.image!)} 
                            />
                          )}
                          • {it.name} ({it.quantity})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 border-l border-zinc-900 text-center print:border-zinc-200">
                    <div className="flex flex-col gap-0.5 max-h-16 overflow-y-auto">
                      {inv.items.map((it, i) => (
                        <div key={i} className="text-[10px] font-mono text-amber-500">
                          {it.price.toLocaleString()}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 border-l border-zinc-900 text-center print:border-zinc-200">
                    <div className="flex flex-col gap-1 items-center">
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black ${inv.paymentType === 'نقداً' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>{inv.paymentType}</span>
                       {inv.cashAccount && <span className="text-[7px] text-zinc-500 uppercase">{inv.cashAccount}</span>}
                    </div>
                  </td>
                  <td className="p-2 border-l border-zinc-900 print:border-zinc-200">
                    <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                       {inv.usedMaterials?.map((m, i) => ( <span key={i} className="bg-rose-900/30 text-rose-400 px-1 py-0.5 rounded-sm text-[8px] font-black print:bg-zinc-100 print:text-rose-900">{m.name} ({m.quantity})</span> ))}
                    </div>
                  </td>
                  <td className="p-2 border-l border-zinc-900 text-center font-mono text-zinc-100 print:text-zinc-900 print:border-zinc-200">{inv.items.reduce((s,i) => s + i.quantity, 0)}</td>
                  <td className="p-2 border-l border-zinc-900 text-center font-black text-rose-500 font-mono text-sm bg-rose-900/10 print:bg-transparent print:border-zinc-200">
                    <div className="flex flex-col">
                       <span>{inv.totalAmount.toLocaleString()}</span>
                       {inv.discountAmount && inv.discountAmount > 0 && <span className="text-[8px] text-zinc-500 line-through">{(inv.totalAmount + inv.discountAmount).toLocaleString()}</span>}
                    </div>
                  </td>
                  <td className="p-2 border-l border-zinc-900 text-[10px] font-black text-zinc-600 leading-tight print:text-zinc-900 print:border-zinc-200">
                    {inv.totalAmountLiteral}
                  </td>
                  <td className="p-2 border-l border-zinc-900 text-zinc-400 font-bold italic truncate max-w-[100px] print:text-zinc-700 print:border-zinc-200">
                    {inv.notes || '-'}
                  </td>
                  <td className="p-2 border-l border-zinc-900 text-center no-print">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(inv)} className="p-1.5 bg-zinc-900 rounded-lg text-zinc-500 hover:text-amber-500 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(inv.id, inv.invoiceNumber)} className="p-1.5 bg-zinc-900 rounded-lg text-zinc-500 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
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