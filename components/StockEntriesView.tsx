
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Save, X, Search, Filter, Warehouse as WarehouseIcon, FileDown, Printer } from 'lucide-react';
import { StockEntry, InventoryItem, WarehouseEntity } from '../types';
import { exportToCSV } from '../utils/export';

interface StockEntriesViewProps {
  onBack: () => void;
}

const StockEntriesView: React.FC<StockEntriesViewProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseEntity[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Partial<StockEntry>>({
    date: new Date().toISOString().split('T')[0],
    itemName: '',
    itemCode: '',
    unit: 'قطعة',
    price: 0,
    warehouse: 'المستودع الرئيسي',
    movementType: 'إدخال',
    quantity: 0,
    invoiceNumber: '',
    statement: ''
  });

  useEffect(() => {
    const savedEntries = localStorage.getItem('sheno_stock_entries');
    const savedInventory = localStorage.getItem('sheno_inventory_list');
    const savedWarehouses = localStorage.getItem('sheno_warehouses');

    if (savedEntries) setEntries(JSON.parse(savedEntries));
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedWarehouses) setWarehouses(JSON.parse(savedWarehouses));
    else setWarehouses([{ id: '1', name: 'المستودع الرئيسي', location: 'دمشق', isMain: true }]);
  }, []);

  const handleMaterialSelect = (code: string) => {
    const material = inventory.find(i => i.code === code);
    if (material) {
      setFormData({
        ...formData,
        itemCode: material.code,
        itemName: material.name,
        unit: material.unit,
        price: material.price
      });
    }
  };

  const handleSave = () => {
    if (!formData.itemCode || !formData.quantity) return;
    
    const entry: StockEntry = { 
      ...formData as StockEntry, 
      id: editingId || crypto.randomUUID(),
      day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date(formData.date!))
    };
    
    const updated = editingId 
      ? entries.map(e => e.id === editingId ? entry : e) 
      : [entry, ...entries];
      
    setEntries(updated);
    localStorage.setItem('sheno_stock_entries', JSON.stringify(updated));
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      itemName: '',
      itemCode: '',
      unit: 'قطعة',
      price: 0,
      warehouse: warehouses.find(w => w.isMain)?.name || 'المستودع الرئيسي',
      movementType: 'إدخال',
      quantity: 0,
      invoiceNumber: '',
      statement: ''
    });
  };

  const filteredEntries = entries.filter(e => 
    e.itemName.includes(searchTerm) || e.itemCode.includes(searchTerm) || e.invoiceNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold tracking-tight">حركات الإدخال والصرف</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }} className="bg-primary text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all">
            <Plus className="w-5 h-5" /> قيد مستودعي جديد
          </button>
          <button onClick={() => exportToCSV(entries, 'stock_entries')} className="bg-zinc-800 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-700 transition-all">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
          <button onClick={() => window.print()} className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-6 py-2 rounded-xl font-bold flex items-center gap-2">
             <Printer className="w-5 h-5" /> طباعة
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-300 no-print">
           <h3 className="text-lg font-bold text-primary border-b border-zinc-100 dark:border-zinc-800 pb-3">إدخال بيانات الحركة المستودعية</h3>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                 <label className="text-xs text-zinc-500 font-bold">التاريخ</label>
                 <input type="date" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                 <label className="text-xs text-zinc-500 font-bold">المادة (اختيار من القائمة)</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.itemCode} onChange={e => handleMaterialSelect(e.target.value)}>
                    <option value="">-- اختر مادة من المستودع --</option>
                    {inventory.map(i => <option key={i.id} value={i.code}>{i.name} ({i.code})</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-xs text-zinc-500 font-bold">المستودع</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold" value={formData.warehouse} onChange={e => setFormData({...formData, warehouse: e.target.value})}>
                    {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-xs text-zinc-500 font-bold">نوع الحركة</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold" value={formData.movementType} onChange={e => setFormData({...formData, movementType: e.target.value as any})}>
                    <option value="إدخال">إدخال (توريد)</option>
                    <option value="صرف">صرف (إخراج)</option>
                    <option value="مرتجع">مرتجع (إرجاع للمستودع)</option>
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-xs text-zinc-500 font-bold">الكمية</label>
                 <input type="number" step="0.001" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono text-xl text-primary font-bold outline-none" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-xs text-zinc-500 font-bold">رقم الفاتورة المرتبطة</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} />
              </div>
           </div>
           
           <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 font-bold">البيان / تفاصيل إضافية</label>
              <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700" value={formData.statement} onChange={e => setFormData({...formData, statement: e.target.value})} />
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={handleSave} className="bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                <Save className="w-5 h-5"/> {editingId ? 'تحديث القيد' : 'تثبيت الحركة'}
              </button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-8 py-3 rounded-2xl font-bold">إلغاء</button>
           </div>
        </div>
      )}

      <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 no-print shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="البحث باسم الصنف، كود، أو رقم فاتورة..."
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pr-12 pl-4 outline-none focus:ring-2 focus:ring-primary transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <table className="w-full text-right border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
              <th className="p-4">تاريخ</th>
              <th className="p-4">المستودع</th>
              <th className="p-4">المادة</th>
              <th className="p-4 text-center">الكمية</th>
              <th className="p-4 text-center">النوع</th>
              <th className="p-4">المرجع</th>
              <th className="p-4 text-center no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
            {filteredEntries.map(e => (
              <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                <td className="p-4 font-mono text-zinc-400">{e.date}</td>
                <td className="p-4 text-emerald-500 flex items-center gap-2">
                   <WarehouseIcon className="w-4 h-4" /> {e.warehouse}
                </td>
                <td className="p-4">
                   <div className="flex flex-col">
                      <span className="text-zinc-800 dark:text-zinc-100">{e.itemName}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Code: {e.itemCode}</span>
                   </div>
                </td>
                <td className="p-4 text-center font-mono text-lg">{e.quantity.toLocaleString()}</td>
                <td className="p-4 text-center">
                   <span className={`px-2 py-1 rounded-full text-[10px] font-black ${
                     e.movementType === 'إدخال' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                     e.movementType === 'صرف' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 
                     'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                   }`}>
                      {e.movementType}
                   </span>
                </td>
                <td className="p-4 font-mono text-zinc-500">{e.invoiceNumber || '---'}</td>
                <td className="p-4 no-print">
                   <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(e.id); setIsAdding(true); setFormData(e); }} className="p-2 text-zinc-500 hover:text-primary transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => {
                         const updated = entries.filter(x => x.id !== e.id);
                         setEntries(updated);
                         localStorage.setItem('sheno_stock_entries', JSON.stringify(updated));
                      }} className="p-2 text-zinc-500 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockEntriesView;
