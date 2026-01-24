
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Package, Plus, Trash2, Edit2, FileDown, Printer, Box, Save, X, Warehouse as WarehouseIcon, Calendar, Coins, Hash } from 'lucide-react';
import { StockEntry, InventoryItem, WarehouseEntity, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

interface InventoryViewProps {
  onBack: () => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ onBack }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseEntity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [formData, setFormData] = useState<any>({
    code: '', name: '', category: 'عام', unit: 'قطعة', price: 0, openingStock: 0, currentInputQty: 0, warehouse: 'المستودع الرئيسي', movementType: 'إدخال'
  });

  useEffect(() => {
    loadData();
    const savedWarehouses = localStorage.getItem('sheno_warehouses');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedWarehouses) setWarehouses(JSON.parse(savedWarehouses));
    else setWarehouses([{ id: '1', name: 'المستودع الرئيسي', location: 'دمشق', isMain: true }]);
  }, []);

  const loadData = () => {
    const savedItems = localStorage.getItem('sheno_inventory_list');
    const savedEntries = localStorage.getItem('sheno_stock_entries');
    
    let baseItems: InventoryItem[] = savedItems ? JSON.parse(savedItems) : [];
    const entries: StockEntry[] = savedEntries ? JSON.parse(savedEntries) : [];

    const updatedItems = baseItems.map(item => {
      const itemEntries = entries.filter(e => e.itemCode === item.code);
      const added = itemEntries.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
      const issued = itemEntries.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
      const returned = itemEntries.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
      
      return {
        ...item,
        added,
        issued,
        returned,
        currentBalance: (item.openingStock || 0) + added - issued + returned
      };
    });

    setItems(updatedItems);
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.code) {
      alert('يرجى إدخال اسم وكود المادة');
      return;
    }
    
    const saved = localStorage.getItem('sheno_inventory_list');
    let all: InventoryItem[] = saved ? JSON.parse(saved) : [];
    
    const newItem = { 
      code: formData.code, 
      name: formData.name, 
      category: formData.category, 
      unit: formData.unit, 
      price: formData.price, 
      openingStock: formData.openingStock,
      warehouse: formData.warehouse
    };

    if (editingId) {
      all = all.map(i => i.id === editingId ? { ...i, ...newItem } as InventoryItem : i);
    } else {
      const id = crypto.randomUUID();
      all = [...all, { ...newItem, id, added: 0, issued: 0, returned: 0, currentBalance: formData.openingStock } as InventoryItem];
      
      if (formData.currentInputQty > 0) {
        const savedEntries = localStorage.getItem('sheno_stock_entries');
        const entries: StockEntry[] = savedEntries ? JSON.parse(savedEntries) : [];
        const initialEntry: StockEntry = {
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date()),
          department: 'إدخال أولي',
          itemCode: formData.code,
          itemName: formData.name,
          unit: formData.unit,
          price: formData.price,
          warehouse: formData.warehouse,
          movementType: formData.movementType || 'إدخال',
          quantity: formData.currentInputQty,
          invoiceNumber: 'INITIAL',
          statement: 'كمية مضافة عند التأسيس'
        };
        localStorage.setItem('sheno_stock_entries', JSON.stringify([initialEntry, ...entries]));
      }
    }

    localStorage.setItem('sheno_inventory_list', JSON.stringify(all));
    setIsAdding(false);
    setEditingId(null);
    setFormData({ code: '', name: '', category: 'عام', unit: 'قطعة', price: 0, openingStock: 0, currentInputQty: 0, warehouse: warehouses[0]?.name || 'المستودع الرئيسي', movementType: 'إدخال' });
    loadData();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('حذف هذه المادة من النظام؟')) {
      const saved = localStorage.getItem('sheno_inventory_list');
      if (saved) {
        const all: InventoryItem[] = JSON.parse(saved);
        const updated = all.filter(i => i.id !== id);
        localStorage.setItem('sheno_inventory_list', JSON.stringify(updated));
        loadData();
      }
    }
  };

  const filteredItems = items.filter(item => 
    item.name.includes(searchTerm) || item.code.includes(searchTerm) || item.warehouse?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-emerald-600">قائمة المواد والجرد</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="bg-emerald-600 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all">
             <Plus className="w-5 h-5" /> إضافة مادة جديدة
          </button>
          <button onClick={() => exportToCSV(items, 'inventory_report')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 hover:bg-zinc-700 transition-all">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-8 animate-in zoom-in-95 no-print text-readable">
           <div className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
              <h3 className="text-xl font-black flex items-center gap-2">
                 <Box className="w-6 h-6 text-emerald-600" /> {editingId ? 'تعديل بيانات مادة' : 'إضافة مادة جديدة للمخزن'}
              </h3>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-zinc-400 hover:text-rose-500 transition-all"><X className="w-6 h-6"/></button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">كود المادة</label>
                 <input type="text" className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-mono font-black outline-none focus:border-emerald-500 transition-all" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="كود..." />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">اسم المادة / الصنف</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-black outline-none focus:border-emerald-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="اسم المادة..." />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">المستودع</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-black outline-none" value={formData.warehouse} onChange={e => setFormData({...formData, warehouse: e.target.value})}>
                    {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                 </select>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">وحدة القياس</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-black outline-none shadow-sm" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="قطعة">قطعة</option>
                    <option value="كيلو">كيلو</option>
                    <option value="متر">متر</option>
                    <option value="طرد">طرد</option>
                    <option value="كرتونة">كرتونة</option>
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">نوع الحركة</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-black outline-none shadow-sm" value={formData.movementType} onChange={e => setFormData({...formData, movementType: e.target.value})}>
                    <option value="إدخال">إدخال</option>
                    <option value="صرف">صرف</option>
                    <option value="مرتجع">مرتجع</option>
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-rose-500 font-black uppercase tracking-widest mr-1">رصيد أول المدة</label>
                 <input type="number" className="bg-white dark:bg-zinc-900 border-2 border-rose-500/20 text-rose-600 p-3 rounded-2xl font-mono font-black text-center outline-none focus:border-rose-500 shadow-inner" value={formData.openingStock} onChange={e => setFormData({...formData, openingStock: Number(e.target.value)})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mr-1">الكمية الحالية</label>
                 <input type="number" className="bg-white dark:bg-zinc-900 border-2 border-emerald-500/20 text-emerald-600 p-3 rounded-2xl font-mono font-black text-center outline-none focus:border-emerald-500 shadow-inner" value={formData.currentInputQty} onChange={e => setFormData({...formData, currentInputQty: Number(e.target.value)})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest mr-1">سعر الوحدة</label>
                 <input type="number" className="bg-white dark:bg-zinc-900 border-2 border-amber-500/20 text-amber-600 p-3 rounded-2xl font-mono font-black text-center outline-none focus:border-amber-500 shadow-inner" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t dark:border-zinc-800">
              <button onClick={handleSaveItem} className="bg-emerald-600 text-white px-16 py-4 rounded-3xl font-black shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all text-lg">
                 <Save className="w-6 h-6" /> {editingId ? 'تحديث البيانات' : 'حفظ المادة وتثبيت الرصيد'}
              </button>
           </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-emerald-600 text-[10px] text-white font-black uppercase tracking-widest border-b border-emerald-700 h-12">
                <th className="p-4 border-l border-emerald-700">كود</th>
                <th className="p-4 border-l border-emerald-700">المادة</th>
                <th className="p-4 border-l border-emerald-700">المستودع</th>
                <th className="p-4 border-l border-emerald-700">الوحدة</th>
                <th className="p-4 border-l border-emerald-700 text-center">السعر</th>
                <th className="p-4 border-l border-emerald-700 text-center">أول المدة</th>
                <th className="p-4 border-l border-emerald-700 text-center">الإضافات</th>
                <th className="p-4 border-l border-emerald-700 text-center">الصرف</th>
                <th className="p-4 border-l border-emerald-700 text-center">المرتجع</th>
                <th className="p-4 text-center font-black bg-emerald-700">الرصيد الكلي</th>
                <th className="p-4 text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-emerald-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 font-mono text-emerald-600 border-l dark:border-zinc-800">{item.code}</td>
                  <td className="p-4 border-l dark:border-zinc-800">{item.name}</td>
                  <td className="p-4 border-l dark:border-zinc-800 text-xs text-zinc-500">{item.warehouse}</td>
                  <td className="p-4 border-l dark:border-zinc-800 text-xs text-zinc-500">{item.unit}</td>
                  <td className="p-4 text-center font-mono border-l dark:border-zinc-800 text-amber-600">{item.price.toLocaleString()}</td>
                  <td className="p-4 text-center font-mono border-l dark:border-zinc-800">{item.openingStock.toLocaleString()}</td>
                  <td className="p-4 text-center font-mono text-emerald-600 border-l dark:border-zinc-800">+{item.added.toLocaleString()}</td>
                  <td className="p-4 text-center font-mono text-rose-600 border-l dark:border-zinc-800">-{item.issued.toLocaleString()}</td>
                  <td className="p-4 text-center font-mono text-amber-500 border-l dark:border-zinc-800">+{item.returned.toLocaleString()}</td>
                  <td className={`p-4 text-center font-mono text-lg ${item.currentBalance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{item.currentBalance.toLocaleString()}</td>
                  <td className="p-4 no-print">
                     <div className="flex justify-center gap-2">
                        <button onClick={() => { setEditingId(item.id); setFormData({...item, currentInputQty: 0}); setIsAdding(true); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500"><Trash2 className="w-4 h-4" /></button>
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

export default InventoryView;
