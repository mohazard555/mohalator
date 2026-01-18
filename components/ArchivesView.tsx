
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Archive, Calendar, Trash2, Download, Search, 
  Database, RefreshCcw, FileText, AlertCircle, Trash 
} from 'lucide-react';
import { ArchiveEntry } from '../types';

interface ArchivesViewProps {
  onBack: () => void;
}

const ArchivesView: React.FC<ArchivesViewProps> = ({ onBack }) => {
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [archiveForm, setArchiveForm] = useState({
    title: '',
    periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const saved = localStorage.getItem('sheno_archives');
    if (saved) setArchives(JSON.parse(saved));
  }, []);

  const handleCreateArchive = () => {
    if (!archiveForm.title) return;
    
    // Collect all data
    const fullData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sheno_') && key !== 'sheno_archives' && key !== 'sheno_settings') {
        fullData[key] = JSON.parse(localStorage.getItem(key) || '{}');
      }
    }

    const newArchive: ArchiveEntry = {
      id: crypto.randomUUID(),
      archiveDate: new Date().toISOString(),
      title: archiveForm.title,
      periodStart: archiveForm.periodStart,
      periodEnd: archiveForm.periodEnd,
      data: JSON.stringify(fullData)
    };

    const updated = [newArchive, ...archives];
    setArchives(updated);
    localStorage.setItem('sheno_archives', JSON.stringify(updated));
    setIsArchiving(false);
    setArchiveForm({ ...archiveForm, title: '' });
  };

  const handleRestore = (archive: ArchiveEntry) => {
    if (window.confirm(`هل أنت متأكد من استعادة بيانات الأرشيف: ${archive.title}؟ سيؤدي ذلك لاستبدال البيانات الحالية بالكامل.`)) {
      const data = JSON.parse(archive.data);
      Object.keys(data).forEach(key => {
        localStorage.setItem(key, JSON.stringify(data[key]));
      });
      alert('تم استعادة البيانات بنجاح.');
      window.location.reload();
    }
  };

  const handleDownload = (archive: ArchiveEntry) => {
    const blob = new Blob([archive.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archive_${archive.title.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الأرشيف نهائياً؟')) {
      const updated = archives.filter(a => a.id !== id);
      setArchives(updated);
      localStorage.setItem('sheno_archives', JSON.stringify(updated));
    }
  };

  const filteredArchives = archives.filter(a => a.title.includes(searchTerm));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">قسم الأرشفة والتدوير</h2>
        </div>
        <button 
          onClick={() => setIsArchiving(true)} 
          className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:brightness-110 active:scale-95"
        >
          <Archive className="w-5 h-5" /> أرشفة البيانات الحالية
        </button>
      </div>

      {isArchiving && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95">
           <h3 className="text-lg font-black text-readable flex items-center gap-2">
             <Database className="w-5 h-5 text-primary" /> إنشاء نقطة أرشفة جديدة
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">عنوان الأرشيف</label>
                 <input 
                   type="text" 
                   className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none"
                   placeholder="مثلاً: جرد نهاية العام 2024"
                   value={archiveForm.title}
                   onChange={e => setArchiveForm({...archiveForm, title: e.target.value})}
                 />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">بداية الفترة</label>
                 <input 
                   type="date" 
                   className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none"
                   value={archiveForm.periodStart}
                   onChange={e => setArchiveForm({...archiveForm, periodStart: e.target.value})}
                 />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">نهاية الفترة</label>
                 <input 
                   type="date" 
                   className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none"
                   value={archiveForm.periodEnd}
                   onChange={e => setArchiveForm({...archiveForm, periodEnd: e.target.value})}
                 />
              </div>
           </div>
           
           <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
                ملاحظة: عملية الأرشفة ستقوم بأخذ لقطة كاملة لكافة البيانات (المستودع، المبيعات، المالية) وحفظها في هذا القسم. لن يتم مسح البيانات الحالية إلا إذا قمت بذلك يدوياً من الإعدادات.
              </p>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={handleCreateArchive} className="bg-primary text-white px-10 py-3 rounded-2xl font-black shadow-lg">تثبيت الأرشيف</button>
              <button onClick={() => setIsArchiving(false)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-8 py-3 rounded-2xl font-bold">إلغاء</button>
           </div>
        </div>
      )}

      <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="البحث في سجلات الأرشيف..."
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pr-12 pl-4 outline-none focus:ring-2 focus:ring-primary transition-all text-readable font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredArchives.map(archive => (
           <div key={archive.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-2xl transition-all group">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                    <FileText className="w-6 h-6" />
                 </div>
                 <div className="flex gap-1">
                    <button onClick={() => handleDownload(archive)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"><Download className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(archive.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                 </div>
              </div>
              <h3 className="text-xl font-black mb-2 text-readable">{archive.title}</h3>
              <div className="space-y-2 mb-6">
                 <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>تاريخ الأرشفة:</span>
                    <span className="font-mono">{new Date(archive.archiveDate).toLocaleDateString('ar-SA')}</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold">
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>تغطي فترة:</span>
                    <span className="font-mono">{archive.periodStart} ← {archive.periodEnd}</span>
                 </div>
              </div>
              <button 
                onClick={() => handleRestore(archive)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 py-3 rounded-2xl font-black text-xs hover:bg-emerald-500 hover:text-white transition-all border border-zinc-200 dark:border-zinc-700"
              >
                 استعادة البيانات من هذا الأرشيف
              </button>
           </div>
         ))}
         {filteredArchives.length === 0 && (
           <div className="col-span-full py-20 text-center space-y-4">
              <Archive className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mx-auto" />
              <p className="text-zinc-500 font-bold">لا توجد سجلات مؤرشفة حالياً.</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default ArchivesView;
