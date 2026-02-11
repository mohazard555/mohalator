
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Plus, Package, X, Save, Search, Check, 
  ChevronRight, ChevronLeft, Printer, Eye, Trash2, Edit2, 
  RotateCcw, FileText, LayoutList, Calendar, Warehouse, Coins, Hash, ChevronDown
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
  
  const [viewMode, setViewMode] = useState<'LIST' | 'ENTRY'>('LIST');
  const [showWarehouseSearch, setShowWarehouseSearch] = useState(false);

  // بيانات الترويسة (Header)
  const [headerData, setHeaderData] = useState({
    date: new Date().toISOString().split('T')[0],
    warehouse: 'المستودع الرئيسي',
    statement: '',
    currency: 'ليرة سورية',
    exchangeRate: '1.00000',
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

  // حالات البحث داخل الخلايا
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
    
    if (sInv) setInventories(JSON.parse(sInv));
    if (sList) setInventoryList(JSON.parse(sList));
    if (sWh) setWarehouses(JSON.parse(sWh));
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
      alert('يرجى إدخال مادة واحدة على الأقل بكمية صحيحة');
      return;
    }

    const newJard: PeriodicInventory = {
      id: crypto.randomUUID(),
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

    const updated = [newJard, ...inventories];
    setInventories(updated);
    localStorage.setItem('sheno_periodic_inventories', JSON.stringify(updated));
    
    alert('تم حفظ وتثبيت جرد أول المدة بنجاح');
    setViewMode('LIST');
    loadData();
  };

  const calculateClosingStock = (targetDate: string) => {
    const items = inventoryList.map(item => {
      const moves = stockEntries.filter(e => e.itemCode === item.code && e.date <= targetDate);
      const added = moves.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
      const issued = moves.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
      const returned = moves.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
      const balance = (item.openingStock || 0) + added - issued + returned;
      return { code: item.code, name: item.name, quantity: balance, unit: item.unit, price: item.price, total: balance * item.price };
    });
    return { items: items.filter(i => i.quantity !== 0), total: items.reduce((s, i) => s + i.total, 0) };
  };

  const closing = calculateClosingStock(new Date().toISOString().split('T')[0]);
  const filteredItems = inventoryList.filter(i => 
    i.name.includes(itemSearch) || i.code.includes(itemSearch)
  );

  if (viewMode === 'ENTRY') {
    return (
      <div className="min-h-screen bg-[#e9ecef] text-[#212529] p-4 flex flex-col gap-4 animate-in fade-in zoom-in-95" dir="rtl">
        {/* Title Bar */}
        <div className="flex items-center justify-between border-b-2 border-zinc-400 pb-2">
          <h1 className="text-xl font-black text-zinc-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> بضاعة أول المدة
          </h1>
          <div className="flex gap-1 no-print items-center">
            <button className="p-1 hover:bg-zinc-300 rounded transition-colors"><ChevronRight className="w-5 h-5 text-zinc-600" /></button>
            <button className="p-1 hover:bg-zinc-300 rounded transition-colors"><ChevronLeft className="w-5 h-5 text-zinc-600" /></button>
            <div className="px-6 py-1.5 bg-white border-2 border-zinc-400 font-mono font-black text-sm shadow-inner rounded-md ml-2 mr-2">* 1</div>
            <button className="p-1 hover:bg-zinc-300 rounded transition-colors"><ChevronRight className="w-5 h-5 rotate-180 text-zinc-600" /></button>
            <button className="p-1 hover:bg-zinc-300 rounded transition-colors"><ChevronLeft className="w-5 h-5 rotate-180 text-zinc-600" /></button>
          </div>
        </div>

        {/* Top Header Form */}
        <div className="grid grid-cols-12 gap-6 bg-zinc-200/50 p-5 rounded-xl border border-zinc-300 shadow-sm">
          {/* Left Side Header */}
          <div className="col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-700" />
              <span className="font-black text-sm text-emerald-900 uppercase tracking-tighter">درجة السرية المحاسبية</span>
            </div>
            <div className="flex gap-2 items-start">
               <div className="p-2 bg-zinc-300 rounded-lg border border-zinc-400"><Search className="w-5 h-5 text-zinc-700"/></div>
               <div className="flex-1">
                 <textarea 
                   className="w-full border-2 border-zinc-300 p-3 rounded-xl h-24 outline-none focus:border-primary font-black text-sm bg-white shadow-inner resize-none"
                   placeholder="تفصيل إضافي..."
                   value={headerData.details}
                   onChange={e => setHeaderData({...headerData, details: e.target.value})}
                 />
                 <div className="text-[10px] font-black text-zinc-500 mt-1 mr-1 uppercase">حساب المواد والبنود</div>
               </div>
            </div>
          </div>

          {/* Right Side Header */}
          <div className="col-span-7 grid grid-cols-2 gap-x-8 gap-y-4">
             <div className="flex items-center gap-2">
                <span className="text-xs font-black w-16 text-zinc-600">التاريخ:</span>
                <input type="date" value={headerData.date} onChange={e => setHeaderData({...headerData, date: e.target.value})} className="flex-1 border-2 border-zinc-300 p-2 rounded-xl text-xs font-mono font-black bg-white focus:border-primary transition-all" />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-xs font-black w-16 text-zinc-600">العملة:</span>
                <select value={headerData.currency} onChange={e => setHeaderData({...headerData, currency: e.target.value})} className="flex-1 border-2 border-zinc-300 p-2 rounded-xl text-xs font-black bg-white appearance-none cursor-pointer focus:border-primary">
                   <option>{settings?.currency || 'ليرة سورية'}</option>
                   <option>{settings?.secondaryCurrency || 'دولار أمريكي'}</option>
                </select>
             </div>
             <div className="flex items-center gap-2 relative">
                <span className="text-xs font-black w-16 text-zinc-600">المستودع:</span>
                <div className="flex-1 flex gap-1 items-center">
                   <select value={headerData.warehouse} onChange={e => setHeaderData({...headerData, warehouse: e.target.value})} className="flex-1 border-2 border-zinc-300 p-2 rounded-xl text-xs font-black bg-white appearance-none focus:border-primary">
                      {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                   </select>
                   <div 
                     onClick={() => setShowWarehouseSearch(!showWarehouseSearch)}
                     className="p-2 bg-zinc-300 rounded-lg border border-zinc-400 cursor-pointer hover:bg-primary hover:text-white transition-all shadow-sm"
                   >
                     <Search className="w-4 h-4"/>
                   </div>
                   {showWarehouseSearch && (
                     <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-primary rounded-xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-1">
                        <div className="text-[10px] font-black text-zinc-400 mb-2 border-b pb-1">اختر المستودع للمطابقة</div>
                        {warehouses.map(w => (
                          <div 
                            key={w.id} 
                            onClick={() => { setHeaderData({...headerData, warehouse: w.name}); setShowWarehouseSearch(false); }}
                            className="p-2 hover:bg-primary hover:text-white cursor-pointer rounded-lg text-xs font-black flex items-center justify-between"
                          >
                             <span>{w.name}</span>
                             <span className="text-[9px] opacity-60 font-mono">{w.location}</span>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-xs font-black w-16 text-zinc-600">التعادل:</span>
                <div className="flex-1 flex gap-2">
                   <input type="text" readOnly value={headerData.exchangeRate} className="w-full border-2 border-zinc-300 p-2 rounded-xl text-xs font-mono font-black bg-zinc-100 text-center text-zinc-500" />
                   <input type="text" readOnly value={headerData.exchangeRate} className="w-full border-2 border-zinc-300 p-2 rounded-xl text-xs font-mono font-black bg-zinc-100 text-center text-zinc-500" />
                </div>
             </div>
             <div className="col-span-2 flex items-center gap-2">
                <span className="text-xs font-black w-16 text-zinc-600">البيان:</span>
                <input type="text" value={headerData.statement} onChange={e => setHeaderData({...headerData, statement: e.target.value})} className="flex-1 border-2 border-zinc-300 p-2 rounded-xl text-xs font-black bg-white focus:border-primary transition-all shadow-sm" placeholder="وصف عملية الجرد الافتتاحي..." />
             </div>
          </div>
        </div>

        {/* Main Grid Table */}
        <div className="flex-1 bg-white border-2 border-zinc-400 overflow-hidden flex flex-col shadow-xl rounded-xl">
           <div className="overflow-auto custom-scrollbar flex-1">
              <table className="w-full text-right border-collapse table-fixed">
                 <thead className="sticky top-0 z-20 bg-zinc-800 shadow-lg">
                    <tr className="text-[11px] font-black text-white uppercase tracking-widest h-12 border-b border-zinc-700">
                       <th className="w-12 text-center border-l border-zinc-700"></th>
                       <th className="border-l border-zinc-700 pr-6">المادة / الصنف</th>
                       <th className="w-28 text-center border-l border-zinc-700">الكمية</th>
                       <th className="w-32 text-center border-l border-zinc-700">الإفرادي</th>
                       <th className="w-40 text-center bg-zinc-900">إجمالي السطر</th>
                    </tr>
                 </thead>
                 <tbody>
                    {rows.map((row, index) => (
                       <tr key={row.id} className={`h-10 border-b border-zinc-300 text-sm font-black transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-100'}`}>
                          <td className="text-center border-l border-zinc-200 text-zinc-400 font-mono text-xs">{index + 1}</td>
                          <td className="relative border-l border-zinc-200 px-4 group">
                             <div 
                               className={`w-full h-full cursor-pointer min-h-[40px] flex items-center group-hover:text-primary transition-all ${row.itemName ? 'text-zinc-900' : 'text-zinc-300 italic font-normal'}`}
                               onClick={() => { setActiveRowId(row.id); setItemSearch(row.itemName); }}
                             >
                                {row.itemName || "انقر لإدراج مادة..."}
                             </div>
                             {activeRowId === row.id && (
                               <div className="absolute top-0 right-0 left-0 z-50 bg-white border-4 border-primary shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl p-3 animate-in fade-in slide-in-from-top-2">
                                  <div className="flex items-center gap-3 border-b-2 border-zinc-100 pb-3 mb-3">
                                     <Search className="w-5 h-5 text-primary" />
                                     <input 
                                       type="text" 
                                       autoFocus
                                       className="flex-1 outline-none text-sm font-black text-readable placeholder:font-normal placeholder:italic" 
                                       placeholder="بحث سريع باسم المادة أو الكود..."
                                       value={itemSearch}
                                       onChange={e => setItemSearch(e.target.value)}
                                     />
                                     <button onClick={() => setActiveRowId(null)} className="p-1 hover:bg-zinc-100 rounded-full transition-all"><X className="w-5 h-5 text-zinc-400"/></button>
                                  </div>
                                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                     {filteredItems.map(item => (
                                       <div 
                                         key={item.id} 
                                         onClick={() => handleSelectItem(row.id, item)}
                                         className="p-3 hover:bg-primary hover:text-white cursor-pointer rounded-xl text-xs font-black flex justify-between items-center transition-all mb-1 border border-transparent hover:border-white/20"
                                       >
                                          <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-white/20 transition-all text-primary group-hover:text-white">#{item.code.slice(-3)}</div>
                                             <span>{item.name}</span>
                                          </div>
                                          <span className="font-mono opacity-50 text-[9px] uppercase">BAL: {item.currentBalance}</span>
                                       </div>
                                     ))}
                                     {filteredItems.length === 0 && <div className="p-8 text-center text-zinc-400 italic text-xs">لم يتم العثور على مادة بهذا الاسم في المخزن</div>}
                                  </div>
                               </div>
                             )}
                          </td>
                          <td className="border-l border-zinc-200">
                             <input 
                               type="number" 
                               className="w-full h-full bg-transparent text-center font-mono font-black text-zinc-800 outline-none focus:bg-white focus:text-primary transition-all" 
                               value={row.quantity || ''} 
                               onChange={e => updateRow(row.id, 'quantity', Number(e.target.value))} 
                             />
                          </td>
                          <td className="border-l border-zinc-200">
                             <input 
                               type="number" 
                               className="w-full h-full bg-transparent text-center font-mono font-black text-zinc-800 outline-none focus:bg-white focus:text-primary transition-all" 
                               value={row.price || ''} 
                               onChange={e => updateRow(row.id, 'price', Number(e.target.value))} 
                             />
                          </td>
                          <td className="text-center font-mono font-black text-zinc-900 bg-zinc-50">
                             {row.total > 0 ? row.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Footer Totals and Actions */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 pb-6">
           {/* Total Box */}
           <div className="bg-zinc-800 p-2 min-w-[340px] shadow-2xl rounded-2xl border-2 border-zinc-600">
              <div className="bg-black text-white flex flex-col items-center justify-center h-28 border-2 border-zinc-700 rounded-xl">
                 <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Total Amount | إجمالي الجرد</span>
                 <span className="text-5xl font-mono font-black tracking-tighter text-white">
                   {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                 </span>
                 <span className="text-[10px] font-black text-zinc-600 mt-2">SYRIAN POUNDS | ليرة سورية</span>
              </div>
           </div>

           {/* Classic Buttons Row */}
           <div className="flex flex-wrap gap-2 no-print bg-zinc-300 p-3 rounded-[2rem] border border-zinc-400 shadow-inner">
              <button onClick={onBack} className="bg-white hover:bg-rose-50 border-2 border-zinc-400 px-8 py-2.5 rounded-2xl flex items-center gap-2 font-black text-sm shadow-sm transition-all hover:border-rose-300">
                <X className="w-5 h-5 text-rose-600" /> إغلاق
              </button>
              <button className="bg-white hover:bg-zinc-50 border-2 border-zinc-400 px-8 py-2.5 rounded-2xl flex items-center gap-2 font-black text-sm shadow-sm transition-all">
                <Eye className="w-5 h-5 text-blue-600" /> معاينة
              </button>
              <button onClick={() => window.print()} className="bg-white hover:bg-zinc-50 border-2 border-zinc-400 px-8 py-2.5 rounded-2xl flex items-center gap-2 font-black text-sm shadow-sm transition-all">
                <Printer className="w-5 h-5 text-zinc-800" /> طباعة
              </button>
              <button className="bg-white hover:bg-rose-50 border-2 border-zinc-400 px-8 py-2.5 rounded-2xl flex items-center gap-2 font-black text-sm shadow-sm transition-all hover:border-rose-400">
                <Trash2 className="w-5 h-5 text-rose-800" /> حذف
              </button>
              <button className="bg-white hover:bg-emerald-50 border-2 border-zinc-400 px-8 py-2.5 rounded-2xl flex items-center gap-2 font-black text-sm shadow-sm transition-all hover:border-emerald-300">
                <Edit2 className="w-5 h-5 text-emerald-700" /> تعديل
              </button>
              <button onClick={() => setRows(Array.from({ length: 15 }, () => ({ id: crypto.randomUUID(), itemCode: '', itemName: '', quantity: 0, price: 0, total: 0, unit: '' })))} className="bg-white hover:bg-amber-50 border-2 border-zinc-400 px-8 py-2.5 rounded-2xl flex items-center gap-2 font-black text-sm shadow-sm transition-all hover:border-amber-300">
                <RotateCcw className="w-5 h-5 text-amber-500" /> جديد
              </button>
              <button onClick={handleSaveJard} className="bg-primary text-white border-2 border-primary/50 px-12 py-2.5 rounded-2xl flex items-center gap-3 font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all">
                <Plus className="w-6 h-6" /> إضافة
              </button>
           </div>
        </div>
      </div>
    );
  }

  // Default List View
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl shadow-sm">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
             <Package className="w-8 h-8 text-primary" />
             <h2 className="text-2xl font-black text-readable">إدارة الجرد الدوري</h2>
          </div>
        </div>
        <button onClick={() => setViewMode('ENTRY')} className="bg-emerald-600 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
          <Plus className="w-5 h-5" /> تسجيل جرد أول مدة جديد
        </button>
      </div>

      <PeriodicInventoryManager 
        inventories={inventories} 
        closingStockValue={closing.total} 
        closingStockItems={closing.items}
        onDelete={(id) => {
          if(window.confirm('حذف هذا الجرد؟')) {
            const updated = inventories.filter(x => x.id !== id);
            localStorage.setItem('sheno_periodic_inventories', JSON.stringify(updated));
            loadData();
          }
        }} 
      />
    </div>
  );
};

export default PeriodicInventoryView;
