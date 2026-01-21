
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Save, X, Search, Warehouse as WarehouseIcon, FileDown, Calendar, ChevronDown, Check, Package } from 'lucide-react';
import { StockEntry, InventoryItem, WarehouseEntity, Party, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

interface StockEntriesViewProps {
  onBack: () => void;
}

const StockEntriesView: React.FC<StockEntriesViewProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseEntity[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('الكل');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);

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
    partyName: '',
    statement: '',
    notes: ''
  });

  useEffect(() => {
    const savedEntries = localStorage.getItem('sheno_stock_entries');
    const savedInventory = localStorage.getItem('sheno_inventory_list');
    const savedWarehouses = localStorage.getItem('sheno_warehouses');
    const savedParties = localStorage.getItem('sheno_parties');
    const savedSettings = localStorage.getItem('sheno_settings');

    if (savedEntries) setEntries(JSON.parse(savedEntries));
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedWarehouses) setWarehouses(JSON.parse(savedWarehouses));
    else setWarehouses([{ id: '1', name: 'المستودع الرئيسي', location: 'دمشق', isMain: true }]);
    if (savedParties) setParties(JSON.parse(savedParties));
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
      partyName: '',
      statement: '',
      notes: ''
    });
  };

  const toggleItemSelection = (code: string) => {
    setSelectedItems(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const filteredEntries = entries.filter(e => {
    const matchText = e.itemName.includes(searchTerm) || 
                     e.itemCode.includes(searchTerm) || 
                     e.invoiceNumber.includes(searchTerm) ||
                     (e.partyName && e.partyName.includes(searchTerm)) ||
                     (e.notes && e.notes.includes(searchTerm));
    
    const matchType = filterType === 'الكل' || e.movementType === filterType;
    const matchDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
    const matchItems = selectedItems.length === 0 || selectedItems.includes(e.itemCode);

    return matchText && matchType && matchDate && matchItems;
  });

  const totalQty = filteredEntries.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">إدخالات وصرف المواد (السجل التفصيلي)</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl">
            <Plus className="w-5 h-5" /> قيد مستودعي جديد
          </button>
          <button onClick={() => exportToCSV(filteredEntries, 'stock_entries')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2">
             <FileDown className="w-5 h-5" /> XLSX
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/90 p-6 rounded-[2.5rem] border border-zinc-800 shadow-2xl space-y-4 no-print">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] flex flex-col gap-1">
             <label className="text-[10px] font-black text-zinc-500 uppercase mr-1 tracking-widest">بحث نصي (مادة، كود، بيان)</label>
             <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="ابحث هنا..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pr-12 outline-none font-bold text-readable focus:border-primary shadow-inner"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="flex-1 min-w-[200px] flex flex-col gap-1 relative">
             <label className="text-[10px] font-black text-zinc-500 uppercase mr-1 tracking-widest">تصفية حسب المادة</label>
             <button 
               onClick={() => setShowItemDropdown(!showItemDropdown)}
               className="w-full bg-zinc-950 border border-zinc-800 py-3 px-6 rounded-2xl flex items-center justify-between font-black text-readable shadow-inner"
             >
                <div className="flex items-center gap-2 truncate">
                   <Package className={`w-5 h-5 shrink-0 ${selectedItems.length > 0 ? 'text-primary' : 'text-zinc-500'}`} />
                   <span className="truncate">
                      {selectedItems.length === 0 ? 'جميع مواد المستودع' : `مختار (${selectedItems.length})`}
                   </span>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${showItemDropdown ? 'rotate-180' : ''}`} />
             </button>
             
             {showItemDropdown && (
               <div className="absolute top-full right-0 left-0 mt-3 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-50 p-2 animate-in zoom-in-95 max-h-64 overflow-y-auto">
                  <button onClick={() => setSelectedItems([])} className="w-full text-center py-2 text-[10px] font-black text-rose-500 uppercase border-b border-zinc-800 mb-2">إعادة تعيين</button>
                  {inventory.map(item => (
                    <div key={item.id} onClick={() => toggleItemSelection(item.code)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedItems.includes(item.code) ? 'bg-primary text-white shadow-lg' : 'hover:bg-zinc-800 text-zinc-400'}`}>
                       <span className="font-bold text-sm">{item.name}</span>
                       {selectedItems.includes(item.code) && <Check className="w-4 h-4" />}
                    </div>
                  ))}
               </div>
             )}
          </div>

          <div className="w-44 flex flex-col gap-1">
             <label className="text-[10px] font-black text-zinc-500 uppercase mr-1 tracking-widest">نوع الحركة</label>
             <select 
               className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl font-black outline-none shadow-inner text-readable"
               value={filterType}
               onChange={e => setFilterType(e.target.value)}
             >
                <option value="الكل">جميع الحركات</option>
                <option value="إدخال">إدخال مخزني</option>
                <option value="صرف">صرف مخزني</option>
                <option value="مرتجع">مرتجع</option>
             </select>
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-[10px]">
            <thead>
              <tr className="bg-zinc-900 text-white font-black border-b border-zinc-800 h-14 uppercase tracking-tighter shadow-md">
                <th className="p-3 border-l border-zinc-800 w-24 text-center">التاريخ</th>
                <th className="p-3 border-l border-zinc-800 w-20 text-center">اليوم</th>
                <th className="p-3 border-l border-zinc-800 w-24 text-center">كود الصنف</th>
                <th className="p-3 border-l border-zinc-800">اسم الصنف</th>
                <th className="p-3 border-l border-zinc-800 w-16 text-center">الوحدة</th>
                <th className="p-3 border-l border-zinc-800 w-24 text-center">السعر</th>
                <th className="p-3 border-l border-zinc-800 w-24 text-center">الحركة</th>
                <th className="p-3 border-l border-zinc-800 w-24 text-center font-black">الكمية</th>
                <th className="p-3 border-l border-zinc-800">البيان</th>
                <th className="p-3 border-l border-zinc-800">ملاحظات</th>
                <th className="p-3 text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-bold bg-zinc-950 text-zinc-300">
              {filteredEntries.map((e, idx) => (
                <tr key={e.id} className="hover:bg-zinc-900 transition-colors h-12">
                  <td className="p-2 border-l border-zinc-900 font-mono text-zinc-500 text-center">{e.date}</td>
                  <td className="p-2 border-l border-zinc-900 text-center text-zinc-400">{e.day || '---'}</td>
                  <td className="p-2 border-l border-zinc-900 font-mono text-primary text-center">{e.itemCode}</td>
                  <td className="p-2 border-l border-zinc-900 text-white">{e.itemName}</td>
                  <td className="p-2 border-l border-zinc-900 text-center text-zinc-500">{e.unit}</td>
                  <td className="p-2 border-l border-zinc-900 text-center font-mono text-amber-500">{e.price?.toLocaleString()}</td>
                  <td className="p-2 border-l border-zinc-900 text-center">
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black ${
                       e.movementType === 'إدخال' ? 'bg-emerald-500/10 text-emerald-600' : 
                       e.movementType === 'صرف' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                     }`}>
                        {e.movementType}
                     </span>
                  </td>
                  <td className="p-2 text-center font-mono text-lg text-white border-l border-zinc-900 bg-zinc-900/30">{e.quantity.toLocaleString()}</td>
                  <td className="p-2 border-l border-zinc-900 text-zinc-400 text-[9px] italic truncate max-w-[150px]">{e.statement}</td>
                  <td className="p-2 border-l border-zinc-900 text-zinc-600 text-[9px] truncate max-w-[100px]">{e.notes || '-'}</td>
                  <td className="p-2 no-print">
                     <div className="flex justify-center gap-1">
                        <button onClick={() => { setEditingId(e.id); setIsAdding(true); setFormData(e); }} className="p-1.5 text-zinc-500 hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => {
                           if(window.confirm('حذف القيد؟')) {
                              const updated = entries.filter(x => x.id !== e.id);
                              setEntries(updated);
                              localStorage.setItem('sheno_stock_entries', JSON.stringify(updated));
                           }
                        }} className="p-1.5 text-zinc-500 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                     </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-zinc-900 text-white font-black h-14">
                 <td colSpan={7} className="p-3 text-center uppercase text-[10px] text-zinc-400 tracking-[0.2em]">إجمالي كمية الحركات المفلترة</td>
                 <td className="p-3 text-center font-mono text-xl text-primary">{totalQty.toLocaleString()}</td>
                 <td colSpan={3} className="p-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockEntriesView;
