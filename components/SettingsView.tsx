
import React, { useState } from 'react';
import { 
  ArrowRight, Save, Image as ImageIcon, Palette, Building, 
  ShieldCheck, Database, Download, Upload, Trash2, AlertTriangle, Eye, EyeOff, Lock, User, KeyRound, Coins, Globe, Users, Briefcase
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  onBack: () => void;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showPass, setShowPass] = useState(false);

  const handleSave = () => {
    setSettings(localSettings);
    localStorage.setItem('sheno_settings', JSON.stringify(localSettings));
    alert('تم حفظ كافة الإعدادات بنجاح. سيتم تفعيل شاشة القفل عند إعادة التحميل إذا كانت مفعلة.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({ ...localSettings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const exportAllData = () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sheno_')) {
        data[key] = JSON.parse(localStorage.getItem(key) || '{}');
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sheno_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importAllData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (window.confirm('سيتم استبدال كافة البيانات الحالية بالبيانات المستوردة. هل أنت متأكد؟')) {
          Object.keys(data).forEach(key => {
            if (key.startsWith('sheno_')) {
              localStorage.setItem(key, JSON.stringify(data[key]));
            }
          });
          alert('تم استيراد البيانات بنجاح. سيتم تحديث الصفحة.');
          window.location.reload();
        }
      } catch (err) {
        alert('حدث خطأ أثناء استيراد الملف');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (window.confirm('سيتم مسح كافة البيانات المسجلة على هذا الموقع نهائياً. هل أنت متأكد؟')) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sheno_')) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      alert('تم مسح البيانات بنجاح.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all">
          <ArrowRight className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-black text-readable">إعدادات النظام المتقدمة</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Company Identity */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <h3 className="text-lg font-black flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-readable">
            <Building className="w-5 h-5 text-primary" /> هوية المنشأة والترويسة
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-6 mb-6">
               <div className="relative w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden group">
                  {localSettings.logoUrl ? (
                    <img src={localSettings.logoUrl} className="w-full h-full object-contain" alt="Logo Preview" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-zinc-400" />
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} accept="image/*" />
               </div>
               <div className="flex flex-col gap-1">
                  <span className="font-black text-readable">شعار الشركة</span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">يظهر في ترويسة الفواتير والتقارير</span>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">اسم المنشأة</label>
                    <input 
                      type="text" 
                      className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold text-readable"
                      value={localSettings.companyName}
                      onChange={e => setLocalSettings({...localSettings, companyName: e.target.value})}
                    />
                 </div>
                 
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">نوع الشركة / النشاط (يظهر تحت الاسم)</label>
                    <div className="relative">
                       <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                       <input 
                         type="text" 
                         placeholder="مثلاً: للتجارة العامة والمقاولات"
                         className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 pr-10 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold"
                         value={localSettings.companyType}
                         onChange={e => setLocalSettings({...localSettings, companyType: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">الموقع الإلكتروني</label>
                    <div className="relative">
                       <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                       <input 
                         type="text" 
                         placeholder="www.company.com"
                         className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 pr-10 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-mono text-xs font-bold text-primary"
                         value={localSettings.website}
                         onChange={e => setLocalSettings({...localSettings, website: e.target.value})}
                       />
                    </div>
                 </div>
            </div>
          </div>
        </div>

        {/* Administration Info */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <h3 className="text-lg font-black flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-readable">
            <Users className="w-5 h-5 text-emerald-500" /> الإدارة والأسماء المعتمدة
          </h3>
          <div className="space-y-4">
             <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">اسم المدير العام</label>
                <input 
                  type="text" 
                  className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold"
                  value={localSettings.managerName}
                  onChange={e => setLocalSettings({...localSettings, managerName: e.target.value})}
                />
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">اسم المحاسب الرئيسي</label>
                <input 
                  type="text" 
                  className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold"
                  value={localSettings.accountantName}
                  onChange={e => setLocalSettings({...localSettings, accountantName: e.target.value})}
                />
             </div>
             <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-[10px] font-bold text-emerald-600 leading-relaxed italic">
                ملاحظة: تظهر هذه الأسماء في تذييل التقارير وسندات القبض والدفع لضمان الرسمية والمصداقية.
             </div>
          </div>
        </div>

        {/* Security & Login */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <h3 className="text-lg font-black flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-readable">
            <ShieldCheck className="w-5 h-5 text-primary" /> الأمان وتشغيل النظام
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/20">
             <div className="flex flex-col">
                <span className="font-black text-sm text-readable">تفعيل شاشة القفل</span>
                <span className="text-[10px] text-zinc-500 font-bold">يتطلب كلمة مرور عند فتح الموقع</span>
             </div>
             <div className="relative inline-flex items-center cursor-pointer">
               <input 
                 type="checkbox" 
                 className="sr-only peer" 
                 checked={localSettings.isLoginEnabled} 
                 onChange={e => setLocalSettings({...localSettings, isLoginEnabled: e.target.checked})} 
               />
               <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
             </div>
          </div>

          <div className={`space-y-4 transition-all duration-300 ${localSettings.isLoginEnabled ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none grayscale'}`}>
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">اسم مستخدم المدير</label>
                   <div className="relative">
                     <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                     <input 
                       type="text" 
                       className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 pr-10 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold text-readable focus:border-primary transition-all"
                       value={localSettings.username}
                       onChange={e => setLocalSettings({...localSettings, username: e.target.value})}
                     />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">كلمة المرور الجديدة</label>
                   <div className="relative">
                     <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                     <input 
                       type={showPass ? 'text' : 'password'} 
                       className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 pr-10 pl-12 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold text-readable focus:border-primary transition-all"
                       value={localSettings.password}
                       onChange={e => setLocalSettings({...localSettings, password: e.target.value})}
                     />
                     <button onClick={() => setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-primary transition-colors">
                       {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Financial Context */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <h3 className="text-lg font-black flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-readable">
            <Coins className="w-5 h-5 text-primary" /> العملة ومعلومات الاتصال
          </h3>
          <div className="grid grid-cols-1 gap-4">
             <div className="grid grid-cols-2 gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/20">
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">العملة الأساسية</label>
                   <input type="text" className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={localSettings.currency} onChange={e => setLocalSettings({...localSettings, currency: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">رمز العملة</label>
                   <input type="text" className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none font-black text-center text-primary" value={localSettings.currencySymbol} onChange={e => setLocalSettings({...localSettings, currencySymbol: e.target.value})} />
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">رقم الهاتف</label>
                   <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={localSettings.phone} onChange={e => setLocalSettings({...localSettings, phone: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">العنوان</label>
                   <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={localSettings.address} onChange={e => setLocalSettings({...localSettings, address: e.target.value})} />
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-8 gap-4">
        <button onClick={handleSave} className="bg-primary text-white px-20 py-4 rounded-full font-black shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-3 text-lg border-4 border-white/20">
          <Save className="w-6 h-6" /> حفظ وتثبيت كافة التعديلات
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
