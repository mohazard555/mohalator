
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Save, X, Search, Filter, Warehouse as WarehouseIcon, FileDown, Printer, Users, MessageSquare, Calendar, ChevronDown, Check, Package, StickyNote } from 'lucide-react';
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

  const totalQuantity = filteredEntries.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Print Header */}
      <div className="print-only print-header flex justify-between items-center bg-zinc-900 p-8 rounded-t-3xl text-white mb-0 border-b-4 border-primary">
        <div className="flex items-center gap-6">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-20 h-20 object-contain bg-white p-1 rounded-2xl" />}
          <div>
            <h1 className="text-3xl font-black">{settings?.companyName}</h1>
            <p className="text-sm font-bold opacity-70 tracking-widest">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black underline decoration-primary underline-offset-8">سجل الجرد والمطابقة المستودعية</h2>
          <div className="flex flex-col gap-1 mt-3">
             <span className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold border border-white/20">الفترة: {startDate || 'البداية'} ← {endDate || 'اليوم'}</span>
             <span className="text-[10px] opacity-60">نوع الحركة: {filterType} | عدد القيود: {filteredEntries.length}</span>
          </div>
        </div>
        <div className="text-left text-xs font-bold space-y-1">
          <p className="text-primary font-black uppercase">إدارة المستودعات المركزية</p>
          <p dir="ltr">{new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">إدخالات وصرف المواد (الجرد)</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all">
            <Plus className="w-5 h-5" /> قيد مستودعي جديد
          </button>
          <button onClick={() => exportToCSV(filteredEntries, 'stock_inventory_audit')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
          <button onClick={() => window.print()} className="bg-zinc-100 dark:bg-zinc-800 text-readable px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-zinc-200 dark:border-zinc-700">
             <Printer className="w-5 h-5" /> طباعة المفلتر
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4 no-print">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] space-y-1">
             <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">بحث عام</label>
             <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="اسم الصنف، كود، ملاحظات..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-primary p-3 pr-12 rounded-2xl font-bold outline-none transition-all text-readable"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="w-44 space-y-1">
             <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">نوع الحركة</label>
             <div className="relative">
                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <select 
                  className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 pr-10 rounded-2xl font-black outline-none border-2 border-transparent focus:border-primary appearance-none cursor-pointer"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                >
                   <option value="الكل">جميع الحركات</option>
                   <option value="إدخال">إدخال (توريد)</option>
                   <option value="صرف">صرف (إخراج)</option>
                   <option value="مرتجع">مرتجع</option>
                </select>
             </div>
          </div>

          <div className="flex-1 min-w-[200px] space-y-1 relative">
             <label className="text-[10px] font-black text-zinc-500 uppercase mr-1">تحديد مواد للجرد (متعدد)</label>
             <button 
               onClick={() => setShowItemDropdown(!showItemDropdown)}
               className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 px-4 rounded-2xl flex items-center justify-between font-bold text-readable hover:bg-zinc-100 transition-all border-2 border-transparent"
             >
                <div className="flex items-center gap-2 truncate">
                   <Package className="w-4 h-4 text-primary shrink-0" />
                   <span className="truncate">{selectedItems.length > 0 ? `مختار (${selectedItems.length}) مواد` : 'جميع مواد المستودع'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showItemDropdown ? 'rotate-180' : ''}`} />
             </button>
             
             {showItemDropdown && (
               <div className="absolute top-full right-0 left-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2 animate-in slide-in-from-top-2">
                  <button onClick={() => setSelectedItems([])} className="w-full text-right p-2 text-[10px] font-black text-primary border-b mb-1 hover:bg-zinc-50 rounded-lg">إعادة تعيين (عرض الكل)</button>
                  {inventory.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => toggleItemSelection(item.code)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedItems.includes(item.code) ? 'bg-primary/10 text-primary' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                    >
                       <div className="flex flex-col">
                          <span className="font-bold text-xs">{item.name}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">{item.code}</span>
                       </div>
                       {selectedItems.includes(item.code) && <Check className="w-4 h-4" />}
                    </div>
                  ))}
               </div>
             )}
          </div>

          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border-2 border-transparent h-[52px]">
             <Calendar className="w-4 h-4 text-zinc-400" />
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-zinc-500">من</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none focus:text-primary transition-colors" />
                <span className="text-[10px] font-black text-zinc-500">إلى</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono outline-none focus:text-primary transition-colors" />
             </div>
          </div>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-300 no-print">
           <h3 className="text-lg font-black text-primary border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <Package className="w-5 h-5"/> {editingId ? 'تعديل بيانات القيد المستودعي' : 'إدخال حركة مستودعية جديدة'}
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">التاريخ</label>
                 <input type="date" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">المادة (اختيار من المستودع)</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.itemCode} onChange={e => handleMaterialSelect(e.target.value)}>
                    <option value="">-- اختر مادة من المستودع --</option>
                    {inventory.map(i => <option key={i.id} value={i.code}>{i.name} ({i.code})</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">نوع الحركة</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold" value={formData.movementType} onChange={e => setFormData({...formData, movementType: e.target.value as any})}>
                    <option value="إدخال">إدخال (توريد)</option>
                    <option value="صرف">صرف (إخراج)</option>
                    <option value="مرتجع">مرتجع (إرجاع للمستودع)</option>
                 </select>
              </div>
              
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">العميل / المورد</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})}>
                    <option value="">-- اختر الطرف المرتبط --</option>
                    {parties.map(p => <option key={p.id} value={p.name}>{p.name} ({p.type})</option>)}
                 </select>
              </div>

              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم الفاتورة</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-mono font-bold text-center" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} placeholder="0000" />
              </div>

              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-primary font-black uppercase tracking-widest mr-1">الكمية</label>
                 <input type="number" step="0.001" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-mono text-xl text-primary font-black outline-none text-center" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
              </div>

              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">المستودع</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold" value={formData.warehouse} onChange={e => setFormData({...formData, warehouse: e.target.value})}>
                    {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                 </select>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">البيان / الوصف</label>
                <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold" value={formData.statement} onChange={e => setFormData({...formData, statement: e.target.value})} placeholder="اكتب تفاصيل القيد هنا..." />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">ملاحظات إضافية</label>
                <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="أي ملاحظات فنية أو إدارية..." />
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={handleSave} className="bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                <Save className="w-5 h-5"/> {editingId ? 'تحديث القيد' : 'تثبيت الحركة'}
              </button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-8 py-3 rounded-2xl font-bold">إلغاء</button>
           </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl print:border-zinc-900 print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-zinc-900 text-[10px] text-white font-black uppercase tracking-widest border-b border-zinc-800 h-14">
                <th className="p-4 border-l border-zinc-800 w-12 text-center text-zinc-400">#</th>
                <th className="p-4 border-l border-zinc-800">التاريخ</th>
                <th className="p-4 border-l border-zinc-800">المادة</th>
                <th className="p-4 border-l border-zinc-800 text-center">نوع الحركة</th>
                <th className="p-4 border-l border-zinc-800 text-center font-black">الكمية</th>
                <th className="p-4 border-l border-zinc-800">الطرف المرتبط</th>
                <th className="p-4 border-l border-zinc-800">رقم الفاتورة</th>
                <th className="p-4 border-l border-zinc-800">البيان</th>
                <th className="p-4 border-l border-zinc-800">ملاحظات</th>
                <th className="p-4 text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold print:divide-zinc-300">
              {filteredEntries.length === 0 ? (
                <tr><td colSpan={10} className="p-20 text-center text-zinc-400 italic font-black text-lg">لا توجد قيود مستودعية تطابق معايير الفلترة الحالية</td></tr>
              ) : (
                <>
                  {filteredEntries.map((e, idx) => (
                    <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group h-12">
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-400">{filteredEntries.length - idx}</td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 font-mono text-zinc-500 text-center">{e.date}</td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800">
                         <div className="flex flex-col">
                            <span className="text-readable">{e.itemName}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">Code: {e.itemCode}</span>
                         </div>
                      </td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
                           e.movementType === 'إدخال' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                           e.movementType === 'صرف' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 
                           'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                         }`}>
                            {e.movementType}
                         </span>
                      </td>
                      <td className="p-2 text-center font-mono text-lg border-l border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 print:bg-transparent">{e.quantity.toLocaleString()}</td>
                      <td className="p-2 text-primary border-l border-zinc-100 dark:border-zinc-800">{e.partyName || '---'}</td>
                      <td className="p-2 font-mono text-zinc-500 border-l border-zinc-100 dark:border-zinc-800 text-center">#{e.invoiceNumber || '---'}</td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-zinc-500 text-[10px] italic max-w-[120px] truncate">{e.statement || '---'}</td>
                      <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-rose-700 text-[10px] font-black max-w-[120px] truncate">
                         {e.notes ? <div className="flex items-center gap-1"><StickyNote className="w-2.5 h-2.5" /> {e.notes}</div> : '---'}
                      </td>
                      <td className="p-2 no-print">
                         <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingId(e.id); setIsAdding(true); setFormData(e); }} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => {
                               if(window.confirm('حذف هذا القيد نهائياً؟')) {
                                  const updated = entries.filter(x => x.id !== e.id);
                                  setEntries(updated);
                                  localStorage.setItem('sheno_stock_entries', JSON.stringify(updated));
                               }
                            }} className="p-1.5 hover:bg-rose-500/10 rounded-lg text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-900 text-white font-black h-12">
                     <td colSpan={4} className="p-3 text-center uppercase tracking-widest text-[10px] text-zinc-400 border-l border-zinc-800">إجمالي الكميات المفلترة للعملية</td>
                     <td className="p-3 text-center font-mono text-xl text-primary">{totalQuantity.toLocaleString()}</td>
                     <td colSpan={5} className="p-3"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="text-zinc-500 text-[10px] font-black uppercase text-center py-4 tracking-[0.5em] no-print">
        {settings?.companyName} INVENTORY AUDIT SYSTEM v4.1
      </div>
    </div>
  );
};

export default StockEntriesView;
