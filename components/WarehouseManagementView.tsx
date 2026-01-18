
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Warehouse, MapPin, Save, X } from 'lucide-react';
import { WarehouseEntity } from '../types';

interface WarehouseManagementViewProps {
  onBack: () => void;
}

const WarehouseManagementView: React.FC<WarehouseManagementViewProps> = ({ onBack }) => {
  const [warehouses, setWarehouses] = useState<WarehouseEntity[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<WarehouseEntity>>({
    name: '',
    location: '',
    isMain: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('sheno_warehouses');
    if (saved) setWarehouses(JSON.parse(saved));
    else {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">إدارة المستودعات</h2>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-primary text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg">
           <Plus className="w-5 h-5" /> إضافة مستودع جديد
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4 animate-in zoom-in-95">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                 <label className="text-xs text-zinc-500 font-bold">اسم المستودع</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-xs text-zinc-500 font-bold">الموقع / العنوان</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
           </div>
           <div className="flex items-center gap-2">
              <input type="checkbox" id="main" checked={formData.isMain} onChange={e => setFormData({...formData, isMain: e.target.checked})} className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-primary" />
              <label htmlFor="main" className="text-sm font-bold">تعيين كمستودع رئيسي</label>
           </div>
           <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button onClick={handleSave} className="bg-primary text-white px-10 py-2 rounded-xl font-bold shadow-lg">حفظ المستودع</button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-700 text-zinc-300 px-6 py-2 rounded-xl font-bold">إلغاء</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {warehouses.map(w => (
           <div key={w.id} className={`bg-white dark:bg-zinc-900 p-6 rounded-3xl border transition-all ${w.isMain ? 'border-primary ring-2 ring-primary/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-3 rounded-2xl ${w.isMain ? 'bg-primary text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                    <Warehouse className="w-6 h-6" />
                 </div>
                 <div className="flex gap-1">
                    <button onClick={() => { setEditingId(w.id); setFormData(w); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"><Edit2 className="w-4 h-4" /></button>
                    {!w.isMain && (
                      <button onClick={() => {
                        const updated = warehouses.filter(x => x.id !== w.id);
                        setWarehouses(updated);
                        localStorage.setItem('sheno_warehouses', JSON.stringify(updated));
                      }} className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    )}
                 </div>
              </div>
              <h3 className="text-xl font-bold mb-1">{w.name}</h3>
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
                 <MapPin className="w-4 h-4" /> {w.location || 'غير محدد'}
              </div>
              {w.isMain && <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">المستودع الافتراضي</span>}
           </div>
         ))}
      </div>
    </div>
  );
};

export default WarehouseManagementView;
