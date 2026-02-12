
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Building2, Trash2, Edit2, Save, X, Globe, Phone, MapPin, Mail, KeyRound, Download, Upload, AlertCircle, CheckCircle2, ShieldCheck, Database, Calendar } from 'lucide-react';
import { Company, AppSettings } from '../types';

interface CompanyManagementViewProps {
  onBack: () => void;
}

const CompanyManagementView: React.FC<CompanyManagementViewProps> = ({ onBack }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState('default');

  const [formData, setFormData] = useState<Partial<Company>>({
    name: '', type: '', address: '', phone: '', email: '', fiscalYear: new Date().getFullYear().toString(),
    currency: 'ليرة سورية', currencySymbol: 'ل.س', adminUsername: 'admin', adminPassword: '123'
  });

  useEffect(() => {
    const saved = localStorage.getItem('sheno_companies');
    if (saved) setCompanies(JSON.parse(saved));
    const active = localStorage.getItem('sheno_active_company_id');
    if (active) setActiveId(active);
  }, []);

  const handleSave = () => {
    if (!formData.name || !formData.adminUsername || !formData.adminPassword) {
      alert('يرجى ملء الحقول الأساسية (الاسم، المستخدم، كلمة المرور)');
      return;
    }

    let updated: Company[];
    const id = editingId || crypto.randomUUID();
    const newCompany: Company = {
      ...formData as Company,
      id,
      createdAt: new Date().toISOString()
    };

    if (editingId) {
      updated = companies.map(c => c.id === editingId ? newCompany : c);
    } else {
      updated = [...companies, newCompany];
      // تهيئة إعدادات الشركة الجديدة
      const prefix = id === 'default' ? 'sheno' : `sheno_${id}`;
      const defaultSettings: AppSettings = {
        companyName: newCompany.name,
        companyType: newCompany.type,
        website: 'www.finexa.pro',
        managerName: 'مدير النظام',
        accountantName: 'المحاسب الرئيسي',
        phone: newCompany.phone,
        address: newCompany.address,
        primaryColor: '#1e40af',
        secondaryColor: '#1e3a8a',
        darkMode: true,
        language: 'ar',
        currency: newCompany.currency,
        currencySymbol: newCompany.currencySymbol,
        secondaryCurrency: 'دولار أمريكي',
        secondaryCurrencySymbol: '$',
        isLoginEnabled: true,
        username: newCompany.adminUsername,
        password: newCompany.adminPassword,
        passwordHint: 'كلمة المرور الافتراضية'
      };
      localStorage.setItem(`${prefix}_settings`, JSON.stringify(defaultSettings));
    }

    setCompanies(updated);
    localStorage.setItem('sheno_companies', JSON.stringify(updated));
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (id === 'default') {
      alert('لا يمكن حذف الشركة الافتراضية للنظام');
      return;
    }
    if (id === activeId) {
      alert('لا يمكن حذف الشركة النشطة حالياً. قم بالتبديل أولاً.');
      return;
    }

    if (window.confirm('تحذير: سيؤدي حذف الشركة لمسح كافة بياناتها (الفواتير، المواد، القيود) نهائياً. هل أنت متأكد؟')) {
      const updated = companies.filter(c => c.id !== id);
      setCompanies(updated);
      localStorage.setItem('sheno_companies', JSON.stringify(updated));
      
      // مسح كافة مفاتيح التخزين المرتبطة بهذه الشركة
      const prefix = `sheno_${id}_`;
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      }
    }
  };

  const handleExportCompany = (company: Company) => {
    const prefix = company.id === 'default' ? 'sheno' : `sheno_${company.id}`;
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(`${prefix}_`) || key === prefix)) {
        data[key] = JSON.parse(localStorage.getItem(key) || '{}');
      }
    }
    const blob = new Blob([JSON.stringify({ metadata: company, data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_company_${company.name.replace(/\s+/g, '_')}.json`;
    link.click();
  };

  const handleImportCompany = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          const meta = imported.metadata as Company;
          const data = imported.data as Record<string, any>;
          
          // توليد ID جديد لتجنب التكرار
          const newId = crypto.randomUUID();
          const newMeta = { ...meta, id: newId, name: `${meta.name} (مستوردة)` };
          
          const prefix = `sheno_${newId}`;
          Object.keys(data).forEach(oldKey => {
             const subKey = oldKey.replace(`sheno_${meta.id}_`, "").replace("sheno_", "");
             localStorage.setItem(`${prefix}_${subKey}`, JSON.stringify(data[oldKey]));
          });

          const updated = [...companies, newMeta];
          setCompanies(updated);
          localStorage.setItem('sheno_companies', JSON.stringify(updated));
          alert('تم استيراد الشركة بنجاح ككيان جديد.');
        } catch (err) {
          alert('خطأ في تنسيق ملف الاستيراد.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-all shadow-sm">
            <ArrowRight className="w-6 h-6 text-primary" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-readable tracking-tight">إدارة الشركات والكيانات</h2>
            <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">إنشاء بيئات عمل مستقلة تماماً</p>
          </div>
        </div>
        <div className="flex gap-2">
           <label className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 cursor-pointer hover:bg-black transition-all">
              <Upload className="w-5 h-5" /> استيراد شركة
              <input type="file" className="hidden" onChange={handleImportCompany} accept=".json" />
           </label>
           <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: '', type: '', address: '', phone: '', email: '', fiscalYear: new Date().getFullYear().toString(), currency: 'ليرة سورية', currencySymbol: 'ل.س', adminUsername: 'admin', adminPassword: '123' }); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95">
             <Plus className="w-5 h-5" /> إنشاء شركة جديدة
           </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-8 animate-in zoom-in-95">
           <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-4">
              <h3 className="text-xl font-black flex items-center gap-3 text-primary">
                 <Building2 className="w-7 h-7" /> {editingId ? 'تعديل بيانات الكيان' : 'تأسيس شركة محاسبية جديدة'}
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-rose-500"><X className="w-6 h-6" /></button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">اسم الشركة الرسمي</label>
                 <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border dark:border-zinc-700 outline-none font-black text-readable focus:border-primary transition-all" placeholder="مثلاً: شركة النور للتجارة" />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">نوع النشاط</label>
                 <input type="text" value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border dark:border-zinc-700 outline-none font-bold text-readable" placeholder="تجاري، صناعي، خدمي..." />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">السنة المالية</label>
                 <input type="text" value={formData.fiscalYear} onChange={e=>setFormData({...formData, fiscalYear: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border dark:border-zinc-700 outline-none font-mono font-black text-center text-primary" />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">العملة الأساسية</label>
                 <input type="text" value={formData.currency} onChange={e=>setFormData({...formData, currency: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border dark:border-zinc-700 outline-none font-bold" />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">رمز العملة</label>
                 <input type="text" value={formData.currencySymbol} onChange={e=>setFormData({...formData, currencySymbol: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border dark:border-zinc-700 outline-none font-black text-center text-rose-600" />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-1">رقم الهاتف</label>
                 <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="text" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 pr-10 rounded-2xl border dark:border-zinc-700 outline-none font-bold" />
                 </div>
              </div>
           </div>

           <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 space-y-6">
              <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                 <ShieldCheck className="w-5 h-5 text-primary" />
                 <span className="font-black text-sm text-primary uppercase">بيانات الدخول لهذه الشركة</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">اسم المستخدم (المدير)</label>
                    <input type="text" value={formData.adminUsername} onChange={e=>setFormData({...formData, adminUsername: e.target.value})} className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 outline-none font-black text-readable focus:border-primary transition-all shadow-inner" />
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">كلمة المرور</label>
                    <input type="password" value={formData.adminPassword} onChange={e=>setFormData({...formData, adminPassword: e.target.value})} className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 outline-none font-black text-readable focus:border-primary transition-all shadow-inner" />
                 </div>
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t dark:border-zinc-800">
              <button onClick={handleSave} className="bg-primary text-white px-20 py-4 rounded-3xl font-black shadow-2xl hover:scale-105 transition-all text-xl flex items-center gap-3">
                 <Save className="w-6 h-6" /> تثبيت الشركة وبدء العمل
              </button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {companies.map(c => (
            <div key={c.id} className={`bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border-2 transition-all shadow-xl group relative overflow-hidden flex flex-col ${activeId === c.id ? 'border-primary ring-4 ring-primary/5' : 'border-zinc-100 dark:border-zinc-800'}`}>
               <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl font-black text-[9px] uppercase tracking-widest text-white transition-all ${activeId === c.id ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 opacity-0 group-hover:opacity-100'}`}>
                  {activeId === c.id ? 'الشركة النشطة حالياً' : 'شركة احتياطية'}
               </div>
               
               <div className="flex justify-between items-start mb-6">
                  <div className={`p-5 rounded-3xl ${activeId === c.id ? 'bg-primary/10 text-primary shadow-lg shadow-primary/10' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                     <Building2 className="w-10 h-10" />
                  </div>
                  <div className="flex gap-1 no-print">
                     <button onClick={() => handleExportCompany(c)} className="p-2.5 hover:bg-emerald-500/10 rounded-xl text-zinc-400 hover:text-emerald-600 transition-all shadow-sm" title="تصدير نسخة"><Download className="w-5 h-5"/></button>
                     <button onClick={() => { setEditingId(c.id); setFormData(c); setIsAdding(true); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2.5 hover:bg-primary/10 rounded-xl text-zinc-400 hover:text-primary transition-all shadow-sm"><Edit2 className="w-5 h-5"/></button>
                     <button onClick={() => handleDelete(c.id)} className="p-2.5 hover:bg-rose-500/10 rounded-xl text-zinc-400 hover:text-rose-500 transition-all shadow-sm"><Trash2 className="w-5 h-5"/></button>
                  </div>
               </div>

               <div className="flex-1 space-y-4">
                  <div>
                     <h3 className="text-2xl font-black text-readable mb-1 leading-tight">{c.name}</h3>
                     <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{c.type || 'بدون تصنيف نشاط'}</p>
                  </div>

                  <div className="space-y-2 bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-[1.5rem] border dark:border-zinc-700">
                     <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {c.address}
                     </div>
                     <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        <Phone className="w-3.5 h-3.5 text-primary" /> {c.phone}
                     </div>
                     <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> السنة المالية: {c.fiscalYear}
                     </div>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-900 text-white p-4 rounded-2xl shadow-inner group-hover:bg-primary transition-colors duration-500">
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-50">CURRENCY</span>
                        <span className="font-bold text-sm leading-none">{c.currency}</span>
                     </div>
                     <span className="text-2xl font-black font-mono">{c.currencySymbol}</span>
                  </div>
               </div>
               
               {activeId !== c.id && (
                  <button 
                    onClick={() => { localStorage.setItem('sheno_active_company_id', c.id); window.location.reload(); }}
                    className="mt-6 w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-[1.5rem] font-black text-xs hover:bg-primary hover:text-white transition-all shadow-sm border border-zinc-200 dark:border-zinc-700"
                  >
                     التبديل لهذه الشركة الآن
                  </button>
               )}
            </div>
         ))}
      </div>

      <div className="p-6 bg-amber-500/5 rounded-[2.5rem] border-2 border-dashed border-amber-500/20 flex gap-4 no-print shadow-inner">
         <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
         <div className="space-y-1">
            <h4 className="font-black text-amber-700 text-sm uppercase tracking-widest">تنبيه تقني هام:</h4>
            <p className="text-xs font-bold text-amber-600 leading-relaxed italic">
               نظام تعدد الشركات يقوم بعزل البيانات تماماً داخل متصفحك. حذف أي شركة سيؤدي لمسح فوري لكافة قواعد بياناتها. نوصي بتصدير نسخة احتياطية قبل أي عملية حذف.
            </p>
         </div>
      </div>
    </div>
  );
};

export default CompanyManagementView;
