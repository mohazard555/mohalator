import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Package, X, Save } from 'lucide-react';
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
  const [itemForm, setItemForm] = useState({ itemCode: '', itemName: '', quantity: 0, price: 0 });

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

  const closing = calculateClosingStock();

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-all shadow-sm">
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
          if(window.confirm('حذف الجرد؟')) {
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
                 <button onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-rose-500"><X className="w-6 h-6"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 text-right" dir="rtl">
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border-2 border-dashed">
                    <div className="md:col-span-2">
                       <label className="text-[10px] font-black text-zinc-400 uppercase">الصنف</label>
                       <select value={itemForm.itemCode} onChange={e => {
                          const it = inventoryList.find(i => i.code === e.target.value);
                          if(it) setItemForm({...itemForm, itemCode: it.code, itemName: it.name, price: it.price});
                       }} className="w-full bg-white dark:bg-zinc-900 border p-3 rounded-xl font-bold">
                          <option value="">-- اختر مادة --</option>
                          {inventoryList.map(i => <option key={i.id} value={i.code}>{i.name}</option>)}
                       </select>
                    </div>
                    <div><label className="text-[10px] font-black text-zinc-400 uppercase">كمية</label><input type="number" className="w-full bg-white dark:bg-zinc-900 border p-3 rounded-xl" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: Number(e.target.value)})} /></div>
                    <div><label className="text-[10px] font-black text-zinc-400 uppercase">سعر</label><input type="number" className="w-full bg-white dark:bg-zinc-900 border p-3 rounded-xl" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: Number(e.target.value)})} /></div>
                    <div className="flex items-end"><button onClick={() => {
                        if (!itemForm.itemCode || !itemForm.quantity) return;
                        setTempItems([...tempItems, { ...itemForm, total: itemForm.quantity * itemForm.price }]);
                        setItemForm({ itemCode: '', itemName: '', quantity: 0, price: 0 });
                    }} className="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-black">إضافة</button></div>
                 </div>
                 <table className="w-full text-right border-collapse">
                    <thead className="bg-zinc-900 text-white text-[10px] font-black uppercase"><tr><th className="p-3">المادة</th><th className="p-3 text-center">الكمية</th><th className="p-3 text-center">السعر</th><th className="p-3 text-center">الإجمالي</th></tr></thead>
                    <tbody className="divide-y font-bold">
                       {tempItems.map((it, idx) => (
                          <tr key={idx} className="h-12"><td className="p-3">{it.itemName}</td><td className="p-3 text-center font-mono">{it.quantity.toLocaleString()}</td><td className="p-3 text-center font-mono">{it.price.toLocaleString()}</td><td className="p-3 text-center font-mono text-emerald-600">{it.total.toLocaleString()}</td></tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="p-8 bg-zinc-900 text-white flex justify-end items-center">
                 <button onClick={handleSaveJard} className="bg-primary text-white px-20 py-5 rounded-2xl font-black text-xl">تثبيت الجرد</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PeriodicInventoryView;