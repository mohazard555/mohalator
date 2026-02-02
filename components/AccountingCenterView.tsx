
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Landmark, PieChart, TrendingUp, TrendingDown, 
  DollarSign, Calculator, Printer, ImageIcon, 
  Plus, Save, Trash2, X, ChevronDown, ChevronRight, MinusSquare, PlusSquare,
  Box, Search, RefreshCw, Scale, ListTree
} from 'lucide-react';
import { 
  OpeningEntry, PeriodicInventory, AppSettings, CashEntry, 
  SalesInvoice, PurchaseInvoice, InventoryItem, StockEntry, AccountingCategory, Party, PartyType
} from '../types';
import { ImageExportService } from '../utils/ImageExportService';
import { exportToCSV } from '../utils/export';
import { tafqeet } from '../utils/tafqeet';
import ChartOfAccountsView from './ChartOfAccountsView';

interface AccountingCenterViewProps {
  onBack: () => void;
  initialTab?: 'REPORTS' | 'OPENING_ENTRY' | 'INVENTORY_TOOLS' | 'CHART_OF_ACCOUNTS';
  initialReportType?: 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'TRADING';
  isSingleView?: boolean;
}

const AccountingCenterView: React.FC<AccountingCenterViewProps> = ({ 
  onBack, 
  initialTab, 
  initialReportType,
  isSingleView = false 
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'OPENING_ENTRY' | 'INVENTORY_TOOLS' | 'CHART_OF_ACCOUNTS'>(initialTab || 'REPORTS');
  const [reportType, setReportType] = useState<'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'TRADING'>(initialReportType || 'BALANCE_SHEET');
  
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);
  const [inventories, setInventories] = useState<PeriodicInventory[]>([]);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [allSales, setAllSales] = useState<SalesInvoice[]>([]);
  const [allPurchases, setAllPurchases] = useState<PurchaseInvoice[]>([]);
  const [allParties, setAllParties] = useState<Party[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isAddingInventory, setIsAddingInventory] = useState(false);
  const [invType, setInvType] = useState<'OPENING' | 'CLOSING'>('OPENING');
  
  const [expandedBS, setExpandedBS] = useState<Set<string>>(new Set());
  const [expandedInventories, setExpandedInventories] = useState<Set<string>>(new Set());
  const [printDetails, setPrintDetails] = useState(false);

  // Inventory Modal States
  const [invItems, setInvItems] = useState<PeriodicInventory['items']>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [showItemResults, setShowItemResults] = useState(false);
  const [inventoryTotal, setInventoryTotal] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    if (initialReportType) setReportType(initialReportType);
  }, [initialTab, initialReportType]);

  const loadData = () => {
    const sSett = localStorage.getItem('sheno_settings');
    const sOp = localStorage.getItem('sheno_opening_entries');
    const sInv = localStorage.getItem('sheno_periodic_inventories');
    const sCat = localStorage.getItem('sheno_accounting_categories');
    const sJou = localStorage.getItem('sheno_cash_journal');
    const sSal = localStorage.getItem('sheno_sales_invoices');
    const sPur = localStorage.getItem('sheno_purchases');
    const sPar = localStorage.getItem('sheno_parties');
    const sInvList = localStorage.getItem('sheno_inventory_list');
    const sStock = localStorage.getItem('sheno_stock_entries');
    
    if (sSett) setSettings(JSON.parse(sSett));
    if (sOp) setOpeningEntries(JSON.parse(sOp));
    if (sInv) setInventories(JSON.parse(sInv));
    if (sCat) setCategories(JSON.parse(sCat));
    if (sJou) setJournal(JSON.parse(sJou));
    if (sSal) setAllSales(JSON.parse(sSal));
    if (sPur) setAllPurchases(JSON.parse(sPur));
    if (sPar) setAllParties(JSON.parse(sPar));

    const entries: StockEntry[] = sStock ? JSON.parse(sStock) : [];
    const baseItems: InventoryItem[] = sInvList ? JSON.parse(sInvList) : [];

    const updatedInventoryList = baseItems.map(item => {
        const itemEntries = entries.filter(e => e.itemCode === item.code);
        const added = itemEntries.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
        const issued = itemEntries.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
        const returned = itemEntries.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
        return { 
           ...item, 
           currentBalance: (Number(item.openingStock) || 0) + added - issued + returned 
        };
    });
    setInventoryList(updatedInventoryList);
  };

  const calculateFinancials = () => {
    const openingStockInv = inventories.filter(i => i.type === 'OPENING').sort((a,b) => b.date.localeCompare(a.date))[0];
    const closingStockInv = inventories.filter(i => i.type === 'CLOSING').sort((a,b) => b.date.localeCompare(a.date))[0];
    const openingStock = openingStockInv?.totalValue || 0;
    const closingStock = closingStockInv?.totalValue || 0;

    const expenseCats = categories.filter(c => c.type === 'مصروفات').map(cat => ({
      ...cat,
      total: journal.filter(j => j.categoryId === cat.id).reduce((s, c) => s + (c.paidSYP || 0), 0),
    }));
    
    const directExpensesTotal = journal.filter(j => j.type === 'دفع' && !j.categoryId).reduce((s, c) => s + (c.paidSYP || 0), 0);
    const totalExpenses = expenseCats.reduce((s, c) => s + c.total, 0) + directExpensesTotal;

    const totalSales = allSales.reduce((s, c) => s + c.totalAmount, 0);
    const totalPurchases = allPurchases.reduce((s, c) => s + c.totalAmount, 0);
    
    const cogs = openingStock + totalPurchases - closingStock;
    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - totalExpenses;

    const cashInHand = journal.reduce((s, c) => s + (c.receivedSYP - c.paidSYP), 0);

    const receivables = allParties.filter(p => p.type === PartyType.CUSTOMER || p.type === PartyType.BOTH).reduce((s, p) => {
        const pSales = allSales.filter(inv => inv.customerName === p.name).reduce((sum, inv) => sum + inv.totalAmount, 0);
        const pPaid = journal.filter(j => j.partyName === p.name).reduce((sum, j) => sum + j.receivedSYP, 0);
        return s + (p.openingBalance + pSales - pPaid);
    }, 0);

    const payables = allParties.filter(p => p.type === PartyType.SUPPLIER || p.type === PartyType.BOTH).reduce((s, p) => {
        const pPurch = allPurchases.filter(inv => inv.supplierName === p.name).reduce((sum, inv) => sum + inv.totalAmount, 0);
        const pPaid = journal.filter(j => j.partyName === p.name).reduce((sum, j) => sum + j.paidSYP, 0);
        return s + (p.openingBalance + pPurch - pPaid);
    }, 0);

    const fixedAssets = openingEntries.filter(e => e.accountType === 'أصول').reduce((s, c) => s + (c.debit - c.credit), 0);
    const equityOpening = openingEntries.filter(e => e.accountType === 'حقوق ملكية').reduce((s, c) => s + (c.credit - c.debit), 0);

    return { 
      totalSales, totalPurchases, totalExpenses, cogs, grossProfit, netProfit, 
      openingStock, closingStock, cashInHand, receivables, payables, fixedAssets, equityOpening,
      expenseCats, directExpensesTotal
    };
  };

  const fin = calculateFinancials();

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    await ImageExportService.exportAsPng(reportRef.current, `Financial_Report_${reportType}`);
  };

  const [formData, setFormData] = useState<Partial<OpeningEntry>>({
    accountName: '', accountType: 'أصول', debit: 0, credit: 0, date: new Date().toISOString().split('T')[0], notes: ''
  });

  const handleSaveEntry = () => {
    if (!formData.accountName) return;
    const newEntry = { ...formData, id: crypto.randomUUID() } as OpeningEntry;
    const updated = [newEntry, ...openingEntries];
    localStorage.setItem('sheno_opening_entries', JSON.stringify(updated));
    setIsAddingEntry(false);
    loadData();
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
                <h2 className="text-2xl font-black text-readable">
                   {isSingleView ? (
                      reportType === 'BALANCE_SHEET' ? 'الميزانية العمومية' :
                      reportType === 'TRADING' ? 'حساب المتاجرة' :
                      reportType === 'INCOME_STATEMENT' ? 'الأرباح والخسائر' : 
                      activeTab === 'OPENING_ENTRY' ? 'القيود الافتتاحية' : 
                      activeTab === 'CHART_OF_ACCOUNTS' ? 'دليل الحسابات' : 'الجرد الدوري'
                   ) : 'المركز المحاسبي المالي الذكي'}
                </h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">إدارة الدورة المحاسبية الكاملة</p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportImage} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
              <ImageIcon className="w-5 h-5" /> حفظ كصورة
           </button>
           <button onClick={() => window.print()} className="bg-rose-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
              <Printer className="w-5 h-5" /> طباعة
           </button>
        </div>
      </div>

      {!isSingleView && (
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-2 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 no-print">
           <button onClick={() => setActiveTab('REPORTS')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'REPORTS' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
              <PieChart className="w-5 h-5" /> التقارير الختامية
           </button>
           <button onClick={() => setActiveTab('CHART_OF_ACCOUNTS')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'CHART_OF_ACCOUNTS' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
              <ListTree className="w-5 h-5" /> دليل الحسابات
           </button>
           <button onClick={() => setActiveTab('OPENING_ENTRY')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'OPENING_ENTRY' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
              <Scale className="w-5 h-5" /> القيد الافتتاحي
           </button>
           <button onClick={() => setActiveTab('INVENTORY_TOOLS')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'INVENTORY_TOOLS' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
              <Box className="w-5 h-5" /> جرد المخزون الدوري
           </button>
        </div>
      )}

      {activeTab === 'CHART_OF_ACCOUNTS' ? (
         <ChartOfAccountsView />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {!isSingleView && (
          <div className="lg:col-span-1 space-y-6 no-print">
            {activeTab === 'REPORTS' && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-3">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b pb-2 mb-4">اختر نوع التقرير</h3>
                  <button onClick={() => setReportType('BALANCE_SHEET')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'BALANCE_SHEET' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500'}`}>الميزانية العمومية</button>
                  <button onClick={() => setReportType('TRADING')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'TRADING' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500'}`}>حساب المتاجرة</button>
                  <button onClick={() => setReportType('INCOME_STATEMENT')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'INCOME_STATEMENT' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500'}`}>قائمة الأرباح والخسائر</button>
              </div>
            )}
            {activeTab === 'OPENING_ENTRY' && (
              <button onClick={() => setIsAddingEntry(true)} className="w-full bg-primary text-white p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg">
                <Plus className="w-5 h-5" /> إضافة قيد جديد
              </button>
            )}
          </div>
        )}

        <div className={isSingleView ? "lg:col-span-4" : "lg:col-span-3"}>
           {activeTab === 'REPORTS' && (
             <div ref={reportRef} className="bg-white dark:bg-zinc-950 p-6 md:p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl export-fix min-h-[600px]">
                <div className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6 text-zinc-900 dark:text-white">
                   <div className="flex items-center gap-4">
                      {settings?.logoUrl ? <img src={settings.logoUrl} className="w-16 h-16 object-contain" /> : <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl">SH</div>}
                      <div><h1 className="text-xl font-black">{settings?.companyName}</h1><p className="text-[10px] text-zinc-400 font-black uppercase mt-1">{settings?.companyType}</p></div>
                   </div>
                   <div className="text-center">
                      <h2 className="text-2xl font-black underline decoration-primary/20 underline-offset-8">
                         {reportType === 'BALANCE_SHEET' ? 'الميزانية العمومية' : 
                          reportType === 'INCOME_STATEMENT' ? 'قائمة الأرباح والخسائر' : 'حساب المتاجرة'}
                      </h2>
                      <p className="text-[10px] mt-4 font-bold text-zinc-400 uppercase tracking-widest">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</p>
                   </div>
                   <div className="text-left text-[10px] font-black text-zinc-400">
                      <p>{settings?.address}</p><p dir="ltr">{settings?.phone}</p>
                   </div>
                </div>

                {reportType === 'BALANCE_SHEET' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-zinc-900 dark:text-zinc-100">
                    <div className="space-y-4">
                        <h4 className="bg-zinc-900 text-white p-3 rounded-xl font-black text-center text-xs uppercase tracking-widest">الأصـــــول</h4>
                        <div className="divide-y border rounded-2xl overflow-hidden">
                           <div className="flex justify-between p-4 bg-zinc-50 dark:bg-zinc-900 font-bold text-sm"><span>مخزون آخر المدة</span><span className="font-mono">{fin.closingStock.toLocaleString()}</span></div>
                           <div className="flex justify-between p-4 bg-white dark:bg-zinc-800 font-bold text-sm"><span>النقدية (الصندوق)</span><span className="font-mono">{fin.cashInHand.toLocaleString()}</span></div>
                           <div className="flex justify-between p-4 bg-zinc-50 dark:bg-zinc-900 font-bold text-sm"><span>الذمم المدينة</span><span className="font-mono">{fin.receivables.toLocaleString()}</span></div>
                           <div className="flex justify-between p-4 bg-white dark:bg-zinc-800 font-bold text-sm"><span>الأصول الثابتة</span><span className="font-mono">{fin.fixedAssets.toLocaleString()}</span></div>
                        </div>
                        <div className="flex justify-between p-5 bg-primary/10 rounded-2xl font-black text-lg text-primary border border-primary/20">
                           <span>إجمالي الموجودات</span>
                           <span className="font-mono">{(fin.closingStock + fin.cashInHand + fin.receivables + fin.fixedAssets).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="bg-zinc-400 text-zinc-900 p-3 rounded-xl font-black text-center text-xs uppercase tracking-widest">الخصوم وحقوق الملكية</h4>
                        <div className="divide-y border rounded-2xl overflow-hidden">
                           <div className="flex justify-between p-4 bg-zinc-50 dark:bg-zinc-900 font-bold text-sm"><span>رأس مال التأسيس</span><span className="font-mono">{fin.equityOpening.toLocaleString()}</span></div>
                           <div className="flex justify-between p-4 bg-white dark:bg-zinc-800 font-bold text-sm"><span>الأرباح المحققة</span><span className="font-mono text-emerald-600">+{fin.netProfit.toLocaleString()}</span></div>
                           <div className="flex justify-between p-4 bg-zinc-50 dark:bg-zinc-900 font-bold text-sm"><span>الذمم الدائنة</span><span className="font-mono text-rose-600">{fin.payables.toLocaleString()}</span></div>
                        </div>
                        <div className="flex justify-between p-5 bg-zinc-900 rounded-2xl font-black text-lg text-white shadow-xl">
                           <span>إجمالي المطالبات</span>
                           <span className="font-mono">{(fin.equityOpening + fin.netProfit + fin.payables).toLocaleString()}</span>
                        </div>
                    </div>
                  </div>
                )}

                {reportType === 'TRADING' && (
                  <div className="space-y-6 text-zinc-900 dark:text-zinc-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-2 border-zinc-200 rounded-[2rem] overflow-hidden">
                       <div className="border-l-2 border-zinc-200 flex flex-col">
                          <div className="bg-zinc-100 p-3 font-black text-center text-xs">منه (مدين)</div>
                          <div className="flex-1 divide-y">
                             <div className="flex justify-between p-4 text-sm font-bold"><span>بضاعة أول المدة</span><span className="font-mono">{fin.openingStock.toLocaleString()}</span></div>
                             <div className="flex justify-between p-4 text-sm font-bold"><span>إجمالي المشتريات</span><span className="font-mono">{fin.totalPurchases.toLocaleString()}</span></div>
                             {fin.grossProfit > 0 && <div className="flex justify-between p-5 bg-emerald-50 text-emerald-700 font-black"><span>مجمل الربح</span><span className="font-mono">{fin.grossProfit.toLocaleString()}</span></div>}
                          </div>
                       </div>
                       <div className="flex flex-col">
                          <div className="bg-zinc-800 text-white p-3 font-black text-center text-xs">له (دائن)</div>
                          <div className="flex-1 divide-y">
                             <div className="flex justify-between p-4 text-sm font-bold"><span>إجمالي المبيعات</span><span className="font-mono">{fin.totalSales.toLocaleString()}</span></div>
                             <div className="flex justify-between p-4 text-sm font-bold"><span>بضاعة آخر المدة</span><span className="font-mono">{fin.closingStock.toLocaleString()}</span></div>
                             {fin.grossProfit < 0 && <div className="flex justify-between p-5 bg-rose-50 text-rose-700 font-black"><span>مجمل الخسارة</span><span className="font-mono">{Math.abs(fin.grossProfit).toLocaleString()}</span></div>}
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {reportType === 'INCOME_STATEMENT' && (
                  <div className="space-y-6 text-zinc-900 dark:text-zinc-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <h4 className="bg-emerald-600 text-white p-2 rounded-lg font-black text-center text-xs uppercase">إيرادات أخرى</h4>
                          <div className="border rounded-2xl overflow-hidden divide-y">
                             <div className="flex justify-between p-4 bg-emerald-50/30 font-bold text-sm"><span>مجمل الربح (متاجرة)</span><span className="font-mono">{fin.grossProfit > 0 ? fin.grossProfit.toLocaleString() : '0'}</span></div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <h4 className="bg-rose-700 text-white p-2 rounded-lg font-black text-center text-xs uppercase">مصاريف عامة</h4>
                          <div className="border rounded-2xl overflow-hidden divide-y">
                             {fin.expenseCats.map(cat => (
                                <div key={cat.id} className="flex justify-between p-3 px-6 text-xs text-zinc-500 italic"><span>← {cat.name}</span><span className="font-mono">{cat.total.toLocaleString()}</span></div>
                             ))}
                             {fin.directExpensesTotal > 0 && <div className="flex justify-between p-3 px-6 text-xs text-zinc-400"><span>← مصاريف متنوعة</span><span className="font-mono">{fin.directExpensesTotal.toLocaleString()}</span></div>}
                          </div>
                       </div>
                    </div>
                    <div className="mt-10 p-8 rounded-[2rem] bg-zinc-900 text-white shadow-xl flex flex-col items-center gap-2 border-4 border-primary/20">
                       <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">صافي الربح الموزع</span>
                       <div className="text-4xl font-mono font-black">{fin.netProfit.toLocaleString()}</div>
                       <span className="text-xs opacity-60">{settings?.currency}</span>
                    </div>
                  </div>
                )}
             </div>
           )}

           {activeTab === 'OPENING_ENTRY' && (
             <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-readable"><Scale className="w-6 h-6 text-primary"/> سجل الأرصدة الافتتاحية</h3>
                <div className="overflow-x-auto rounded-2xl border border-zinc-100 dark:border-zinc-800">
                   <table className="w-full text-right text-sm">
                      <thead>
                         <tr className="bg-zinc-900 text-white font-black h-10">
                            <th className="p-3">التاريخ</th><th className="p-3">اسم الحساب</th><th className="p-3 text-center">التصنيف</th><th className="p-3 text-center">مدين</th><th className="p-3 text-center">دائن</th><th className="p-3 text-center">إجراء</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y font-bold">
                         {openingEntries.map(e => (
                           <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                              <td className="p-3 font-mono text-zinc-400">{e.date}</td>
                              <td className="p-3">{e.accountName}</td>
                              <td className="p-3 text-center"><span className="text-[9px] font-black">{e.accountType}</span></td>
                              <td className="p-3 text-center font-mono text-emerald-600">{e.debit.toLocaleString()}</td>
                              <td className="p-3 text-center font-mono text-rose-600">{e.credit.toLocaleString()}</td>
                              <td className="p-3 text-center"><button onClick={() => {
                                 const updated = openingEntries.filter(x => x.id !== e.id);
                                 localStorage.setItem('sheno_opening_entries', JSON.stringify(updated));
                                 loadData();
                              }} className="text-rose-500"><Trash2 className="w-4 h-4"/></button></td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {activeTab === 'INVENTORY_TOOLS' && (
              <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black flex items-center gap-2 text-readable"><Box className="w-6 h-6 text-primary"/> جرد المخزون الدوري</h3>
                    <div className="flex gap-2 no-print">
                       <button onClick={() => { setInvType('OPENING'); setIsAddingInventory(true); setInvItems([]); setInventoryTotal(0); }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-xs">جرد أول مدة</button>
                       <button onClick={() => { setInvType('CLOSING'); setIsAddingInventory(true); setInvItems([]); setInventoryTotal(0); }} className="bg-rose-900 text-white px-4 py-2 rounded-xl font-black text-xs">جرد آخر مدة</button>
                    </div>
                 </div>
                 <div className="space-y-4">
                    {inventories.map(inv => (
                       <div key={inv.id} className="border rounded-2xl p-4 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-900">
                          <div className="flex items-center gap-4">
                             <Box className={`w-6 h-6 ${inv.type === 'OPENING' ? 'text-emerald-500' : 'text-rose-500'}`} />
                             <div>
                                <span className="font-black text-sm block">{inv.type === 'OPENING' ? 'جرد أول الفترة' : 'جرد نهاية الفترة'}</span>
                                <span className="text-[10px] text-zinc-400 font-mono">{inv.date}</span>
                             </div>
                          </div>
                          <div className="text-left">
                             <span className="text-[10px] text-zinc-400 font-bold block">قيمة بضاعة الجرد</span>
                             <span className="text-xl font-mono font-black text-primary">{inv.totalValue.toLocaleString()}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}
        </div>
      </div>
      )}

      {isAddingEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8 animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black">إضافة قيد افتتاحي</h3>
                 <button onClick={() => setIsAddingEntry(false)} className="text-zinc-400"><X className="w-6 h-6"/></button>
              </div>
              <div className="space-y-4">
                 <input type="text" placeholder="اسم الحساب..." className="w-full bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-black outline-none focus:border-primary" value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} />
                 <select className="w-full bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-black outline-none" value={formData.accountType} onChange={e => setFormData({...formData, accountType: e.target.value as any})}>
                    <option value="أصول">أصول</option><option value="خصوم">خصوم</option><option value="حقوق ملكية">حقوق ملكية</option>
                 </select>
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="مدين" className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-mono font-black text-emerald-600" value={formData.debit} onChange={e => setFormData({...formData, debit: Number(e.target.value)})} />
                    <input type="number" placeholder="دائن" className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-mono font-black text-rose-600" value={formData.credit} onChange={e => setFormData({...formData, credit: Number(e.target.value)})} />
                 </div>
                 <button onClick={handleSaveEntry} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg">حفظ القيد</button>
              </div>
           </div>
        </div>
      )}

      {isAddingInventory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black">تسجيل جرد بضاعة دوري</h3>
                 <button onClick={() => setIsAddingInventory(false)} className="text-zinc-400"><X className="w-6 h-6"/></button>
              </div>
              <div className="space-y-4">
                 <p className="text-xs text-zinc-500 font-bold">يرجى إدخال القيمة الكلية المقدرة للجرد حسب {invType === 'OPENING' ? 'بداية الفترة' : 'نهاية الفترة'}</p>
                 <input type="number" placeholder="القيمة المالية الكلية للجرد..." className="w-full bg-zinc-50 dark:bg-zinc-950 border-4 border-zinc-100 p-6 rounded-2xl text-center text-3xl font-mono font-black text-primary outline-none focus:border-primary transition-all" value={inventoryTotal} onChange={e => setInventoryTotal(Number(e.target.value))} />
                 <button onClick={() => {
                    const total = inventoryTotal || 0;
                    const newInv: PeriodicInventory = { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], type: invType, items: [], totalValue: total, notes: '' };
                    const updated = [newInv, ...inventories];
                    localStorage.setItem('sheno_periodic_inventories', JSON.stringify(updated));
                    setIsAddingInventory(false);
                    setInventoryTotal(0); 
                    loadData();
                 }} className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black shadow-lg">تثبيت واعتماد الجرد</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AccountingCenterView;
