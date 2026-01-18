
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Package, Plus, Trash2, Edit2, FileDown, Printer, Box, Save, X } from 'lucide-react';
import { StockEntry, InventoryItem, WarehouseEntity } from '../types';
import { exportToCSV } from '../utils/export';

interface InventoryViewProps {
  onBack: () => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ onBack }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    code: '', name: '', category: 'عام', unit: 'قطعة', price: 0, openingStock: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedItems = localStorage.getItem('sheno_inventory_list');
    const savedEntries = localStorage.getItem('sheno_stock_entries');
    
    let baseItems: InventoryItem[] = savedItems ? JSON.parse(savedItems) : [];
    const entries: StockEntry[] = savedEntries ? JSON.parse(savedEntries) : [];

    // Aggregate balances from entries
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
        currentBalance: item.openingStock + added - issued + returned
      };
    });

    setItems(updatedItems);
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.code) return;
    
    const saved = localStorage.getItem('sheno_inventory_list');
    let all: InventoryItem[] = saved ? JSON.parse(saved) : [];
    
    if (editingId) {
      all = all.map(i => i.id === editingId ? { ...i, ...formData } as InventoryItem : i);
    } else {
      all = [...all, { ...formData, id: crypto.randomUUID(), added: 0, issued: 0, returned: 0, currentBalance: formData.openingStock || 0 } as InventoryItem];
    }

    localStorage.setItem('sheno_inventory_list', JSON.stringify(all));
    setIsAdding(false);
    setEditingId(null);
    setFormData({ code: '', name: '', category: 'عام', unit: 'قطعة', price: 0, openingStock: 0 });
    loadData();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('حذف هذه المادة من النظام؟ لن يتم حذف حركاتها السابقة من السجلات.')) {
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
    item.name.includes(searchTerm) || item.code.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold tracking-tight">قائمة المواد والجرد</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsAdding(true)} className="bg-primary text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all">
             <Plus className="w-5 h-5" /> إضافة مادة جديدة
          </button>
          <button onClick={() => exportToCSV(items, 'inventory_report')} className="bg-zinc-800 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-700 transition-all">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
          <button onClick={() => window.print()} className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-6 py-2 rounded-xl font-bold flex items-center gap-2">
             <Printer className="w-5 h-5" /> طباعة
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95 no-print">
           <h3 className="text-lg font-bold flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <Box className="w-5 h-5 text-primary" /> تفاصيل المادة المستودعية
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                 <label className="text-xs text-zinc-500 font-bold">كود المادة</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono font-bold" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                 <label className="text-xs text-zinc-500 font-bold">اسم المادة / الصنف</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-xs text-zinc-500 font-bold">الوحدة</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="قطعة">قطعة</option>
                    <option value="كيلو">كيلو</option>
                    <option value="متر">متر</option>
                    <option value="علبة">علبة</option>
                    <option value="كيس">كيس</option>
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-xs text-zinc-500 font-bold">السعر الافتراضي</label>
                 <input type="number" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono font-bold text-emerald-500" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-xs text-zinc-500 font-bold">رصيد أول المدة</label>
                 <input type="number" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono font-bold" value={formData.openingStock} onChange={e => setFormData({...formData, openingStock: Number(e.target.value)})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-xs text-zinc-500 font-bold">التصنيف</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
           </div>
           <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={handleSaveItem} className="bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                 <Save className="w-5 h-5" /> {editingId ? 'تحديث البيانات' : 'حفظ المادة في النظام'}
              </button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-8 py-3 rounded-2xl font-bold">إلغاء</button>
           </div>
        </div>
      )}

      <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 no-print shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="ابحث باسم المادة أو كود الصنف للوصول السريع..."
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pr-12 pl-4 outline-none focus:ring-2 focus:ring-primary transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                <th className="p-4">كود</th>
                <th className="p-4">المادة</th>
                <th className="p-4 text-center">الوحدة</th>
                <th className="p-4 text-center">أول المدة</th>
                <th className="p-4 text-center">الإضافات</th>
                <th className="p-4 text-center">الصرف</th>
                <th className="p-4 text-center">مرتجع</th>
                <th className="p-4 text-center font-black text-primary">الرصيد الكلي</th>
                <th className="p-4 text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-20 text-center text-zinc-500 italic font-bold">لا توجد مواد مسجلة حالياً، ابدأ بإضافة أول مادة للمستودع.</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-4 font-mono text-primary">{item.code}</td>
                    <td className="p-4">
                       <div className="flex flex-col">
                          <span>{item.name}</span>
                          <span className="text-[10px] text-zinc-500 font-normal">{item.category}</span>
                       </div>
                    </td>
                    <td className="p-4 text-center text-zinc-500 font-normal">{item.unit}</td>
                    <td className="p-4 text-center font-mono">{item.openingStock.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono text-emerald-500">+{item.added.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono text-rose-500">-{item.issued.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono text-amber-500">+{item.returned.toLocaleString()}</td>
                    <td className={`p-4 text-center font-mono text-lg bg-primary/5 ${item.currentBalance < 0 ? 'text-rose-500' : 'text-primary'}`}>{item.currentBalance.toLocaleString()}</td>
                    <td className="p-4 no-print">
                       <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingId(item.id); setFormData(item); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryView;
