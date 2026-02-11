
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Package, X, Save, Search, Check } from 'lucide-react';
import { PeriodicInventory, InventoryItem, StockEntry, AppSettings } from '../types';
import PeriodicInventoryManager from './PeriodicInventoryManager';

interface PeriodicInventoryViewProps {
  onBack: () => void;
}

const PeriodicInventoryView: React.FC<PeriodicInventoryViewProps> = ({ onBack }) => {
  const [inventories, setInventories] = useState<PeriodicInventory[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [tempItems, setTempItems] = useState<any[]>([]);
  // Fix: Updated itemForm to include unit to match the updated PeriodicInventory interface
  const [itemForm, setItemForm] = useState({ itemCode: '', itemName: '', quantity: 0, price: 0, unit: '' });
  
  // حالات البحث عن المواد
  const [itemSearch, setItemSearch] = useState('');
  const [showItemResults, setShowItemResults] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const sInv = localStorage.getItem('sheno_periodic_inventories');
    const sList = localStorage.getItem('sheno_inventory_list');
    const sStock = localStorage.getItem('sheno_stock_entries');
    if (sInv) setInventories(JSON.parse(sInv));
    if (sList) setInventoryList(JSON.parse(sList));
    if (sStock) setStockEntries(JSON.parse(sStock));
  };

  const calculateClosingStock = () => {
    const items = inventoryList.map(item => {
        const moves = stockEntries.filter(e => e.itemCode === item.code);
        const added = moves.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
        const issued = moves.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
        const returned = moves.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
        const balance = (item.openingStock || 0) + added - issued + returned;
        return { code: item.code, name: item.name, quantity: balance, unit: item.unit, price: item.price, total: balance * item.price };
    }).filter(it => it.quantity !== 0);
    const total = items.reduce((s, i) => s + i.total, 0);
    return { items, total };
  };

  const handleSaveJard = () => {
    if (tempItems.length === 0) return;
    const totalValue = tempItems.reduce((s, c) => s + c.total, 0);
    const jardId = crypto.randomUUID();
    const date = new Date().toISOString().split('T')[0];
    const newJard: PeriodicInventory = { id: jardId, date, type: 'OPENING', items: tempItems, totalValue, notes: 'جرد بضاعة أول المدة' };
    localStorage.setItem('sheno_periodic_inventories', JSON.stringify([newJard, ...inventories]));
    alert('تم تثبيت الجرد بنجاح');
    setIsAdding(false);
    setTempItems([]);
    loadData();
  };

  const handleSelectItem = (item: InventoryItem) => {
    // Fix: Ensure the unit is captured when an item is selected from results
    setItemForm({
      ...itemForm,
      itemCode: item.code,
      itemName: item.name,
      price: item.price,
      unit: item.unit
    });
    setItemSearch(item.name);
    setShowItemResults(false);
  };

  const filteredInventoryItems = inventoryList.filter(item => 
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) || 
    item.code.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const closing = calculateClosingStock();

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
        <button onClick={() => setIsAdding(true)} className="bg-emerald-600 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
          <Plus className="w-5 h-5" /> تسجيل جرد أول مدة
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

      {isAdding && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[250] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[3rem] border border-zinc-200 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b flex justify-between items-center text-right" dir="rtl">
                 <h3 className="text-2xl font-black">تسجيل جرد بضاعة أول المدة</h3>
                 <button onClick={() => { setIsAdding(false); setTempItems([]); }} className="text-zinc-400 hover:text-rose-500 transition-colors"><X className="w-6 h-6"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 text-right" dir="rtl">
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="md:col-span-2 relative">
                       <label className="text-[10px] font-black text-zinc-400 uppercase mb-1 block">الصنف (ابحث بالاسم أو الكود)</label>
                       <div className="relative">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input 
                            type="text" 
                            placeholder="ابحث عن مادة..."
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 pr-10 rounded-xl font-bold outline-none focus:border-primary transition-all shadow-sm"
                            value={itemSearch}
                            onFocus={() => setShowItemResults(true)}
                            onChange={(e) => {
                              setItemSearch(e.target.value);
                              setShowItemResults(true);
                            }}
                          />
                          {showItemResults && itemSearch.length > 0 && (
                            <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-[300] max-h-48 overflow-y-auto animate-in fade-in">
                               {filteredInventoryItems.length === 0 ? (
                                 <div className="p-4 text-center text-xs text-zinc-400 italic">لا توجد مواد تطابق البحث</div>
                               ) : (
                                 filteredInventoryItems.map(item => (
                                   <div 
                                      key={item.id} 
                                      onClick={() => handleSelectItem(item)}
                                      className="p-3 border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer flex justify-between items-center group transition-colors"
                                   >
                                      <div className="flex flex-col text-right">
                                         <span className="font-bold text-sm text-readable group-hover:text-primary">{item.name}</span>
                                         <span className="text-[10px] text-zinc-400 font-mono">#{item.code}</span>
                                      </div>
                                      {itemForm.itemCode === item.code && <Check className="w-4 h-4 text-primary" />}
                                   </div>
                                 ))
                               )}
                            </div>
                          )}
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-zinc-400 uppercase mb-1 block">الكمية</label>
                       <input 
                         type="number" 
                         className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-black text-emerald-600 outline-none focus:border-primary shadow-sm" 
                         value={itemForm.quantity} 
                         onChange={e => setItemForm({...itemForm, quantity: Number(e.target.value)})} 
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-zinc-400 uppercase mb-1 block">السعر التقديري</label>
                       <input 
                         type="number" 
                         className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-black text-amber-600 outline-none focus:border-primary shadow-sm" 
                         value={itemForm.price} 
                         onChange={e => setItemForm({...itemForm, price: Number(e.target.value)})} 
                       />
                    </div>
                    <div className="flex items-end">
                       <button 
                         onClick={() => {
                           if (!itemForm.itemCode || !itemForm.quantity) return;
                           setTempItems([...tempItems, { ...itemForm, total: itemForm.quantity * itemForm.price }]);
                           // Fix: Reset form with initial empty unit state
                           setItemForm({ itemCode: '', itemName: '', quantity: 0, price: 0, unit: '' });
                           setItemSearch('');
                         }} 
                         className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-xl font-black shadow-lg shadow-emerald-900/10 transition-all active:scale-95"
                       >
                         إضافة للائحة
                       </button>
                    </div>
                 </div>
                 
                 <div className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-inner">
                    <table className="w-full text-right border-collapse">
                       <thead className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest h-10">
                          <tr>
                             <th className="p-3 border-l border-zinc-800">المادة المحررة</th>
                             <th className="p-3 border-l border-zinc-800 text-center">الكمية</th>
                             <th className="p-3 border-l border-zinc-800 text-center">السعر</th>
                             <th className="p-3 border-l border-zinc-800 text-center">القيمة الإجمالية</th>
                             <th className="p-3 w-12 text-center">حذف</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y font-bold text-readable">
                          {tempItems.map((it, idx) => (
                             <tr key={idx} className="h-12 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="p-3 border-l border-zinc-100 dark:border-zinc-800">{it.itemName}</td>
                                <td className="p-3 text-center font-mono text-zinc-500 border-l border-zinc-100 dark:border-zinc-800">{it.quantity.toLocaleString()}</td>
                                <td className="p-3 text-center font-mono text-zinc-500 border-l border-zinc-100 dark:border-zinc-800">{it.price.toLocaleString()}</td>
                                <td className="p-3 text-center font-mono font-black text-emerald-600 border-l border-zinc-100 dark:border-zinc-800">{it.total.toLocaleString()}</td>
                                <td className="p-3 text-center">
                                   <button onClick={() => setTempItems(tempItems.filter((_, i) => i !== idx))} className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-colors"><X className="w-4 h-4"/></button>
                                </td>
                             </tr>
                          ))}
                          {tempItems.length === 0 && (
                            <tr><td colSpan={5} className="p-20 text-center text-zinc-300 italic font-black text-sm">لم يتم إضافة أي بنود للجرد بعد...</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
              <div className="p-8 bg-zinc-900 text-white flex justify-end items-center border-t border-zinc-800">
                 <button onClick={handleSaveJard} className="bg-primary hover:bg-primary/90 text-white px-20 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3">
                    <Save className="w-6 h-6" /> تثبيت جرد أول المدة
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PeriodicInventoryView;
