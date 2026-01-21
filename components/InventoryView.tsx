
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
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    code: '', name: '', category: 'عام', unit: 'قطعة', price: 0, openingStock: 0, warehouse: 'المستودع الرئيسي'
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
    
    if (editingId) {
      all = all.map(i => i.id === editingId ? { ...i, ...formData } as InventoryItem : i);
    } else {
      all = [...all, { ...formData, id: crypto.randomUUID(), added: 0, issued: 0, returned: 0, currentBalance: formData.openingStock || 0 } as InventoryItem];
    }

    localStorage.setItem('sheno_inventory_list', JSON.stringify(all));
    setIsAdding(false);
    setEditingId(null);
    setFormData({ code: '', name: '', category: 'عام', unit: 'قطعة', price: 0, openingStock: 0, warehouse: warehouses[0]?.name || 'المستودع الرئيسي' });
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
      <div className="print-only print-header flex justify-between items-center bg-emerald-600 p-6 rounded-t-xl text-white mb-0 border-b-0">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
          <div>
            <h1 className="text-2xl font-black">{settings?.companyName}</h1>
            <p className="text-xs opacity-80">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black underline decoration-white/30 underline-offset-8">تقرير جرد المستودع العام</h2>
          <p className="text-xs mt-2 opacity-80 flex items-center justify-center gap-1"><Calendar className="w-3 h-3"/> تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        <div className="text-left text-xs font-bold space-y-1">
          <p>{settings?.address}</p>
          <p>{settings?.phone}</p>
        </div>
      </div>

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
          <button onClick={() => window.print()} className="bg-zinc-100 dark:bg-zinc-800 text-readable border border-zinc-200 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2">
             <Printer className="w-5 h-5" /> طباعة PDF
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
                 <div className="relative">
                    <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="text" className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 pr-10 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-mono font-black outline-none focus:border-emerald-500 transition-all" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="مثلاً: ITEM-001" />
                 </div>
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">اسم المادة / الصنف</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-black outline-none focus:border-emerald-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="اسم المادة..." />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">المستودع المخصص</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-black outline-none appearance-none cursor-pointer" value={formData.warehouse} onChange={e => setFormData({...formData, warehouse: e.target.value})}>
                    {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                 </select>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">وحدة القياس</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-black outline-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="قطعة">قطعة</option>
                    <option value="كيلو">كيلو</option>
                    <option value="متر">متر</option>
                    <option value="طرد">طرد</option>
                    <option value="كرتونة">كرتونة</option>
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">سعر المادة</label>
                 <div className="relative">
                    <Coins className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    <input type="number" className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 pr-10 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-mono font-black text-amber-600 outline-none" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                 </div>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mr-1">رصيد أول المدة (الكمية)</label>
                 <input type="number" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-emerald-500/20 text-emerald-600 p-3 rounded-2xl font-mono font-black text-2xl text-center outline-none focus:border-emerald-500 transition-all" value={formData.openingStock} onChange={e => setFormData({...formData, openingStock: Number(e.target.value)})} />
              </div>
              <div className="flex flex-col justify-end pb-1">
                 <p className="text-[9px] text-zinc-400 font-bold leading-tight">سيتم اعتماد هذه الكمية كـ "رصيد افتتاحي" للمادة في المستودع المحدد.</p>
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={handleSaveItem} className="bg-emerald-600 text-white px-16 py-4 rounded-3xl font-black shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all text-lg">
                 <Save className="w-6 h-6" /> {editingId ? 'تحديث البيانات' : 'حفظ المادة وتثبيت الرصيد'}
              </button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-10 py-4 rounded-2xl font-bold">إلغاء</button>
           </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl print:border-emerald-600 print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-emerald-600 text-[10px] text-white font-black uppercase tracking-widest border-b border-emerald-700 h-12">
                <th className="p-4 border-l border-emerald-700">كود</th>
                <th className="p-4 border-l border-emerald-700">المادة</th>
                <th className="p-4 border-l border-emerald-700">المستودع</th>
                <th className="p-4 border-l border-emerald-700 text-center">الوحدة</th>
                <th className="p-4 border-l border-emerald-700 text-center">السعر</th>
                <th className="p-4 border-l border-emerald-700 text-center">أول المدة</th>
                <th className="p-4 border-l border-emerald-700 text-center">الإضافات</th>
                <th className="p-4 border-l border-emerald-700 text-center">الصرف</th>
                <th className="p-4 border-l border-emerald-700 text-center">المرتجع</th>
                <th className="p-4 text-center font-black bg-emerald-700">الرصيد الكلي</th>
                <th className="p-4 text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold print:divide-zinc-300">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-20 text-center text-zinc-500 italic font-bold">لا توجد مواد مسجلة حالياً.</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-emerald-50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-4 font-mono text-emerald-600 border-l border-zinc-100 dark:border-zinc-800">{item.code}</td>
                    <td className="p-4 border-l border-zinc-100 dark:border-zinc-800">{item.name}</td>
                    <td className="p-4 text-zinc-500 text-xs border-l border-zinc-100 dark:border-zinc-800">{item.warehouse}</td>
                    <td className="p-4 text-center text-zinc-500 font-normal border-l border-zinc-100 dark:border-zinc-800">{item.unit}</td>
                    <td className="p-4 text-center font-mono text-amber-600 border-l border-zinc-100 dark:border-zinc-800">{item.price.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono border-l border-zinc-100 dark:border-zinc-800">{item.openingStock.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono text-emerald-600 border-l border-zinc-100 dark:border-zinc-800">+{item.added.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono text-rose-600 border-l border-zinc-100 dark:border-zinc-800">-{item.issued.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono text-amber-500 border-l border-zinc-100 dark:border-zinc-800">+{item.returned.toLocaleString()}</td>
                    <td className={`p-4 text-center font-mono text-lg ${item.currentBalance < 0 ? 'text-rose-600 bg-rose-50' : 'text-emerald-700 bg-emerald-50'} print:bg-transparent`}>{item.currentBalance.toLocaleString()}</td>
                    <td className="p-4 no-print">
                       <div className="flex justify-center gap-2">
                          <button onClick={() => { setEditingId(item.id); setFormData(item); setIsAdding(true); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"><Edit2 className="w-4 h-4" /></button>
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
