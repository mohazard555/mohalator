
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Landmark, PieChart, TrendingUp, TrendingDown, 
  Package, DollarSign, Calculator, FileText, Printer, ImageIcon, 
  Plus, Save, Trash2, Edit2, Calendar, FileSpreadsheet, Box, 
  Layers, HardDrive, ListOrdered, Percent, Scale, X
} from 'lucide-react';
import { 
  OpeningEntry, PeriodicInventory, AppSettings, CashEntry, 
  SalesInvoice, PurchaseInvoice, InventoryItem, StockEntry 
} from '../types';
import { ImageExportService } from '../utils/ImageExportService';
import { exportToCSV } from '../utils/export';
import { tafqeet } from '../utils/tafqeet';

interface AccountingCenterViewProps {
  onBack: () => void;
}

const AccountingCenterView: React.FC<AccountingCenterViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'OPENING_ENTRY' | 'INVENTORY_TOOLS'>('REPORTS');
  const [reportType, setReportType] = useState<'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'TRADING'>('BALANCE_SHEET');
  
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);
  const [inventories, setInventories] = useState<PeriodicInventory[]>([]);
  
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isAddingInventory, setIsAddingInventory] = useState(false);
  const [invType, setInvType] = useState<'OPENING' | 'CLOSING'>('OPENING');

  const [formData, setFormData] = useState<Partial<OpeningEntry>>({
    accountName: '', accountType: 'أصول', debit: 0, credit: 0, date: new Date().toISOString().split('T')[0], notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const sSett = localStorage.getItem('sheno_settings');
    const sOp = localStorage.getItem('sheno_opening_entries');
    const sInv = localStorage.getItem('sheno_periodic_inventories');
    
    if (sSett) setSettings(JSON.parse(sSett));
    if (sOp) setOpeningEntries(JSON.parse(sOp));
    if (sInv) setInventories(JSON.parse(sInv));
  };

  const handleSaveEntry = () => {
    if (!formData.accountName) return;
    const newEntry = { ...formData, id: crypto.randomUUID() } as OpeningEntry;
    const updated = [newEntry, ...openingEntries];
    setOpeningEntries(updated);
    localStorage.setItem('sheno_opening_entries', JSON.stringify(updated));
    setIsAddingEntry(false);
    setFormData({ accountName: '', accountType: 'أصول', debit: 0, credit: 0, date: new Date().toISOString().split('T')[0], notes: '' });
    
    // تسجيل في اليومية كحركة افتتاحية
    const savedJournal = localStorage.getItem('sheno_cash_journal');
    const journal: CashEntry[] = savedJournal ? JSON.parse(savedJournal) : [];
    journal.push({
      id: crypto.randomUUID(),
      date: newEntry.date,
      statement: `قيد افتتاحي: ${newEntry.notes || newEntry.accountName}`,
      receivedSYP: newEntry.debit,
      paidSYP: newEntry.credit,
      receivedUSD: 0,
      paidUSD: 0,
      notes: newEntry.notes,
      type: 'افتتاحي'
    });
    localStorage.setItem('sheno_cash_journal', JSON.stringify(journal));
  };

  const calculateFinancials = () => {
    const journalRaw = localStorage.getItem('sheno_cash_journal');
    const journal: CashEntry[] = journalRaw ? JSON.parse(journalRaw) : [];
    
    const openingStock = inventories.filter(i => i.type === 'OPENING').sort((a,b) => b.date.localeCompare(a.date))[0]?.totalValue || 0;
    const closingStock = inventories.filter(i => i.type === 'CLOSING').sort((a,b) => b.date.localeCompare(a.date))[0]?.totalValue || 0;

    const revenues = journal.reduce((s, c) => s + (c.type === 'بيع' ? c.receivedSYP : 0), 0);
    const purchases = journal.reduce((s, c) => s + (c.type === 'شراء' ? c.paidSYP : 0), 0);
    const expenses = journal.reduce((s, c) => s + (c.type === 'دفع' ? c.paidSYP : 0), 0);
    
    const cogs = openingStock + purchases - closingStock;
    const grossProfit = revenues - cogs;
    const netProfit = grossProfit - expenses;

    // لميزانية العمومية
    const assetsOp = openingEntries.filter(e => e.accountType === 'أصول').reduce((s, c) => s + c.debit - c.credit, 0);
    const liabOp = openingEntries.filter(e => e.accountType === 'خصوم').reduce((s, c) => s + c.credit - c.debit, 0);
    const equityOp = openingEntries.filter(e => e.accountType === 'حقوق ملكية').reduce((s, c) => s + c.credit - c.debit, 0);

    const cashInHand = journal.reduce((s, c) => s + (c.receivedSYP - c.paidSYP), 0);

    return { revenues, purchases, expenses, cogs, grossProfit, netProfit, openingStock, closingStock, assetsOp, liabOp, equityOp, cashInHand };
  };

  const fin = calculateFinancials();

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    await ImageExportService.exportAsPng(reportRef.current, `تقرير_المركز_${reportType}_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
             <Landmark className="w-8 h-8 text-primary" />
             <div>
                <h2 className="text-2xl font-black text-readable">المركز المحاسبي المالي الذكي</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">الميزانية، قائمة الدخل، وتقييم الاستثمار</p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportImage} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
              <ImageIcon className="w-5 h-5" /> حفظ كصورة
           </button>
           <button onClick={() => window.print()} className="bg-rose-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
              <Printer className="w-5 h-5" /> طباعة التقرير
           </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-zinc-100 dark:bg-zinc-900 p-2 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 no-print">
         <button onClick={() => setActiveTab('REPORTS')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'REPORTS' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
            <PieChart className="w-5 h-5" /> التقارير الختامية والقوائم
         </button>
         <button onClick={() => setActiveTab('OPENING_ENTRY')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'OPENING_ENTRY' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
            <Scale className="w-5 h-5" /> القيد الافتتاحي والأرصدة
         </button>
         <button onClick={() => setActiveTab('INVENTORY_TOOLS')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'INVENTORY_TOOLS' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
            <Box className="w-5 h-5" /> جرد أول وآخر المدة
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6 no-print">
           {activeTab === 'REPORTS' && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-3">
                 <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b pb-2 mb-4">اختر نوع القائمة</h3>
                 <button onClick={() => setReportType('BALANCE_SHEET')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'BALANCE_SHEET' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500'}`}>الميزانية العمومية</button>
                 <button onClick={() => setReportType('INCOME_STATEMENT')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'INCOME_STATEMENT' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500'}`}>قائمة الأرباح والخسائر</button>
                 <button onClick={() => setReportType('TRADING')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'TRADING' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500'}`}>تقرير المتاجرة والتحليل</button>
              </div>
           )}

           {activeTab === 'OPENING_ENTRY' && (
              <div className="bg-primary p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl">
                 <Landmark className="w-12 h-12 opacity-50" />
                 <h3 className="text-xl font-black leading-tight">تأسيس السنة المالية والقيد الافتتاحي</h3>
                 <p className="text-xs font-bold opacity-80 leading-relaxed">قم بإدخال أرصدة الصندوق، الحسابات البنكية، والالتزامات كما هي في بداية الدورة المحاسبية الحالية.</p>
                 <button onClick={() => setIsAddingEntry(true)} className="w-full bg-white text-primary py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">إضافة بند قيد افتتاح</button>
              </div>
           )}

           {activeTab === 'INVENTORY_TOOLS' && (
              <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl">
                 <Box className="w-12 h-12 opacity-50" />
                 <h3 className="text-xl font-black leading-tight">تقييم المخزون الدوري</h3>
                 <p className="text-xs font-bold opacity-80 leading-relaxed">تسجيل بضاعة أول المدة ضروري لحساب تكلفة المبيعات، وبضاعة آخر المدة تعكس صافي الربح الحقيقي.</p>
                 <div className="flex flex-col gap-2">
                    <button onClick={() => { setInvType('OPENING'); setIsAddingInventory(true); }} className="w-full bg-white/20 hover:bg-white/30 py-3 rounded-2xl font-black text-sm border border-white/40">تسجيل بضاعة أول المدة</button>
                    <button onClick={() => { setInvType('CLOSING'); setIsAddingInventory(true); }} className="w-full bg-zinc-900 py-3 rounded-2xl font-black text-sm shadow-xl">تسجيل بضاعة آخر المدة</button>
                 </div>
              </div>
           )}
        </div>

        {/* Report Canvas */}
        <div className="lg:col-span-3">
           <div ref={reportRef} className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl export-fix min-h-[700px]">
              {/* Header Branding */}
              <div className="flex justify-between items-start mb-8 border-b-2 border-primary pb-6">
                 <div className="flex items-center gap-4">
                    {settings?.logoUrl ? <img src={settings.logoUrl} className="w-20 h-20 object-contain" /> : <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg">SH</div>}
                    <div>
                       <h1 className="text-2xl font-black text-zinc-900 dark:text-white leading-none">{settings?.companyName}</h1>
                       <p className="text-[10px] text-zinc-400 font-black uppercase mt-1 tracking-widest">{settings?.companyType}</p>
                    </div>
                 </div>
                 <div className="text-center">
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-white underline decoration-primary/20 underline-offset-8">
                       {activeTab === 'REPORTS' ? (reportType === 'BALANCE_SHEET' ? 'الميزانية العمومية' : reportType === 'INCOME_STATEMENT' ? 'قائمة الأرباح والخسائر' : 'حساب المتاجرة') : 
                        activeTab === 'OPENING_ENTRY' ? 'بيان القيد الافتتاحي العام' : 'سجلات الجرد الدوري والتقييم'}
                    </h2>
                    <p className="text-xs mt-4 font-bold text-zinc-400 uppercase tracking-widest">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</p>
                 </div>
                 <div className="text-left text-[10px] font-black text-zinc-400 space-y-1">
                    <p>{settings?.address}</p>
                    <p dir="ltr">{settings?.phone}</p>
                 </div>
              </div>

              {activeTab === 'REPORTS' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                   {reportType === 'BALANCE_SHEET' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         {/* Assets Side */}
                         <div className="space-y-4">
                            <h4 className="bg-zinc-900 text-white p-3 rounded-xl font-black text-center text-sm">الأصـــــول (Assets)</h4>
                            <div className="divide-y border border-zinc-100 rounded-2xl overflow-hidden">
                               <div className="flex justify-between p-4 bg-zinc-50 font-bold text-sm"><span>بضاعة آخر المدة</span><span className="font-mono text-primary">{fin.closingStock.toLocaleString()}</span></div>
                               <div className="flex justify-between p-4 bg-white font-bold text-sm"><span>النقدية (الصندوق)</span><span className="font-mono text-primary">{fin.cashInHand.toLocaleString()}</span></div>
                               <div className="flex justify-between p-4 bg-zinc-50 font-bold text-sm"><span>أرصدة افتتاحية (أصول)</span><span className="font-mono text-primary">{fin.assetsOp.toLocaleString()}</span></div>
                            </div>
                            <div className="flex justify-between p-5 bg-primary/10 rounded-2xl font-black text-xl text-primary border-2 border-primary/20">
                               <span>إجمالي الأصول</span>
                               <span>{(fin.closingStock + fin.cashInHand + fin.assetsOp).toLocaleString()}</span>
                            </div>
                         </div>
                         {/* Liabilities Side */}
                         <div className="space-y-4">
                            <h4 className="bg-zinc-400 text-zinc-900 p-3 rounded-xl font-black text-center text-sm">الخصوم وحقوق الملكية</h4>
                            <div className="divide-y border border-zinc-100 rounded-2xl overflow-hidden">
                               <div className="flex justify-between p-4 bg-zinc-50 font-bold text-sm"><span>رأس المال المفتتح</span><span className="font-mono">{fin.equityOp.toLocaleString()}</span></div>
                               <div className="flex justify-between p-4 bg-white font-bold text-sm"><span>صافي الربح للفترة</span><span className="font-mono text-emerald-600">+{fin.netProfit.toLocaleString()}</span></div>
                               <div className="flex justify-between p-4 bg-zinc-50 font-bold text-sm"><span>الالتزامات والخصوم</span><span className="font-mono text-rose-600">{fin.liabOp.toLocaleString()}</span></div>
                            </div>
                            <div className="flex justify-between p-5 bg-zinc-900 rounded-2xl font-black text-xl text-white shadow-xl">
                               <span>إجمالي الخصوم والملكية</span>
                               <span>{(fin.equityOp + fin.netProfit + fin.liabOp).toLocaleString()}</span>
                            </div>
                         </div>
                      </div>
                   )}

                   {reportType === 'INCOME_STATEMENT' && (
                      <div className="max-w-2xl mx-auto space-y-6">
                         <div className="bg-zinc-50 p-6 rounded-3xl border space-y-4 shadow-inner">
                            <div className="flex justify-between font-black text-lg border-b pb-2"><span>إجمالي الإيرادات (المبيعات)</span><span className="text-emerald-600">{fin.revenues.toLocaleString()}</span></div>
                            <div className="flex justify-between font-bold text-zinc-500"><span>تكلفة البضاعة المباعة (COGS)</span><span className="text-rose-600">({fin.cogs.toLocaleString()})</span></div>
                            <div className="flex justify-between font-black text-xl pt-2 border-t border-zinc-300"><span>مجمل الربح (Gross Profit)</span><span className="text-primary">{fin.grossProfit.toLocaleString()}</span></div>
                            <div className="flex justify-between font-bold text-zinc-500 mt-4"><span>المصاريف التشغيلية والإدارية</span><span className="text-rose-600">({fin.expenses.toLocaleString()})</span></div>
                         </div>
                         <div className="bg-zinc-900 p-8 rounded-[3rem] shadow-2xl flex items-center justify-between text-white">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Net Profit</span>
                               <span className="text-3xl font-black italic">صافي الربح النهائي</span>
                            </div>
                            <div className="text-right">
                               <span className="text-5xl font-mono font-black text-emerald-400">{fin.netProfit.toLocaleString()}</span>
                               <p className="text-[10px] font-black text-emerald-500/50 mt-2">{tafqeet(fin.netProfit, settings?.currency || 'ليرة')}</p>
                            </div>
                         </div>
                      </div>
                   )}
                </div>
              )}

              {activeTab === 'OPENING_ENTRY' && (
                 <div className="space-y-6">
                    <table className="w-full text-right border-collapse">
                       <thead className="bg-zinc-900 text-white text-[10px] font-black uppercase h-12">
                          <tr><th className="p-3">اسم الحساب</th><th className="p-3 text-center">النوع</th><th className="p-3 text-center">مدين (+)</th><th className="p-3 text-center">دائن (-)</th><th className="p-3 no-print"></th></tr>
                       </thead>
                       <tbody className="divide-y font-bold">
                          {openingEntries.map(e => (
                             <tr key={e.id} className="h-14 hover:bg-zinc-50">
                                <td className="p-3">{e.accountName}</td>
                                <td className="p-3 text-center text-xs text-zinc-400">{e.accountType}</td>
                                <td className="p-3 text-center font-mono text-emerald-600">{e.debit.toLocaleString()}</td>
                                <td className="p-3 text-center font-mono text-rose-600">{e.credit.toLocaleString()}</td>
                                <td className="p-3 text-center no-print">
                                   <button onClick={() => {
                                      const updated = openingEntries.filter(x => x.id !== e.id);
                                      setOpeningEntries(updated);
                                      localStorage.setItem('sheno_opening_entries', JSON.stringify(updated));
                                   }}><X className="w-6 h-6"/></button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              )}

              {activeTab === 'INVENTORY_TOOLS' && (
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
                       <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">إجمالي بضاعة أول المدة</span>
                          <p className="text-3xl font-mono font-black text-zinc-900">{fin.openingStock.toLocaleString()}</p>
                       </div>
                       <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 text-white">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">إجمالي بضاعة آخر المدة</span>
                          <p className="text-3xl font-mono font-black text-emerald-400">{fin.closingStock.toLocaleString()}</p>
                       </div>
                    </div>
                    <div className="border rounded-2xl overflow-hidden shadow-sm">
                       <table className="w-full text-right">
                          <thead className="bg-zinc-100 text-[10px] font-black h-10 border-b">
                             <tr><th className="p-3">التاريخ</th><th className="p-3">النوع</th><th className="p-3 text-center">القيمة الكلية</th><th className="p-3">ملاحظات</th></tr>
                          </thead>
                          <tbody className="font-bold">
                             {inventories.map(v => (
                               <tr key={v.id} className="h-12 border-b">
                                  <td className="p-3 font-mono text-xs">{v.date}</td>
                                  <td className="p-3"><span className={`px-3 py-1 rounded-full text-[9px] ${v.type === 'OPENING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{v.type === 'OPENING' ? 'أول المدة' : 'آخر المدة'}</span></td>
                                  <td className="p-3 text-center font-mono">{v.totalValue.toLocaleString()}</td>
                                  <td className="p-3 text-xs text-zinc-400">{v.notes || '-'}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* Modals */}
      {isAddingEntry && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl space-y-6">
               <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-xl font-black">إضافة بند للقيد الافتتاحي</h3>
                  <button onClick={() => setIsAddingEntry(false)}><X className="w-6 h-6"/></button>
               </div>
               <div className="space-y-4">
                  <input type="text" placeholder="اسم الحساب..." className="w-full bg-zinc-50 p-3 rounded-xl border outline-none font-bold" value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} />
                  <select className="w-full bg-zinc-50 p-3 rounded-xl border outline-none font-bold" value={formData.accountType} onChange={e => setFormData({...formData, accountType: e.target.value as any})}>
                     <option value="أصول">أصول (صندوق، بنك، ممتلكات)</option>
                     <option value="خصوم">خصوم (قروض، موردين دائنين)</option>
                     <option value="حقوق ملكية">حقوق ملكية (رأس مال، مسحوبات)</option>
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 mr-2">مدين (+)</label>
                        <input type="number" className="w-full bg-zinc-50 p-3 rounded-xl border font-mono font-black" value={formData.debit} onChange={e => setFormData({...formData, debit: Number(e.target.value)})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 mr-2">دائن (-)</label>
                        <input type="number" className="w-full bg-zinc-50 p-3 rounded-xl border font-mono font-black" value={formData.credit} onChange={e => setFormData({...formData, credit: Number(e.target.value)})} />
                     </div>
                  </div>
               </div>
               <button onClick={handleSaveEntry} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl">تثبيت البند</button>
            </div>
         </div>
      )}

      {isAddingInventory && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl space-y-6">
               <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-xl font-black">تسجيل جرد {invType === 'OPENING' ? 'أول المدة' : 'آخر المدة'}</h3>
                  <button onClick={() => setIsAddingInventory(false)}><X className="w-6 h-6"/></button>
               </div>
               <div className="space-y-4 text-center">
                  <p className="text-sm font-bold text-zinc-500">قم بإدخال القيمة المالية الإجمالية للمخزون المتبقي حالياً</p>
                  <input type="number" placeholder="القيمة المالية للجرد..." className="w-full bg-zinc-50 p-6 rounded-2xl border-2 border-emerald-500/20 text-center font-black text-4xl text-emerald-600 outline-none" id="invValue" />
                  <input type="date" className="w-full bg-zinc-50 p-3 rounded-xl border outline-none font-mono" defaultValue={new Date().toISOString().split('T')[0]} id="invDate" />
               </div>
               <button onClick={() => {
                  const val = Number((document.getElementById('invValue') as HTMLInputElement).value);
                  const date = (document.getElementById('invDate') as HTMLInputElement).value;
                  if (!val) return;
                  const newInv: PeriodicInventory = { id: crypto.randomUUID(), date, type: invType, items: [], totalValue: val, notes: 'جرد دوري' };
                  const updated = [newInv, ...inventories];
                  setInventories(updated);
                  localStorage.setItem('sheno_periodic_inventories', JSON.stringify(updated));
                  setIsAddingInventory(false);
                  loadData();
               }} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl">تثبيت الجرد والتقييم</button>
            </div>
         </div>
      )}
    </div>
  );
};

export default AccountingCenterView;
