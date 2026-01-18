
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Search, Users, Building2, Save, X, Phone, MapPin } from 'lucide-react';
import { Party, PartyType } from '../types';

interface PartyManagementViewProps {
  onBack: () => void;
}

const PartyManagementView: React.FC<PartyManagementViewProps> = ({ onBack }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Partial<Party>>({ 
    name: '', code: '', phone: '', address: '', type: PartyType.CUSTOMER, openingBalance: 0 
  });

  useEffect(() => {
    const saved = localStorage.getItem('sheno_parties');
    if (saved) setParties(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    if (!formData.name) return;
    
    let updated: Party[];
    if (editingId) {
      updated = parties.map(p => p.id === editingId ? { ...p, ...formData } as Party : p);
    } else {
      updated = [...parties, { ...formData, id: crypto.randomUUID() } as Party];
    }

    setParties(updated);
    localStorage.setItem('sheno_parties', JSON.stringify(updated));
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', code: '', phone: '', address: '', type: PartyType.CUSTOMER, openingBalance: 0 });
  };

  const filteredParties = parties.filter(p => p.name.includes(searchTerm) || p.code.includes(searchTerm));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">إدارة العملاء والموردين</h2>
        </div>
        <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:brightness-110 active:scale-95">
          <Plus className="w-5 h-5" /> إضافة حساب جديد
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95">
           <h3 className="text-lg font-black text-readable border-b border-zinc-100 dark:border-zinc-800 pb-3">بيانات الحساب (عميل/مورد)</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">الاسم الكامل</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">كود الحساب</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-mono font-bold" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">النوع</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as PartyType})}>
                    <option value={PartyType.CUSTOMER}>عميل</option>
                    <option value={PartyType.SUPPLIER}>مورد</option>
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم الهاتف</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">العنوان</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رصيد أول المدة</label>
                 <input type="number" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-mono font-bold" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})} />
              </div>
           </div>
           <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={handleSave} className="bg-primary text-white px-10 py-3 rounded-2xl font-black shadow-lg">حفظ البيانات</button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-8 py-3 rounded-2xl font-bold">إلغاء</button>
           </div>
        </div>
      )}

      <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="البحث باسم الحساب أو الكود..."
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pr-12 pl-4 outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-readable"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredParties.map(p => (
           <div key={p.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${p.type === PartyType.CUSTOMER ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-3 rounded-2xl ${p.type === PartyType.CUSTOMER ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {p.type === PartyType.CUSTOMER ? <Users className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                 </div>
                 <div className="flex gap-1">
                    <button onClick={() => { setEditingId(p.id); setFormData(p); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => {
                       if(window.confirm('حذف هذا الحساب نهائياً؟')) {
                          const updated = parties.filter(x => x.id !== p.id);
                          setParties(updated);
                          localStorage.setItem('sheno_parties', JSON.stringify(updated));
                       }
                    }} className="p-2 hover:bg-rose-500/10 rounded-lg text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                 </div>
              </div>
              <div>
                 <h3 className="text-xl font-black text-readable mb-1">{p.name}</h3>
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">كود: {p.code}</span>
              </div>
              <div className="mt-4 space-y-2">
                 <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold">
                    <Phone className="w-3.5 h-3.5" /> {p.phone || 'بدون هاتف'}
                 </div>
                 <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold">
                    <MapPin className="w-3.5 h-3.5" /> {p.address || 'بدون عنوان'}
                 </div>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-zinc-400">رصيد أول المدة</span>
                 <span className="font-mono font-black text-readable">{p.openingBalance.toLocaleString()}</span>
              </div>
           </div>
         ))}
         {filteredParties.length === 0 && (
           <div className="col-span-full py-20 text-center space-y-4">
              <Users className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mx-auto" />
              <p className="text-zinc-400 font-bold">لا توجد حسابات مسجلة حالياً.</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default PartyManagementView;
