
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Plus, Package, X, Save, Search, Check, 
  ChevronRight, ChevronLeft, Printer, Eye, Trash2, Edit2, 
  RotateCcw, LayoutList, Calendar, Warehouse, Coins, Hash, ChevronDown, Info, FileText, AlertCircle
} from 'lucide-react';
import { PeriodicInventory, InventoryItem, StockEntry, AppSettings, WarehouseEntity } from '../types';
import PeriodicInventoryManager from './PeriodicInventoryManager';

interface PeriodicInventoryViewProps {
  onBack: () => void;
}

interface InventoryRow {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
  unit: string;
}

const PeriodicInventoryView: React.FC<PeriodicInventoryViewProps> = ({ onBack }) => {
  const [inventories, setInventories] = useState<PeriodicInventory[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseEntity[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const [viewMode, setViewMode] = useState<'LIST' | 'ENTRY' | 'PREVIEW'>('LIST');
  const [previewData, setPreviewData] = useState<PeriodicInventory | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // بيانات الترويسة (Header)
  const [headerData, setHeaderData] = useState({
    date: new Date().toISOString().split('T')[0],
    warehouse: '',
    statement: 'جرد بضاعة أول المدة',
    currency: 'ليرة سورية',
    details: ''
  });

  // بيانات الجدول
  const [rows, setRows] = useState<InventoryRow[]>(
    Array.from({ length: 15 }, () => ({
      id: crypto.randomUUID(),
      itemCode: '',
      itemName: '',
      quantity: 0,
      price: 0,
      total: 0,
      unit: ''
    }))
  );

  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const sInv = localStorage.getItem('sheno_periodic_inventories');
    const sList = localStorage.getItem('sheno_inventory_list');
    const sWh = localStorage.getItem('sheno_warehouses');
    const sSett = localStorage.getItem('sheno_settings');
    const sStock = localStorage.getItem('sheno_stock_entries');
    
    // التأكد من وجود المستودع الرئيسي
    let loadedWarehouses: WarehouseEntity[] = sWh ? JSON.parse(sWh) : [];
    if (loadedWarehouses.length === 0) {
      loadedWarehouses = [{ id: '1', name: 'المستودع الرئيسي', location: 'المركز', isMain: true }];
      localStorage.setItem('sheno_warehouses', JSON.stringify(loadedWarehouses));
    }
    setWarehouses(loadedWarehouses);

    // ضبط المستودع الافتراضي في الترويسة
    if (!headerData.warehouse) {
      const mainWh = loadedWarehouses.find(w => w.isMain) || loadedWarehouses[0];
      setHeaderData(prev => ({ ...prev, warehouse: mainWh?.name || '' }));
    }

    if (sInv) setInventories(JSON.parse(sInv));
    if (sList) setInventoryList(JSON.parse(sList));
    if (sSett) setSettings(JSON.parse(sSett));
    if (sStock) setStockEntries(JSON.parse(sStock));
  };

  const updateRow = (id: string, field: keyof InventoryRow, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updatedRow.total = (Number(updatedRow.quantity) || 0) * (Number(updatedRow.price) || 0);
        }
        return updatedRow;
      }
      return row;
    }));
  };

  const handleSelectItem = (id: string, item: InventoryItem) => {
    updateRow(id, 'itemCode', item.code);
    updateRow(id, 'itemName', item.name);
    updateRow(id, 'price', item.price);
    updateRow(id, 'unit', item.unit);
    setActiveRowId(null);
    setItemSearch('');
  };

  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

  const handleSaveJard = () => {
    const validItems = rows.filter(r => r.itemCode && r.quantity > 0);
    if (validItems.length === 0) {
      alert('يرجى إدخل مادة واحدة على الأقل بكمية صحيحة');
      return;
    }

    const returnId = editingId || crypto.randomUUID();

    // 1. كائن الجرد للتقارير الختامية
    const newJard: PeriodicInventory = {
      id: returnId,
      date: headerData.date,
      type: 'OPENING',
      items: validItems.map(r => ({
        itemCode: r.itemCode,
        itemName: r.itemName,
        quantity: r.quantity,
        price: r.price,
        total: r.total,
        unit: r.unit
      })),
      totalValue: grandTotal,
      notes: headerData.statement || 'بضاعة أول المدة'
    };

    // 2. تحديث قائمة الجرد الدوري
    let updatedInventories;
    if (editingId) {
      updatedInventories = inventories.map(inv => inv.id === editingId ? newJard : inv);
    } else {
      updatedInventories = [newJard, ...inventories];
    }
    localStorage.setItem('sheno_periodic_inventories', JSON.stringify(updatedInventories));

    // 3. ترحيل الحركات المخزنية (لتحديث أرصدة المواد)
    const savedStock = localStorage.getItem('sheno_stock_entries');
    let currentStockEntries: StockEntry[] = savedStock ? JSON.parse(savedStock) : [];
    
    // حذف الحركات القديمة المرتبطة بهذا الجرد إذا كنا في وضع التعديل
    if (editingId) {
      currentStockEntries = currentStockEntries.filter(e => e.movementCode !== editingId);
    }

    const openingStockMovements: StockEntry[] = validItems.map(item => ({
      id: crypto.randomUUID(),
      date: headerData.date,
      day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date(headerData.date)),
      department: 'جرد بضاعة أول مدة',
      itemCode: item.itemCode,
      itemName: item.itemName,
      unit: item.unit,
      price: item.price,
      warehouse: headerData.warehouse,
      movementType: 'إدخال',
      quantity: item.quantity,
      invoiceNumber: 'JARD-OPEN',
      statement: `قيد افتتاح مخزني - ${headerData.warehouse}`,
      movementCode: returnId // ربط الحركة بمعرف الجرد لسهولة التعديل/الحذف
    }));

    localStorage.setItem('sheno_stock_entries', JSON.stringify([...openingStockMovements, ...currentStockEntries]));
    
    alert('تم حفظ الجرد وتحديث أرصدة المخازن بنجاح');
    handleNew();
    setViewMode('LIST');
    loadData();
  };

  const handleNew = () => {
    setRows(Array.from({ length: 15 }, () => ({
      id: crypto.randomUUID(),
      itemCode: '',
      itemName: '',
      quantity: 0,
      price: 0,
      total: 0,
      unit: ''
    })));
    setEditingId(null);
    const mainWh = warehouses.find(w => w.isMain) || warehouses[0];
    setHeaderData({
      date: new Date().toISOString().split('T')[0],
      warehouse: mainWh?.name || '',
      statement: 'جرد بضاعة أول المدة',
      currency: 'ليرة سورية',
      details: ''
    });
    setViewMode('ENTRY');
  };

  const handleEdit = (inv: PeriodicInventory) => {
    setEditingId(inv.id);
    setHeaderData({
      date: inv.date,
      warehouse: headerData.warehouse,
      statement: inv.notes,
      currency: 'ليرة سورية',
      details: ''
    });
    const mappedRows = inv.items.map(item => ({
      id: crypto.randomUUID(),
      itemCode: item.itemCode,
      itemName: item.itemName,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      unit: item.unit
    }));
    const emptyRows = Array.from({ length: Math.max(0, 15 - mappedRows.length) }, () => ({
      id: crypto.randomUUID(),
      itemCode: '',
      itemName: '',
      quantity: 0,
      price: 0,
      total: 0,
      unit: ''
    }));
    setRows([...mappedRows, ...emptyRows]);
    setViewMode('ENTRY');
  };

  const handlePreview = (inv: PeriodicInventory) => {
    setPreviewData(inv);
    setViewMode('PREVIEW');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الجرد؟ سيتم إلغاء كافة أرصدة بضاعة أول المدة المرتبطة به.')) {
      const updatedInventories = inventories.filter(x => x.id !== id);
      setInventories(updatedInventories);
      localStorage.setItem('sheno_periodic_inventories', JSON.stringify(updatedInventories));

      const savedStock = localStorage.getItem('sheno_stock_entries');
      if (savedStock) {
        const currentStock = JSON.parse(savedStock);
        localStorage.setItem('sheno_stock_entries', JSON.stringify(currentStock.filter((e: any) => e.movementCode !== id)));
      }

      loadData();
    }
  };

  const calculateCurrentBalance = (itemCode: string) => {
     const moves = stockEntries.filter(e => e.itemCode === itemCode);
     const added = moves.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
     const issued = moves.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
     const returned = moves.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
     const baseItem = inventoryList.find(i => i.code === itemCode);
     return (Number(baseItem?.openingStock) || 0) + added - issued + returned;
  };

  // احتساب بضاعة آخر المدة بناءً على آخر تحديث
  const closingStockItems = inventoryList.map(item => {
    const balance = calculateCurrentBalance(item.code);
    return {
      code: item.code,
      name: item.name,
      quantity: balance,
      price: item.price,
      total: balance * item.price,
      unit: item.unit
    };
  }).filter(it => it.quantity !== 0);

  const closingStockValue = closingStockItems.reduce((sum, it) => sum + it.total, 0);

  const filteredItems = inventoryList.filter(i => 
    i.name.toLowerCase().includes(itemSearch.toLowerCase()) || i.code.toLowerCase().includes(itemSearch.toLowerCase())
  );

  if (viewMode === 'ENTRY') {
    return (
      <div className="min-h-screen bg-[#f4f4f5] text-zinc-900 p-4 flex flex-col gap-4 animate-in fade-in" dir="rtl">
        <div className="flex items-center justify-between border-b-2 border-zinc-300 pb-2 no-print">
          <h1 className="text-xl font-black text-zinc-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> {editingId ? 'تعديل جرد بضاعة أول المدة' : 'تسجيل بضاعة أول المدة'}
          </h1>
          <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-zinc-200 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6 text-zinc-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm no-print">
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600" />
              <span className="font-black text-xs text-zinc-500 uppercase tracking-widest">توثيق جرد مخزني معتمد</span>
            </div>
            <div className="flex gap-2 items-start">
               <div className="p-2 bg-zinc-100 rounded-lg border border-zinc-200"><FileText className="w-5 h-5 text-zinc-400"/></div>
               <div className="flex-1">
                 <textarea 
                   className="w-full border border-zinc-200 p-3 rounded-xl h-24 outline-none focus:border-primary font-bold text-sm bg-zinc-50 shadow-inner resize-none"
                   placeholder="ملاحظات تفصيلية حول هذا الجرد..."
                   value={headerData.details}
                   onChange={e => setHeaderData({...headerData, details: e.target.value})}
                 />
               </div>
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-1">تاريخ الجرد</label>
                <input type="date" value={headerData.date} onChange={e => setHeaderData({...headerData, date: e.target.value})} className="w-full border border-zinc-200 p-3 rounded-xl text-sm font-mono font-black bg-zinc-50 focus:border-primary transition-all" />
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-1">المستودع الفعلي</label>
                <div className="relative">
                   <Warehouse className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                   <select 
                     value={headerData.warehouse} 
                     onChange={e => setHeaderData({...headerData, warehouse: e.target.value})} 
                     className="w-full border border-zinc-200 p-3 pr-10 rounded-xl text-sm font-black bg-zinc-50 focus:border-primary appearance-none cursor-pointer"
                   >
                      <option value="">-- اختر المستودع --</option>
                      {warehouses.map(w => <option key={w.id} value={w.name}>{w.name} {w.isMain ? '(الرئيسي)' : ''}</option>)}
                   </select>
                   <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
             </div>
             <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-1">البيان (يظهر في المتاجرة)</label>
                <input type="text" value={headerData.statement} onChange={e => setHeaderData({...headerData, statement: e.target.value})} className="w-full border border-zinc-200 p-3 rounded-xl text-sm font-black bg-zinc-50 focus:border-primary" placeholder="وصف عملية الجرد..." />
             </div>
          </div>
        </div>

        <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-2xl">
           <div className="overflow-auto custom-scrollbar flex-1">
              <table className="w-full text-right border-collapse table-fixed">
                 <thead className="sticky top-0 z-20 bg-zinc-900 shadow-md">
                    <tr className="text-[11px] font-black text-white uppercase tracking-widest h-12">
                       <th className="w-12 text-center border-l border-zinc-800">#</th>
                       <th className="border-l border-zinc-800 pr-6">المادة / الصنف</th>
                       <th className="w-28 text-center border-l border-zinc-800">الكمية</th>
                       <th className="w-32 text-center border-l border-zinc-800">سعر الوحدة</th>
                       <th className="w-40 text-center bg-black">إجمالي السطر</th>
                    </tr>
                 </thead>
                 <tbody>
                    {rows.map((row, index) => (
                       <tr key={row.id} className={`h-11 border-b border-zinc-100 text-sm font-bold transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}`}>
                          <td className="text-center border-l border-zinc-100 text-zinc-300 font-mono text-xs">{index + 1}</td>
                          <td className="relative border-l border-zinc-100 px-4">
                             <div 
                               className={`w-full h-full cursor-pointer min-h-[44px] flex items-center ${row.itemName ? 'text-zinc-900 font-black' : 'text-zinc-300 italic font-normal'}`}
                               onClick={() => { setActiveRowId(row.id); setItemSearch(row.itemName); }}
                             >
                                {row.itemName || "اختر صنفاً..."}
                             </div>
                             {activeRowId === row.id && (
                               <div className="absolute top-0 right-0 left-0 z-50 bg-white border-2 border-primary shadow-2xl rounded-xl p-2 animate-in zoom-in-95">
                                  <div className="flex items-center gap-2 border-b pb-2 mb-2 no-print">
                                     <Search className="w-4 h-4 text-zinc-400" />
                                     <input 
                                       type="text" 
                                       autoFocus
                                       className="flex-1 outline-none text-sm font-black" 
                                       placeholder="بحث سريع..."
                                       value={itemSearch}
                                       onChange={e => setItemSearch(e.target.value)}
                                     />
                                     <button onClick={() => setActiveRowId(null)}><X className="w-4 h-4 text-zinc-400"/></button>
                                  </div>
                                  <div className="max-h-56 overflow-y-auto custom-scrollbar">
                                     {filteredItems.map(item => (
                                       <div 
                                         key={item.id} 
                                         onClick={() => handleSelectItem(row.id, item)}
                                         className="p-3 hover:bg-zinc-100 cursor-pointer rounded-lg text-xs font-black flex justify-between items-center group transition-colors"
                                       >
                                          <div className="flex flex-col">
                                            <span className="group-hover:text-primary">{item.name}</span>
                                            <span className="text-[9px] text-zinc-400 font-mono">#{item.code}</span>
                                          </div>
                                          <span className="text-[10px] font-bold text-zinc-400">{item.unit}</span>
                                       </div>
                                     ))}
                                     {filteredItems.length === 0 && <div className="p-4 text-center text-xs text-zinc-400 italic">لا توجد مواد تطابق البحث</div>}
                                  </div>
                               </div>
                             )}
                          </td>
                          <td className="border-l border-zinc-100">
                             <input 
                               type="number" 
                               className="w-full h-full bg-transparent text-center font-mono font-black text-primary outline-none focus:bg-primary/5" 
                               value={row.quantity || ''} 
                               onChange={e => updateRow(row.id, 'quantity', Number(e.target.value))} 
                             />
                          </td>
                          <td className="border-l border-zinc-100">
                             <input 
                               type="number" 
                               className="w-full h-full bg-transparent text-center font-mono font-black text-zinc-700 outline-none focus:bg-zinc-100" 
                               value={row.price || ''} 
                               onChange={e => updateRow(row.id, 'price', Number(e.target.value))} 
                             />
                          </td>
                          <td className="text-center font-mono font-black text-zinc-900 bg-zinc-50">
                             {row.total > 0 ? row.total.toLocaleString() : '-'}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="flex flex-col md:flex-row items-end justify-between gap-6 pb-6 no-print">
           <div className="bg-zinc-900 p-1 min-w-[320px] shadow-2xl rounded-2xl">
              <div className="bg-black text-white flex flex-col items-center justify-center h-24 border border-zinc-800 rounded-xl">
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">TOTAL OPENING VALUE | إجمالي قيمة الجرد</span>
                 <span className="text-4xl font-mono font-black tracking-tighter text-white">
                   {grandTotal.toLocaleString()}
                 </span>
                 <span className="text-[9px] font-bold text-zinc-600 mt-1 uppercase">{settings?.currencySymbol || 'ل.س'}</span>
              </div>
           </div>

           <div className="flex flex-wrap gap-2 bg-zinc-200 p-2 rounded-2xl border border-zinc-300">
              <button onClick={() => setViewMode('LIST')} className="bg-white hover:bg-zinc-50 px-6 py-2.5 rounded-xl flex items-center gap-2 font-black text-xs shadow-sm transition-all border border-zinc-300">
                <X className="w-4 h-4 text-rose-600" /> إغلاق
              </button>
              <button onClick={handleNew} className="bg-white hover:bg-zinc-50 px-6 py-2.5 rounded-xl flex items-center gap-2 font-black text-xs shadow-sm transition-all border border-zinc-300">
                <RotateCcw className="w-4 h-4 text-amber-500" /> تصفير
              </button>
              <button onClick={handleSaveJard} className="bg-primary text-white px-12 py-2.5 rounded-xl flex items-center gap-3 font-black text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all">
                <Save className="w-5 h-5" /> {editingId ? 'تحديث الجرد' : 'حفظ وتثبيت الجرد الافتتاحي'}
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'PREVIEW' && previewData) {
    return (
      <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
         <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 animate-in zoom-in-95">
            <div className="bg-zinc-900 p-6 text-white flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-primary" />
                  <div>
                     <h2 className="text-xl font-black">معاينة تفاصيل الجرد</h2>
                     <p className="text-[10px] text-zinc-400 font-bold uppercase">{previewData.notes}</p>
                  </div>
               </div>
               <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 space-y-8">
               <div className="grid grid-cols-3 gap-8 border-b pb-6">
                  <div><span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">التاريخ</span><p className="font-mono font-black text-lg">{previewData.date}</p></div>
                  <div><span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">البيان</span><p className="font-black text-lg">{previewData.notes}</p></div>
                  <div className="text-left"><span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">إجمالي القيمة</span><p className="font-mono font-black text-2xl text-primary">{previewData.totalValue.toLocaleString()}</p></div>
               </div>

               <table className="w-full text-right border-collapse">
                  <thead>
                     <tr className="bg-zinc-50 border-b-2 border-zinc-200 h-10 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        <th className="p-2 w-12 text-center">#</th>
                        <th className="p-2">الصنف</th>
                        <th className="p-2 text-center">الكمية</th>
                        <th className="p-2 text-center">السعر</th>
                        <th className="p-2 text-center">الإجمالي</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                     {previewData.items.map((it, idx) => (
                        <tr key={idx} className="h-12 hover:bg-zinc-50 transition-colors">
                           <td className="p-2 text-center font-mono text-zinc-400">{idx + 1}</td>
                           <td className="p-2 font-black">{it.itemName}</td>
                           <td className="p-2 text-center font-mono font-bold">{it.quantity} <span className="text-[9px] text-zinc-400">{it.unit}</span></td>
                           <td className="p-2 text-center font-mono text-zinc-500">{it.price.toLocaleString()}</td>
                           <td className="p-2 text-center font-mono font-black text-primary">{it.total.toLocaleString()}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            <div className="p-6 bg-zinc-50 border-t flex justify-end gap-3 no-print">
               <button onClick={() => window.print()} className="bg-zinc-900 text-white px-8 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg"><Printer className="w-5 h-5"/> طباعة الكشف</button>
               <button onClick={() => handleEdit(previewData)} className="bg-amber-600 text-white px-8 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg"><Edit2 className="w-5 h-5"/> تعديل البيانات</button>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between no-print gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl shadow-sm transition-all">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
             <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Package className="w-8 h-8" /></div>
             <div>
                <h2 className="text-2xl font-black text-readable tracking-tight leading-none mb-1">إدارة وتقييم الجرد الدوري</h2>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">بضاعة أول وآخر المدة</p>
             </div>
          </div>
        </div>
        <button onClick={handleNew} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:brightness-110 active:scale-95 transition-all text-sm md:text-base">
          <Plus className="w-6 h-6" /> تسجيل جرد أول مدة جديد
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-950 p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-8">
         <PeriodicInventoryManager 
            inventories={inventories} 
            closingStockValue={closingStockValue} 
            closingStockItems={closingStockItems} 
            onDelete={handleDelete}
            onEdit={handleEdit}
            onPreview={handlePreview}
         />
         
         <div className="p-5 bg-amber-50 dark:bg-amber-950/20 rounded-[2rem] border-2 border-dashed border-amber-200 dark:border-amber-900 flex gap-4">
            <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg h-fit"><AlertCircle className="w-6 h-6" /></div>
            <div>
               <h4 className="font-black text-amber-800 dark:text-amber-400 mb-1">ملاحظة محاسبية هامة:</h4>
               <p className="text-xs font-bold text-amber-700 dark:text-amber-500 leading-relaxed">
                  يتم سحب قيمة "بضاعة أول المدة" وتغذية رصيد المخزن الفعلي من السجلات المسجلة هنا بشكل تلقائي. يرجى التأكد من اختيار المستودع الصحيح لكل عملية جرد لضمان عزل الأرصدة بدقة.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PeriodicInventoryView;
