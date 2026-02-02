
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Search, Users, Building2, Save, X, Phone, MapPin, Printer, Calendar } from 'lucide-react';
import { Party, PartyType, AppSettings, AccountNode } from '../types';

interface PartyManagementViewProps {
  onBack: () => void;
}

const PartyManagementView: React.FC<PartyManagementViewProps> = ({ onBack }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [filterType, setFilterType] = useState<'الكل' | PartyType | 'عميل ومورد'>('الكل');
  
  const [formData, setFormData] = useState<Partial<Party>>({ 
    name: '', code: '', phone: '', address: '', type: PartyType.CUSTOMER, openingBalance: 0 
  });

  useEffect(() => {
    const saved = localStorage.getItem('sheno_parties');
    const savedSettings = localStorage.getItem('sheno_settings');
    if (saved) setParties(JSON.parse(saved));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const syncToChartOfAccounts = (party: Party, isDelete: boolean = false) => {
    const savedChart = localStorage.getItem('sheno_chart_accounts');
    if (!savedChart) return;
    
    let chart: AccountNode[] = JSON.parse(savedChart);
    
    // تحديد المجلد الأب بناءً على نوع الطرف
    // 121 للزبائن و 221 للموردين (بناءً على التنسيق الافتراضي للدليل)
    const parentId = party.type === PartyType.SUPPLIER ? '211' : '121'; 
    const reportType = party.type === PartyType.SUPPLIER ? 'الميزانية' : 'الميزانية';

    if (isDelete) {
      chart = chart.filter(acc => acc.name !== party.name);
    } else {
      const existingIdx = chart.findIndex(acc => acc.name === party.name || acc.code === `ACC-${party.code}`);
      const accountData: AccountNode = {
        id: editingId ? (chart[existingIdx]?.id || crypto.randomUUID()) : crypto.randomUUID(),
        code: party.code ? `ACC-${party.code}` : `ACC-${Math.floor(Math.random() * 1000)}`,
        name: party.name,
        parentId: parentId,
        type: 'ACCOUNT',
        reportType: reportType as any
      };

      if (existingIdx > -1) chart[existingIdx] = accountData;
      else chart.push(accountData);
    }

    localStorage.setItem('sheno_chart_accounts', JSON.stringify(chart));
  };

  const handleSave = () => {
    if (!formData.name) return;
    
    let updated: Party[];
    const partyToSave = { ...formData, id: editingId || crypto.randomUUID() } as Party;

    if (editingId) {
      updated = parties.map(p => p.id === editingId ? partyToSave : p);
    } else {
      updated = [...parties, partyToSave];
    }

    setParties(updated);
    localStorage.setItem('sheno_parties', JSON.stringify(updated));
    
    // المزامنة مع دليل الحسابات
    syncToChartOfAccounts(partyToSave);
    
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', code: '', phone: '', address: '', type: PartyType.CUSTOMER, openingBalance: 0 });
  };

  const handleDelete = (id: string) => {
    const party = parties.find(p => p.id === id);
    if (party && window.confirm('حذف هذا الحساب نهائياً من النظام؟ سيتم حذفه من دليل الحسابات أيضاً.')) {
      const updated = parties.filter(x => x.id !== id);
      setParties(updated);
      localStorage.setItem('sheno_parties', JSON.stringify(updated));
      syncToChartOfAccounts(party, true);
    }
  };

  const filteredParties = parties.filter(p => {
    const nameStr = p.name || '';
    const codeStr = p.code || '';
    const matchSearch = nameStr.includes(searchTerm) || codeStr.includes(searchTerm);
    const matchType = filterType === 'الكل' || p.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="print-only print-header flex justify-between items-center bg-white p-6 rounded-t-xl text-zinc-900 mb-0 border-b-2 border-zinc-200">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain bg-white p-1 rounded-lg border border-zinc-100" />}
          <div>
            <h1 className="text-2xl font-black text-rose-900">{settings?.companyName}</h1>
            <p className="text-xs text-zinc-500 font-bold">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black underline decoration-zinc-200 underline-offset-8">قائمة الحسابات المعتمدة</h2>
          <p className="text-sm mt-2 text-zinc-500 font-bold tracking-widest uppercase">{filterType === 'الكل' ? 'عملاء وموردين' : filterType}</p>
        </div>
        <div className="text-left text-xs font-bold text-zinc-400 space-y-1">
          <p>{settings?.address}</p>
          <p className="flex items-center justify-end gap-1"><Calendar className="w-3 h-3"/> {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors shadow-sm">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">إدارة العملاء والموردين</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-zinc-700 transition-all">
            <Printer className="w-5 h-5" /> طباعة القائمة
          </button>
          <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:brightness-110 active:scale-95">
            <Plus className="w-5 h-5" /> إضافة حساب جديد
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95 no-print text-readable">
           <h3 className="text-lg font-black border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> {editingId ? 'تعديل بيانات الحساب' : 'تسجيل حساب جديد (عميل/مورد)'}
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">الاسم الكامل</label>
                 <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none focus:border-primary transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
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
                    <option value={PartyType.BOTH}>عميل ومورد (مشترك)</option>
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
                 <input type="number" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-mono font-black text-rose-600" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})} />
              </div>
           </div>
           <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={handleSave} className="bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">حفظ وتثبيت البيانات</button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-8 py-3 rounded-2xl font-bold">إلغاء</button>
           </div>
        </div>
      )}

      <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 shadow-sm no-print">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="البحث باسم الحساب أو الكود..."
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pr-12 pl-4 outline-none font-bold text-readable focus:ring-2 focus:ring-primary transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterType} 
          onChange={e => setFilterType(e.target.value as any)}
          className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-xl font-black text-sm outline-none cursor-pointer"
        >
          <option value="الكل">جميع أنواع الحسابات</option>
          <option value={PartyType.CUSTOMER}>العملاء المعتمدين</option>
          <option value={PartyType.SUPPLIER}>الموردين فقط</option>
          <option value={PartyType.BOTH}>العملاء والموردين</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
         {filteredParties.map(p => (
           <div key={p.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${p.type === PartyType.CUSTOMER ? 'bg-blue-600' : p.type === PartyType.SUPPLIER ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-4 rounded-2xl ${p.type === PartyType.CUSTOMER ? 'bg-blue-600/10 text-blue-600' : p.type === PartyType.SUPPLIER ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    <Users className="w-7 h-7" />
                 </div>
                 <div className="flex gap-1">
                    <button onClick={() => { setEditingId(p.id); setFormData(p); setIsAdding(true); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-primary transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-rose-500/10 rounded-xl text-zinc-400 hover:text-rose-500 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                 </div>
              </div>
              <div className="flex-1">
                 <h3 className="text-2xl font-black text-readable mb-1 leading-tight">{p.name}</h3>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">كود: {p.code}</span>
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${p.type === PartyType.BOTH ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}>{p.type}</span>
                 </div>
              </div>
              <div className="mt-6 space-y-3">
                 <div className="flex items-center gap-3 text-xs text-zinc-500 font-bold bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-inner">
                    <Phone className="w-4 h-4 text-primary" /> {p.phone || 'بدون رقم مسجل'}
                 </div>
                 <div className="flex items-center gap-3 text-xs text-zinc-500 font-bold bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-inner">
                    <MapPin className="w-4 h-4 text-primary" /> {p.address || 'العنوان غير محدد'}
                 </div>
              </div>
              <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">رصيد أول المدة</span>
                 <span className="font-mono font-black text-xl text-rose-700 dark:text-rose-400">{p.openingBalance.toLocaleString()}</span>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};

export default PartyManagementView;
