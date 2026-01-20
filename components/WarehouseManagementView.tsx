
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Warehouse, MapPin, Save, X, Printer, ArrowLeftRight, Package, Calendar } from 'lucide-react';
import { WarehouseEntity, InventoryItem, StockEntry, AppSettings } from '../types';

interface WarehouseManagementViewProps {
  onBack: () => void;
}

const WarehouseManagementView: React.FC<WarehouseManagementViewProps> = ({ onBack }) => {
  const [warehouses, setWarehouses] = useState<WarehouseEntity[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<WarehouseEntity>>({
    name: '',
    location: '',
    isMain: false
  });

  // حالة نموذج النقل
  const [transferData, setTransferData] = useState({
    itemCode: '',
    fromWarehouse: '',
    toWarehouse: '',
    quantity: 1,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const savedW = localStorage.getItem('sheno_warehouses');
    const savedInv = localStorage.getItem('sheno_inventory_list');
    const savedSettings = localStorage.getItem('sheno_settings');
    
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedInv) setInventory(JSON.parse(savedInv));

    if (savedW) {
      setWarehouses(JSON.parse(savedW));
    } else {
      const defaultW = [{ id: '1', name: 'المستودع الرئيسي', location: 'دمشق', isMain: true }];
      setWarehouses(defaultW);
      localStorage.setItem('sheno_warehouses', JSON.stringify(defaultW));
    }
  }, []);

  const handleSave = () => {
    if (!formData.name) return;
    
    let updated: WarehouseEntity[];
    if (editingId) {
      updated = warehouses.map(w => w.id === editingId ? { ...w, ...formData } as WarehouseEntity : w);
    } else {
      updated = [...warehouses, { ...formData, id: crypto.randomUUID() } as WarehouseEntity];
    }

    if (formData.isMain) {
      updated = updated.map(w => w.id === (editingId || updated[updated.length-1].id) ? w : { ...w, isMain: false });
    }

    setWarehouses(updated);
    localStorage.setItem('sheno_warehouses', JSON.stringify(updated));
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', location: '', isMain: false });
  };

  const handleTransfer = () => {
    if (!transferData.itemCode || !transferData.fromWarehouse || !transferData.toWarehouse || transferData.quantity <= 0) {
      alert('يرجى إكمال كافة بيانات النقل');
      return;
    }
    if (transferData.fromWarehouse === transferData.toWarehouse) {
      alert('لا يمكن النقل لنفس المستودع');
      return;
    }

    const item = inventory.find(i => i.code === transferData.itemCode);
    if (!item) return;

    const savedStock = localStorage.getItem('sheno_stock_entries');
    let entries: StockEntry[] = savedStock ? JSON.parse(savedStock) : [];
    
    const dayName = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date(transferData.date));
    const transferId = crypto.randomUUID();

    // 1. قيد صرف من المستودع المصدر
    const outMove: StockEntry = {
      id: crypto.randomUUID(),
      date: transferData.date,
      day: dayName,
      department: 'تحويل مستودعي',
      itemCode: item.code,
      itemName: item.name,
      unit: item.unit,
      price: item.price,
      warehouse: transferData.fromWarehouse,
      movementType: 'صرف',
      quantity: transferData.quantity,
      invoiceNumber: 'TRANSFER',
      statement: `نقل إلى مستودع: ${transferData.toWarehouse}`,
      movementCode: transferId
    };

    // 2. قيد إدخال في المستودع الهدف
    const inMove: StockEntry = {
      id: crypto.randomUUID(),
      date: transferData.date,
      day: dayName,
      department: 'تحويل مستودعي',
      itemCode: item.code,
      itemName: item.name,
      unit: item.unit,
      price: item.price,
      warehouse: transferData.toWarehouse,
      movementType: 'إدخال',
      quantity: transferData.quantity,
      invoiceNumber: 'TRANSFER',
      statement: `نقل من مستودع: ${transferData.fromWarehouse}`,
      movementCode: transferId
    };

    const updatedEntries = [outMove, inMove, ...entries];
    localStorage.setItem('sheno_stock_entries', JSON.stringify(updatedEntries));
    
    alert(`تم نقل ${transferData.quantity} ${item.unit} بنجاح.`);
    setIsTransferring(false);
    setTransferData({ itemCode: '', fromWarehouse: '', toWarehouse: '', quantity: 1, date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6">
      {/* Print Header */}
      <div className="print-only print-header flex justify-between items-center bg-zinc-900 p-6 rounded-t-xl text-white mb-0 border-b-0">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg" />}
          <div>
            <h1 className="text-2xl font-black">{settings?.companyName}</h1>
            <p className="text-xs opacity-80">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black underline decoration-white/30 underline-offset-8">ملف المستودعات المعتمدة</h2>
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
          <h2 className="text-2xl font-black text-readable">إدارة ملف المستودعات</h2>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setIsTransferring(true)} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:brightness-110 transition-all">
              <ArrowLeftRight className="w-5 h-5" /> نقل مادة
           </button>
           <button onClick={() => window.print()} className="bg-zinc-100 dark:bg-zinc-800 text-readable px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-zinc-200 dark:border-zinc-700">
              <Printer className="w-5 h-5" /> طباعة
           </button>
           <button onClick={() => setIsAdding(true)} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 transition-all">
              <Plus className="w-5 h-5" /> إضافة مستودع جديد
           </button>
        </div>
      </div>

      {/* نموذج إضافة/تعديل مستودع */}
      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95 no-print text-readable">
           <div className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
              <h3 className="text-lg font-black flex items-center gap-2">
                 <Warehouse className="w-5 h-5 text-primary" /> {editingId ? 'تعديل بيانات مستودع' : 'تسجيل مستودع جديد'}
              </h3>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-zinc-400 hover:text-rose-500"><X className="w-6 h-6"/></button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">اسم المستودع</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">الموقع / العنوان</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
           </div>
           <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border dark:border-zinc-700">
              <input type="checkbox" id="main" checked={formData.isMain} onChange={e => setFormData({...formData, isMain: e.target.checked})} className="w-6 h-6 rounded-lg border-zinc-700 bg-zinc-800 text-primary cursor-pointer" />
              <label htmlFor="main" className="text-sm font-black cursor-pointer">تعيين كمستودع رئيسي (تلقائي للحركات)</label>
           </div>
           <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={handleSave} className="bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">حفظ البيانات</button>
           </div>
        </div>
      )}

      {/* نموذج نقل كميات */}
      {isTransferring && (
        <div className="bg-amber-500/5 dark:bg-amber-950/20 p-8 rounded-[2.5rem] border-2 border-amber-500/30 shadow-2xl space-y-6 animate-in slide-in-from-top-4 no-print text-readable">
           <div className="flex items-center justify-between border-b pb-4 border-amber-500/10">
              <h3 className="text-lg font-black flex items-center gap-2 text-amber-700 dark:text-amber-400">
                 <ArrowLeftRight className="w-6 h-6" /> نقل مادة من مستودع لآخر
              </h3>
              <button onClick={() => setIsTransferring(false)} className="text-zinc-400 hover:text-rose-500"><X className="w-6 h-6"/></button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">المادة المطلوب نقلها</label>
                 <select className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-amber-200 dark:border-amber-900 font-bold outline-none" value={transferData.itemCode} onChange={e => setTransferData({...transferData, itemCode: e.target.value})}>
                    <option value="">-- اختر مادة --</option>
                    {inventory.map(i => <option key={i.id} value={i.code}>{i.name} ({i.code})</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">من مستودع</label>
                 <select className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-amber-200 dark:border-amber-900 font-bold outline-none" value={transferData.fromWarehouse} onChange={e => setTransferData({...transferData, fromWarehouse: e.target.value})}>
                    <option value="">-- المصدر --</option>
                    {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">إلى مستودع</label>
                 <select className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-amber-200 dark:border-amber-900 font-bold outline-none" value={transferData.toWarehouse} onChange={e => setTransferData({...transferData, toWarehouse: e.target.value})}>
                    <option value="">-- الوجهة --</option>
                    {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">الكمية المراد نقلها</label>
                 <input type="number" className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-amber-200 dark:border-amber-900 font-black text-xl text-center outline-none" value={transferData.quantity} onChange={e => setTransferData({...transferData, quantity: Number(e.target.value)})} />
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-amber-500/10">
              <button onClick={handleTransfer} className="bg-amber-600 text-white px-16 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                 تثبيت عملية النقل <Package className="w-5 h-5" />
              </button>
           </div>
        </div>
      )}

      {/* شبكة المستودعات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
         {warehouses.map(w => (
           <div key={w.id} className={`bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border transition-all shadow-xl hover:shadow-2xl group relative overflow-hidden ${w.isMain ? 'border-primary ring-4 ring-primary/5' : 'border-zinc-200 dark:border-zinc-800'}`}>
              <div className={`absolute right-0 top-0 w-12 h-12 flex items-center justify-center transition-all ${w.isMain ? 'bg-primary text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 opacity-0 group-hover:opacity-100'}`}>
                 <Warehouse className="w-5 h-5" />
              </div>
              <div className="flex justify-between items-start mb-6">
                 <div className={`p-4 rounded-2xl ${w.isMain ? 'bg-primary/10 text-primary' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                    <Warehouse className="w-8 h-8" />
                 </div>
                 <div className="flex gap-1">
                    <button onClick={() => { setEditingId(w.id); setFormData(w); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    {!w.isMain && (
                      <button onClick={() => {
                        if(window.confirm('حذف المستودع؟')) {
                           const updated = warehouses.filter(x => x.id !== w.id);
                           setWarehouses(updated);
                           localStorage.setItem('sheno_warehouses', JSON.stringify(updated));
                        }
                      }} className="p-2 hover:bg-rose-500/10 rounded-xl text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    )}
                 </div>
              </div>
              <h3 className="text-2xl font-black mb-1 text-readable">{w.name}</h3>
              <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm mb-6">
                 <MapPin className="w-4 h-4 text-primary" /> {w.location || 'العنوان غير محدد'}
              </div>
              {w.isMain && (
                 <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl w-fit">
                    <Check className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">المستودع الافتراضي للنظام</span>
                 </div>
              )}
           </div>
         ))}
      </div>

      {/* قسم الطباعة (جدول منظم) */}
      <div className="print-only">
         <table className="w-full text-right border-collapse">
            <thead>
               <tr className="bg-zinc-100 font-black text-sm border-y-2 border-zinc-900 h-12">
                  <th className="p-3 border">م</th>
                  <th className="p-3 border">اسم المستودع</th>
                  <th className="p-3 border">الموقع / العنوان</th>
                  <th className="p-3 border text-center">الحالة</th>
               </tr>
            </thead>
            <tbody className="text-sm font-bold">
               {warehouses.map((w, idx) => (
                  <tr key={w.id} className="h-10">
                     <td className="p-3 border text-center font-mono">{idx + 1}</td>
                     <td className="p-3 border">{w.name}</td>
                     <td className="p-3 border">{w.location}</td>
                     <td className="p-3 border text-center">
                        {w.isMain ? 'مستودع رئيسي' : 'مستودع فرعي'}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

// أيقونة فحص بسيطة للاستخدام داخل المكون
const Check = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
  </svg>
);

export default WarehouseManagementView;
