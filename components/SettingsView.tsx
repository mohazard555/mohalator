
import React, { useState } from 'react';
import { 
  ArrowRight, Save, Image as ImageIcon, Palette, Building, 
  ShieldCheck, Database, Download, Upload, Trash2, AlertTriangle, Eye, EyeOff, Lock, User, KeyRound, Coins, Globe, Users, Briefcase, CreditCard, RotateCcw,
  AlertCircle
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
    alert('تم حفظ كافة الإعدادات بنجاح.');
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

  const handleRemoveLogo = () => {
    if (window.confirm('هل تريد حذف شعار المنشأة والعودة للشعار الافتراضي؟')) {
      setLocalSettings({ ...localSettings, logoUrl: undefined });
    }
  };

  const handleResetColor = () => {
    setLocalSettings({ ...localSettings, primaryColor: '#e11d48' });
  };

  // --- Data Management Functions ---
  const handleExportData = () => {
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
    link.download = `backup_${settings.companyName}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (window.confirm('سيؤدي الاستيراد لاستبدال كافة البيانات الحالية. هل أنت متأكد؟')) {
            Object.keys(data).forEach(key => {
              if (key.startsWith('sheno_')) {
                localStorage.setItem(key, JSON.stringify(data[key]));
              }
            });
            alert('تم استيراد البيانات بنجاح، سيتم إعادة تحميل النظام.');
            window.location.reload();
          }
        } catch (err) {
          alert('خطأ في تنسيق الملف.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetData = () => {
    if (window.confirm('تحذير نهائي: سيتم مسح كافة الفواتير، المواد، والعمليات المالية تماماً. هل تريد المتابعة؟')) {
      if (window.confirm('هل أنت متأكد حقاً؟ لا يمكن التراجع عن هذا الإجراء.')) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sheno_') && key !== 'sheno_settings') {
            localStorage.removeItem(key);
          }
        }
        alert('تم تصفير كافة قواعد البيانات.');
        window.location.reload();
      }
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
               <div className="flex flex-col gap-2">
                  <span className="font-black text-readable">شعار الشركة</span>
                  <div className="flex gap-2">
                    {localSettings.logoUrl && (
                      <button 
                        onClick={handleRemoveLogo}
                        className="text-[10px] bg-rose-500/10 text-rose-500 px-3 py-1 rounded-lg font-black hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> حذف الشعار الحالي
                      </button>
                    )}
                    <span className="text-[10px] text-zinc-400 font-bold py-1">يظهر في الفواتير والتقارير</span>
                  </div>
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
                    <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">نوع الشركة / النشاط</label>
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

        {/* Theme & Colors */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <h3 className="text-lg font-black flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-readable">
            <Palette className="w-5 h-5 text-primary" /> مظهر النظام والألوان
          </h3>
          <div className="space-y-6">
             <div className="flex flex-col gap-3">
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">لون السمة الرئيسي (Brand Color)</label>
                <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                   <input 
                     type="color" 
                     className="w-16 h-16 rounded-xl border-none cursor-pointer bg-transparent"
                     value={localSettings.primaryColor}
                     onChange={e => setLocalSettings({...localSettings, primaryColor: e.target.value})}
                   />
                   <div className="flex-1">
                      <div className="font-black text-readable mb-1 uppercase font-mono">{localSettings.primaryColor}</div>
                      <button 
                        onClick={handleResetColor}
                        className="text-[10px] text-primary font-black flex items-center gap-1 hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" /> إعادة اللون الافتراضي
                      </button>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4 pt-2">
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">رقم الهاتف للترويسة</label>
                   <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={localSettings.phone} onChange={e => setLocalSettings({...localSettings, phone: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">العنوان للترويسة</label>
                   <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={localSettings.address} onChange={e => setLocalSettings({...localSettings, address: e.target.value})} />
                </div>
             </div>
          </div>
        </div>

        {/* Security & Login */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <h3 className="text-lg font-black flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-readable">
            <ShieldCheck className="w-5 h-5 text-primary" /> الأمان وتشغيل النظام
          </h3>
          
          <div className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
             <div className="flex flex-col">
                <span className="font-black text-sm text-readable">تفعيل شاشة القفل</span>
                <span className="text-[10px] text-zinc-500 font-bold">يتطلب كلمة مرور عند فتح النظام</span>
             </div>
             
             <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={localSettings.isLoginEnabled} 
                  onChange={e => setLocalSettings({...localSettings, isLoginEnabled: e.target.checked})} 
                />
                <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${localSettings.isLoginEnabled ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${localSettings.isLoginEnabled ? (localSettings.language === 'ar' ? '-translate-x-7' : 'translate-x-7') : (localSettings.language === 'ar' ? '-translate-x-1' : 'translate-x-1')}`}></div>
                </div>
             </label>
          </div>

          <div className={`space-y-4 transition-all duration-500 ${localSettings.isLoginEnabled ? 'opacity-100 translate-y-0' : 'opacity-30 -translate-y-2 pointer-events-none grayscale'}`}>
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
                   <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">كلمة المرور الحالية</label>
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
                
                <div className="space-y-1">
                   <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">تلميح كلمة المرور (Hint)</label>
                   <div className="relative">
                     {/* Added AlertCircle to imports and using it here */}
                     <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                     <input 
                       type="text" 
                       className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 pr-10 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold text-readable focus:border-primary transition-all"
                       placeholder="مثلاً: تاريخ ميلاد الابن الأكبر"
                       value={localSettings.passwordHint}
                       onChange={e => setLocalSettings({...localSettings, passwordHint: e.target.value})}
                     />
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Multi-Currency Settings */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <h3 className="text-lg font-black flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-readable">
            <Coins className="w-5 h-5 text-primary" /> نظام العملات المتعددة
          </h3>
          <div className="grid grid-cols-1 gap-6">
             <div className="grid grid-cols-2 gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/20">
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-primary/70 font-black uppercase mr-1">العملة الأساسية</label>
                   <input type="text" className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={localSettings.currency} onChange={e => setLocalSettings({...localSettings, currency: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-primary/70 font-black uppercase mr-1">رمز العملة (1)</label>
                   <input type="text" className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none font-black text-center text-primary" value={localSettings.currencySymbol} onChange={e => setLocalSettings({...localSettings, currencySymbol: e.target.value})} />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-amber-600/70 font-black uppercase mr-1">العملة الثانوية</label>
                   <input type="text" className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={localSettings.secondaryCurrency} onChange={e => setLocalSettings({...localSettings, secondaryCurrency: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-amber-600/70 font-black uppercase mr-1">رمز العملة (2)</label>
                   <input type="text" className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none font-black text-center text-amber-600" value={localSettings.secondaryCurrencySymbol} onChange={e => setLocalSettings({...localSettings, secondaryCurrencySymbol: e.target.value})} />
                </div>
             </div>
             
             <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-black uppercase mr-1">اسم المحاسب (للفواتير)</label>
                <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={localSettings.accountantName} onChange={e => setLocalSettings({...localSettings, accountantName: e.target.value})} />
             </div>
          </div>
        </div>

        {/* Database & Backup Management */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6 md:col-span-2">
          <h3 className="text-lg font-black flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-readable">
            <Database className="w-5 h-5 text-amber-500" /> إدارة قواعد البيانات والنسخ الاحتياطي
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <button 
               onClick={handleExportData}
               className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-3xl border-2 border-zinc-100 dark:border-zinc-700 hover:border-emerald-500 transition-all group text-right"
             >
                <Download className="w-8 h-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="font-black text-readable">تصدير نسخة احتياطية</h4>
                <p className="text-[10px] text-zinc-500 font-bold mt-1">حفظ كافة بيانات النظام في ملف خارجي آمن</p>
             </button>

             <label className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-3xl border-2 border-zinc-100 dark:border-zinc-700 hover:border-primary transition-all group text-right cursor-pointer relative">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImportData} accept=".json" />
                <Upload className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="font-black text-readable">استيراد بيانات</h4>
                <p className="text-[10px] text-zinc-500 font-bold mt-1">استعادة سجلات النظام من ملف تم تصديره مسبقاً</p>
             </label>

             <button 
               onClick={handleResetData}
               className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-3xl border-2 border-zinc-100 dark:border-zinc-700 hover:border-rose-500 transition-all group text-right"
             >
                <Trash2 className="w-8 h-8 text-rose-500 mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="font-black text-readable">تصفير النظام</h4>
                <p className="text-[10px] text-zinc-500 font-bold mt-1">مسح كافة السجلات والفواتير (لا يمكن التراجع)</p>
             </button>
          </div>
          
          <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20 flex gap-3">
             <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
             <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
               تنبيه: نوصي بتصدير نسخة احتياطية من بياناتك بشكل أسبوعي لضمان عدم فقدان السجلات في حال تغيير المتصفح أو مسح ذاكرة التخزين المؤقت.
             </p>
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
