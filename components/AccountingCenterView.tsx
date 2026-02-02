
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Landmark, PieChart, TrendingUp, TrendingDown, 
  Package, DollarSign, Calculator, FileText, Printer, ImageIcon, 
  Plus, Save, Trash2, Edit2, Calendar, FileSpreadsheet, Box, 
  Layers, HardDrive, ListOrdered, Percent, Scale, X, ChevronDown, ChevronRight, MinusSquare, PlusSquare,
  Users, ShoppingBag, ArrowLeftRight, Activity, BarChart3, Eye, EyeOff, Search, RefreshCw
} from 'lucide-react';
import { 
  OpeningEntry, PeriodicInventory, AppSettings, CashEntry, 
  SalesInvoice, PurchaseInvoice, InventoryItem, StockEntry, AccountingCategory, Party, PartyType
} from '../types';
import { ImageExportService } from '../utils/ImageExportService';
import { exportToCSV } from '../utils/export';
import { tafqeet } from '../utils/tafqeet';

interface AccountingCenterViewProps {
  onBack: () => void;
  initialTab?: 'REPORTS' | 'OPENING_ENTRY' | 'INVENTORY_TOOLS';
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
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'OPENING_ENTRY' | 'INVENTORY_TOOLS'>(initialTab || 'REPORTS');
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

  useEffect(() => {
    loadData();
  }, []);

  // تحديث الحالة عند تغيير الـ Props (للسماح بالتنقل المباشر من اللوحة)
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

    if (sSett) setSettings(JSON.parse(sSett));
    if (sOp) setOpeningEntries(JSON.parse(sOp));
    if (sInv) setInventories(JSON.parse(sInv));
    if (sCat) setCategories(JSON.parse(sCat));
    if (sJou) setJournal(JSON.parse(sJou));
    if (sSal) setAllSales(JSON.parse(sSal));
    if (sPur) setAllPurchases(JSON.parse(sPur));
    if (sPar) setAllParties(JSON.parse(sPar));
    setInventoryList(updatedInventoryList);
  };

  const fetchCurrentStockBalances = () => {
    const autoItems = inventoryList
      .filter(i => i.currentBalance > 0)
      .map(i => ({
        itemCode: i.code,
        itemName: i.name,
        quantity: i.currentBalance,
        price: i.price,
        total: i.currentBalance * i.price
      }));
    setInvItems(autoItems);
  };

  const toggleBS = (id: string) => {
    const newSet = new Set(expandedBS);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedBS(newSet);
  };

  const toggleInventory = (id: string) => {
    const newSet = new Set(expandedInventories);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedInventories(newSet);
  };

  const calculateFinancials = () => {
    const openingStockInv = inventories.filter(i => i.type === 'OPENING').sort((a,b) => b.date.localeCompare(a.date))[0];
    const closingStockInv = inventories.filter(i => i.type === 'CLOSING').sort((a,b) => b.date.localeCompare(a.date))[0];
    
    const openingStock = openingStockInv?.totalValue || 0;
    const closingStock = closingStockInv?.totalValue || 0;

    const revenueCats = categories.filter(c => c.type === 'إيرادات').map(cat => ({
      ...cat,
      total: journal.filter(j => j.categoryId === cat.id).reduce((s, c) => s + c.receivedSYP, 0),
    }));
    
    const directSalesTotal = journal.filter(j => j.type === 'بيع' && !j.categoryId).reduce((s, c) => s + c.receivedSYP, 0);
    const totalRevenuesFromJournal = revenueCats.reduce((s, c) => s + c.total, 0) + directSalesTotal;
    
    const invoiceSalesTotal = allSales.reduce((s, c) => s + c.totalAmount, 0);
    const totalSales = invoiceSalesTotal > 0 ? invoiceSalesTotal : totalRevenuesFromJournal;

    const expenseCats = categories.filter(c => c.type === 'مصروفات').map(cat => ({
      ...cat,
      total: journal.filter(j => j.categoryId === cat.id).reduce((s, c) => s + c.paidSYP, 0),
    }));
    
    const directExpensesTotal = journal.filter(j => j.type === 'دفع' && !j.categoryId).reduce((s, c) => s + c.paidSYP, 0);
    
    const invoicePurchasesTotal = allPurchases.reduce((s, c) => s + c.totalAmount, 0);
    const journalPurchasesTotal = journal.filter(j => j.type === 'شراء').reduce((s, c) => s + c.paidSYP, 0);
    const totalPurchases = invoicePurchasesTotal > 0 ? invoicePurchasesTotal : journalPurchasesTotal;

    const totalExpenses = expenseCats.reduce((s, c) => s + c.total, 0) + directExpensesTotal;
    
    const cogs = openingStock + totalPurchases - closingStock;
    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - totalExpenses;

    const cashInHand = journal.reduce((s, c) => s + (c.receivedSYP - c.paidSYP), 0);
    
    const customersBalances = allParties
      .filter(p => p.type === PartyType.CUSTOMER || p.type === PartyType.BOTH)
      .map(p => {
        const salesTotal = allSales.filter(s => s.customerName === p.name).reduce((s, c) => s + c.totalAmount, 0);
        const paymentsTotal = journal.filter(j => (j.partyName === p.name || j.statement.includes(p.name)) && j.receivedSYP > 0).reduce((s, c) => s + c.receivedSYP, 0);
        return { name: p.name, balance: (p.openingBalance || 0) + salesTotal - paymentsTotal };
      }).filter(p => p.balance !== 0);

    const totalReceivables = customersBalances.reduce((s, c) => s + c.balance, 0);

    const suppliersBalances = allParties
      .filter(p => p.type === PartyType.SUPPLIER || p.type === PartyType.BOTH)
      .map(p => {
        const purTotal = allPurchases.filter(pur => pur.supplierName === p.name).reduce((s, c) => s + c.totalAmount, 0);
        const paymentsTotal = journal.filter(j => (j.partyName === p.name || j.statement.includes(p.name)) && j.paidSYP > 0).reduce((s, c) => s + c.paidSYP, 0);
        return { name: p.name, balance: (p.openingBalance || 0) + purTotal - paymentsTotal };
      }).filter(p => p.balance !== 0);

    const totalPayables = suppliersBalances.reduce((s, c) => s + c.balance, 0);

    const openingAssetsItems = openingEntries.filter(e => e.accountType === 'أصول');
    const fixedAssets = openingAssetsItems.reduce((s, c) => s + (c.debit - c.credit), 0);
    
    const liabOpening = openingEntries.filter(e => e.accountType === 'خصوم').reduce((s, c) => s + (c.credit - c.debit), 0);
    const equityOpening = openingEntries.filter(e => e.accountType === 'حقوق ملكية').reduce((s, c) => s + (c.credit - c.debit), 0);

    return { 
      totalSales, totalPurchases, totalExpenses, cogs, grossProfit, netProfit, 
      openingStock, closingStock, cashInHand, 
      customersBalances, totalReceivables,
      suppliersBalances, totalPayables,
      openingAssetsItems, fixedAssets, 
      liabOpening, 
      equityOpening,
      revenueCats, expenseCats, directSalesTotal, directExpensesTotal
    };
  };

  const fin = calculateFinancials();

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    await ImageExportService.exportAsPng(reportRef.current, `تقرير_المركز_${reportType}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleSaveEntry = () => {
    if (!formData.accountName) return;
    const newEntry = { ...formData, id: crypto.randomUUID() } as OpeningEntry;
    const updated = [newEntry, ...openingEntries];
    localStorage.setItem('sheno_opening_entries', JSON.stringify(updated));
    setIsAddingEntry(false);
    setFormData({ accountName: '', accountType: 'أصول', debit: 0, credit: 0, date: new Date().toISOString().split('T')[0], notes: '' });
    loadData();
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القيد الافتتاحي؟')) {
      const updated = openingEntries.filter(e => e.id !== id);
      localStorage.setItem('sheno_opening_entries', JSON.stringify(updated));
      loadData();
    }
  };

  const [formData, setFormData] = useState<Partial<OpeningEntry>>({
    accountName: '', accountType: 'أصول', debit: 0, credit: 0, date: new Date().toISOString().split('T')[0], notes: ''
  });

  const [invMeta, setInvMeta] = useState({ date: new Date().toISOString().split('T')[0], notes: '' });

  const handleSelectItem = (item: InventoryItem) => {
    if (invItems.find(i => i.itemCode === item.code)) return;
    const newItem = { itemCode: item.code, itemName: item.name, quantity: 1, price: item.price, total: item.price };
    setInvItems([...invItems, newItem]);
    setShowItemResults(false);
    setItemSearch('');
  };

  const updateInvItem = (code: string, field: 'quantity' | 'price', val: number) => {
    const updated = invItems.map(it => {
      if (it.itemCode === code) {
        const newIt = { ...it, [field]: val };
        newIt.total = newIt.quantity * newIt.price;
        return newIt;
      }
      return it;
    });
    setInvItems(updated);
  };

  const handleSaveInventoryRecord = () => {
    if (invItems.length === 0) return;
    const total = invItems.reduce((s, i) => s + i.total, 0);
    const newInv: PeriodicInventory = {
      id: crypto.randomUUID(),
      date: invMeta.date,
      type: invType,
      items: invItems,
      totalValue: total,
      notes: invMeta.notes
    };
    const updated = [newInv, ...inventories];
    localStorage.setItem('sheno_periodic_inventories', JSON.stringify(updated));
    setIsAddingInventory(false);
    setInvItems([]);
    setInvMeta({ date: new Date().toISOString().split('T')[0], notes: '' });
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
                      activeTab === 'OPENING_ENTRY' ? 'القيود الافتتاحية' : 'الجرد الدوري'
                   ) : 'المركز المحاسبي المالي الذكي'}
                </h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">إدارة الدورة المحاسبية الكاملة</p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportImage} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:brightness-110 transition-all">
              <ImageIcon className="w-5 h-5" /> حفظ كصورة
           </button>
           <button onClick={() => window.print()} className="bg-rose-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 transition-all">
              <Printer className="w-5 h-5" /> طباعة التقرير
           </button>
        </div>
      </div>

      {/* شريط التنقل يظهر فقط إذا لم نكن في "وضع العرض المنفرد" */}
      {!isSingleView && (
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-2 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 no-print">
          <button onClick={() => setActiveTab('REPORTS')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'REPORTS' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
              <PieChart className="w-5 h-5" /> التقارير الختامية
          </button>
          <button onClick={() => setActiveTab('OPENING_ENTRY')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'OPENING_ENTRY' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
              <Scale className="w-5 h-5" /> القيد الافتتاحي
          </button>
          <button onClick={() => setActiveTab('INVENTORY_TOOLS')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'INVENTORY_TOOLS' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
              <Box className="w-5 h-5" /> جرد المخزون الدوري
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6 no-print">
           {activeTab === 'REPORTS' && !isSingleView && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-3">
                 <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b pb-2 mb-4">اختر نوع التقرير</h3>
                 <button onClick={() => setReportType('BALANCE_SHEET')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'BALANCE_SHEET' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500'}`}>الميزانية العمومية</button>
                 <button onClick={() => setReportType('TRADING')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'TRADING' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500'}`}>حساب المتاجرة</button>
                 <button onClick={() => setReportType('INCOME_STATEMENT')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'INCOME_STATEMENT' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500'}`}>قائمة الأرباح والخسائر</button>
              </div>
           )}

           {activeTab === 'OPENING_ENTRY' && (
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-4">
                <h3 className="text-sm font-black text-primary uppercase">الأرصدة الافتتاحية</h3>
                <p className="text-xs text-zinc-500 font-bold leading-relaxed">لتأسيس أرصدة الأصول والخصوم والحسابات غير المخزنية عند بداية تفعيل النظام.</p>
                <button onClick={() => setIsAddingEntry(true)} className="w-full bg-primary text-white p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all">
                   <Plus className="w-5 h-5" /> إضافة قيد جديد
                </button>
             </div>
           )}

           {activeTab === 'INVENTORY_TOOLS' && (
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-4">
                <h3 className="text-sm font-black text-primary uppercase">الجرد الدوري المفصل</h3>
                <p className="text-xs text-zinc-500 font-bold leading-relaxed">قم بتسجيل جرد الأصناف والكميات عند بداية أو نهاية الفترة المالية.</p>
                <div className="grid grid-cols-1 gap-2">
                   <button onClick={() => { setInvType('OPENING'); setIsAddingInventory(true); setInvItems([]); }} className="bg-emerald-600 text-white p-4 rounded-2xl font-black text-sm shadow-md hover:brightness-110 flex items-center justify-center gap-2 transition-all">
                      <TrendingUp className="w-5 h-5" /> تسجيل جرد أول المدة
                   </button>
                   <button onClick={() => { setInvType('CLOSING'); setIsAddingInventory(true); fetchCurrentStockBalances(); }} className="bg-rose-900 text-white p-4 rounded-2xl font-black text-sm shadow-md hover:brightness-110 flex items-center justify-center gap-2 transition-all">
                      <TrendingDown className="w-5 h-5" /> تسجيل جرد آخر المدة (تلقائي)
                   </button>
                </div>
             </div>
           )}
        </div>

        <div className={isSingleView && activeTab === 'REPORTS' ? "lg:col-span-4" : "lg:col-span-3"}>
           {activeTab === 'REPORTS' && (
             <div ref={reportRef} className="bg-white dark:bg-zinc-950 p-6 md:p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl export-fix min-h-[800px]">
                <div className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6 text-zinc-900 dark:text-white">
                   <div className="flex items-center gap-4">
                      {settings?.logoUrl ? <img src={settings.logoUrl} className="w-20 h-20 object-contain" /> : <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl">SH</div>}
                      <div><h1 className="text-2xl font-black">{settings?.companyName}</h1><p className="text-[10px] text-zinc-400 font-black uppercase mt-1">{settings?.companyType}</p></div>
                   </div>
                   <div className="text-center">
                      <h2 className="text-3xl font-black underline decoration-primary/20 underline-offset-8">
                         {reportType === 'BALANCE_SHEET' ? 'الميزانية العمومية للفترة' : 
                          reportType === 'INCOME_STATEMENT' ? 'قائمة الأرباح والخسائر' : 'حساب المتاجرة وتحليل البضاعة'}
                      </h2>
                      <p className="text-[10px] mt-4 font-bold text-zinc-400 uppercase tracking-widest">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</p>
                   </div>
                   <div className="text-left text-[10px] font-black text-zinc-400 space-y-1">
                      <p>{settings?.address}</p><p dir="ltr">{settings?.phone}</p>
                   </div>
                </div>

                {reportType === 'BALANCE_SHEET' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-zinc-900 dark:text-zinc-100">
                    <div className="space-y-4">
                        <h4 className="bg-zinc-900 text-white p-3 rounded-xl font-black text-center text-sm uppercase tracking-widest shadow-md">الأصـــــول (Assets)</h4>
                        <div className="divide-y border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-inner">
                           <div className="flex justify-between p-4 bg-zinc-50 dark:bg-zinc-900 font-bold text-sm"><span>مخزون بضاعة آخر المدة</span><span className="font-mono text-primary">{fin.closingStock.toLocaleString()}</span></div>
                           <div className="flex justify-between p-4 bg-white dark:bg-zinc-800 font-bold text-sm"><span>النقدية المتوفرة (الصندوق)</span><span className="font-mono text-primary">{fin.cashInHand.toLocaleString()}</span></div>
                           <div className={`p-4 bg-zinc-50 dark:bg-zinc-900 font-bold text-sm flex flex-col gap-2 transition-all ${expandedBS.has('ar') ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>
                             <div className="flex justify-between items-center cursor-pointer group" onClick={() => toggleBS('ar')}>
                                <span className="flex items-center gap-2 group-hover:text-primary">{expandedBS.has('ar') ? <MinusSquare className="w-4 h-4 text-zinc-400"/> : <PlusSquare className="w-4 h-4 text-primary"/>} الذمم المدينة (الزبائن)</span>
                                <span className="font-mono text-primary">{fin.totalReceivables.toLocaleString()}</span>
                             </div>
                             {(expandedBS.has('ar') || printDetails) && (
                               <div className={`mt-2 space-y-1.5 pr-6 border-r-2 border-primary/20 ${!printDetails && !expandedBS.has('ar') ? 'hidden' : ''}`}>
                                  {fin.customersBalances.map((c, i) => (
                                    <div key={i} className="flex justify-between text-[11px] font-normal italic text-zinc-500"><span>← {c.name}</span><span className="font-mono">{c.balance.toLocaleString()}</span></div>
                                  ))}
                               </div>
                             )}
                           </div>
                           <div className="flex justify-between p-4 bg-white dark:bg-zinc-800 font-bold text-sm"><span>الأصول الثابتة (عند التأسيس)</span><span className="font-mono text-primary">{fin.fixedAssets.toLocaleString()}</span></div>
                        </div>
                        <div className="flex justify-between p-5 bg-primary/10 rounded-2xl font-black text-xl text-primary border-2 border-primary/20 shadow-lg">
                           <span>إجمالي مـوجودات الشركة</span>
                           <span className="font-mono">{(fin.closingStock + fin.cashInHand + fin.totalReceivables + fin.fixedAssets).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="bg-zinc-400 text-zinc-900 p-3 rounded-xl font-black text-center text-sm uppercase tracking-widest shadow-md">الخصوم وحقوق الملكية</h4>
                        <div className="divide-y border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-inner">
                           <div className="flex justify-between p-4 bg-zinc-50 dark:bg-zinc-900 font-bold text-sm"><span>رأس مال التأسيس والحقوق</span><span className="font-mono">{fin.equityOpening.toLocaleString()}</span></div>
                           <div className="flex justify-between p-4 bg-white dark:bg-zinc-800 font-bold text-sm"><span>صافي الأرباح المحققة للفترة</span><span className="font-mono text-emerald-600">+{fin.netProfit.toLocaleString()}</span></div>
                           <div className={`p-4 bg-zinc-50 dark:bg-zinc-900 font-bold text-sm flex flex-col gap-2 ${expandedBS.has('ap') ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>
                             <div className="flex justify-between items-center cursor-pointer group" onClick={() => toggleBS('ap')}>
                                <span className="flex items-center gap-2 group-hover:text-primary">{expandedBS.has('ap') ? <MinusSquare className="w-4 h-4 text-zinc-400"/> : <PlusSquare className="w-4 h-4 text-primary"/>} الذمم الدائنة (الموردين)</span>
                                <span className="font-mono text-rose-600">{fin.totalPayables.toLocaleString()}</span>
                             </div>
                             {(expandedBS.has('ap') || printDetails) && (
                               <div className={`mt-2 space-y-1.5 pr-6 border-r-2 border-rose-500/20 ${!printDetails && !expandedBS.has('ap') ? 'hidden' : ''}`}>
                                  {fin.suppliersBalances.map((s, i) => (
                                    <div key={i} className="flex justify-between text-[11px] font-normal italic text-zinc-500"><span>← {s.name}</span><span className="font-mono">{s.balance.toLocaleString()}</span></div>
                                  ))}
                               </div>
                             )}
                           </div>
                        </div>
                        <div className="flex justify-between p-5 bg-zinc-900 rounded-2xl font-black text-xl text-white shadow-xl border-2 border-white/10">
                           <span>إجمالي مـطـالـبـات الشركة</span>
                           <span className="font-mono">{(fin.equityOpening + fin.netProfit + fin.totalPayables + fin.liabOpening).toLocaleString()}</span>
                        </div>
                    </div>
                  </div>
                )}

                {reportType === 'TRADING' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 text-zinc-900 dark:text-zinc-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-zinc-200 rounded-[2rem] overflow-hidden">
                       {/* Debit Side */}
                       <div className="border-l-2 border-zinc-200 flex flex-col">
                          <div className="bg-zinc-100 p-3 font-black text-center text-xs border-b border-zinc-200 uppercase tracking-widest">منه (مدين) / DEBIT</div>
                          <div className="flex-1 divide-y">
                             <div className="flex justify-between p-4 text-sm font-bold">
                                <span>بضاعة أول المدة (+)</span>
                                <span className="font-mono">{fin.openingStock.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between p-4 text-sm font-bold">
                                <span>إجمالي المشتريات (+)</span>
                                <span className="font-mono">{fin.totalPurchases.toLocaleString()}</span>
                             </div>
                             <div className="h-20 bg-zinc-50/20"></div>
                             {fin.grossProfit > 0 && (
                               <div className="flex justify-between p-5 bg-emerald-50 font-black text-emerald-700 border-t-2 border-emerald-200">
                                  <span>مجمل الربح المرحل ←</span>
                                  <span className="font-mono">{fin.grossProfit.toLocaleString()}</span>
                               </div>
                             )}
                          </div>
                       </div>

                       {/* Credit Side */}
                       <div className="flex flex-col">
                          <div className="bg-zinc-800 text-white p-3 font-black text-center text-xs border-b border-zinc-200 uppercase tracking-widest">له (دائن) / CREDIT</div>
                          <div className="flex-1 divide-y">
                             <div className="flex justify-between p-4 text-sm font-bold">
                                <span>إجمالي المبيعات (+)</span>
                                <span className="font-mono text-emerald-600">{fin.totalSales.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between p-4 text-sm font-bold">
                                <span>بضاعة آخر المدة (+)</span>
                                <span className="font-mono text-emerald-600">{fin.closingStock.toLocaleString()}</span>
                             </div>
                             <div className="h-20 bg-zinc-50/20"></div>
                             {fin.grossProfit < 0 && (
                               <div className="flex justify-between p-5 bg-rose-50 font-black text-rose-700 border-t-2 border-rose-200">
                                  <span>مجمل الخسارة المرحل ←</span>
                                  <span className="font-mono">{Math.abs(fin.grossProfit).toLocaleString()}</span>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                    <div className="flex justify-center p-4 bg-zinc-900 text-white rounded-2xl">
                        <span className="text-xs font-black uppercase tracking-widest">تكلفة البضاعة المباعة لهذه الفترة (COGS): <span className="text-emerald-400 font-mono text-lg ml-2">{fin.cogs.toLocaleString()}</span></span>
                    </div>
                  </div>
                )}

                {reportType === 'INCOME_STATEMENT' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 text-zinc-900 dark:text-zinc-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <h4 className="bg-emerald-600 text-white p-2 rounded-lg font-black text-center text-xs uppercase tracking-widest">إيرادات أخرى وأرباح</h4>
                          <div className="border rounded-2xl overflow-hidden divide-y">
                             <div className="flex justify-between p-4 bg-emerald-50/30 font-bold text-sm">
                                <span>مجمل الربح (من المتاجرة)</span>
                                <span className="font-mono text-emerald-600">{fin.grossProfit > 0 ? fin.grossProfit.toLocaleString() : '0'}</span>
                             </div>
                             {fin.revenueCats.map(cat => (
                                <div key={cat.id} className="flex justify-between p-3 px-6 text-xs text-zinc-500 italic">
                                   <span>← {cat.name}</span>
                                   <span className="font-mono">{cat.total.toLocaleString()}</span>
                                </div>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h4 className="bg-rose-700 text-white p-2 rounded-lg font-black text-center text-xs uppercase tracking-widest">مصاريف تشغيلية وعامة</h4>
                          <div className="border rounded-2xl overflow-hidden divide-y">
                             <div className="flex justify-between p-4 bg-rose-50/30 font-bold text-sm">
                                <span>مجمل الخسارة (إن وجد)</span>
                                <span className="font-mono text-rose-700">{fin.grossProfit < 0 ? Math.abs(fin.grossProfit).toLocaleString() : '0'}</span>
                             </div>
                             {fin.expenseCats.map(cat => (
                                <div key={cat.id} className="flex justify-between p-3 px-6 text-xs text-zinc-500 italic">
                                   <span>← {cat.name}</span>
                                   <span className="font-mono">{cat.total.toLocaleString()}</span>
                                </div>
                             ))}
                             {fin.directExpensesTotal > 0 && (
                                <div className="flex justify-between p-3 px-6 text-xs text-zinc-400">
                                   <span>← مصاريف متنوعة أخرى</span>
                                   <span className="font-mono">{fin.directExpensesTotal.toLocaleString()}</span>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="mt-10 p-8 rounded-[2.5rem] bg-zinc-900 text-white shadow-2xl flex flex-col items-center gap-2 border-4 border-primary/20">
                       <span className="text-xs font-black text-primary uppercase tracking-[0.3em]">صافي الربح الموزع للفترة</span>
                       <div className="text-5xl font-mono font-black tracking-tighter">
                          {fin.netProfit.toLocaleString()}
                       </div>
                       <span className="text-sm font-bold opacity-60 uppercase">{settings?.currency}</span>
                    </div>
                  </div>
                )}
             </div>
           )}

           {activeTab === 'OPENING_ENTRY' && (
             <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <h3 className="text-2xl font-black mb-6 text-readable flex items-center gap-2"><Scale className="w-6 h-6 text-primary"/> سجل الأرصدة الافتتاحية المعتمد</h3>
                <div className="overflow-x-auto rounded-3xl border border-zinc-100 dark:border-zinc-800">
                   <table className="w-full text-right border-collapse text-sm">
                      <thead>
                         <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase h-12">
                            <th className="p-4">تاريخ القيد</th><th className="p-4">اسم الحساب</th><th className="p-4 text-center">التصنيف</th><th className="p-4 text-center">مدين (+)</th><th className="p-4 text-center">دائن (-)</th><th className="p-4 text-center no-print">إجراءات</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-zinc-800 font-bold">
                         {openingEntries.map(e => (
                           <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                              <td className="p-4 font-mono text-zinc-400">{e.date}</td>
                              <td className="p-4 text-readable">{e.accountName}</td>
                              <td className="p-4 text-center"><span className="px-3 py-1 rounded-full text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border dark:border-zinc-700">{e.accountType}</span></td>
                              <td className="p-4 text-center font-mono text-emerald-600">{e.debit.toLocaleString()}</td>
                              <td className="p-4 text-center font-mono text-rose-600">{e.credit.toLocaleString()}</td>
                              <td className="p-4 text-center no-print"><button onClick={() => handleDeleteEntry(e.id)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {activeTab === 'INVENTORY_TOOLS' && (
             <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <h3 className="text-2xl font-black mb-6 text-readable flex items-center gap-2"><Box className="w-6 h-6 text-primary"/> سجلات الجرد الدوري والأرصدة</h3>
                <div className="space-y-4">
                   {inventories.map(inv => (
                      <div key={inv.id} className="border dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                         <div className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${inv.type === 'OPENING' ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : 'bg-rose-500/10 hover:bg-rose-500/20'}`} onClick={() => toggleInventory(inv.id)}>
                            <div className="flex items-center gap-4">
                               {expandedInventories.has(inv.id) ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                               <div>
                                  <span className={`px-4 py-1 rounded-full text-[9px] font-black border ${inv.type === 'OPENING' ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' : 'bg-rose-500/20 text-rose-700 border-rose-500/30'}`}>
                                     {inv.type === 'OPENING' ? 'بضاعة أول المدة' : 'جرد آخر المدة'}
                                  </span>
                                  <span className="mr-3 font-black text-readable">{inv.date}</span>
                               </div>
                            </div>
                            <div className="flex items-center gap-6">
                               <div className="text-center">
                                  <span className="text-[9px] font-black text-zinc-400 uppercase block">قيمة البضاعة في هذا الجرد</span>
                                  <span className="text-lg font-mono font-black text-primary">{inv.totalValue.toLocaleString()}</span>
                               </div>
                               <button onClick={(e) => {
                                  e.stopPropagation();
                                  if(window.confirm('حذف هذا السجل؟')) {
                                     const updated = inventories.filter(x => x.id !== inv.id);
                                     localStorage.setItem('sheno_periodic_inventories', JSON.stringify(updated));
                                     loadData();
                                  }
                               }} className="text-zinc-400 hover:text-rose-500 p-2 transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                         </div>
                         {(expandedInventories.has(inv.id)) && (
                            <div className="p-4 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
                               <table className="w-full text-right text-xs">
                                  <thead>
                                     <tr className="border-b dark:border-zinc-800 text-zinc-400 font-black h-10">
                                        <th className="pr-4">الصنف</th><th className="text-center">الكمية</th><th className="text-center">السعر</th><th className="text-center">الإجمالي</th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y dark:divide-zinc-800 font-bold">
                                     {inv.items.map((item, idx) => (
                                        <tr key={idx} className="h-10 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                           <td className="pr-4">{item.itemName}</td><td className="text-center font-mono">{item.quantity.toLocaleString()}</td><td className="text-center font-mono">{item.price.toLocaleString()}</td><td className="text-center font-mono text-emerald-600">{item.total.toLocaleString()}</td>
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Opening Entry Modal */}
      {isAddingEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-5 mb-8">
                 <h3 className="text-2xl font-black text-readable">إضافة قيد ميزانية تأسيسي</h3>
                 <button onClick={() => setIsAddingEntry(false)} className="text-zinc-400 hover:text-rose-500 transition-all"><X className="w-6 h-6"/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">اسم الحساب (أو اختيار من الموجود)</label>
                    <input list="opening-accounts-list" type="text" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black text-readable outline-none focus:border-primary transition-all" value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} placeholder="مثلاً: أثاث ومفروشات، رأس المال، شركة..." />
                    <datalist id="opening-accounts-list">
                       <optgroup label="جهات">{allParties.map(p => <option key={p.id} value={p.name} />)}</optgroup>
                       <optgroup label="أقسام">{categories.map(c => <option key={c.id} value={c.name} />)}</optgroup>
                    </datalist>
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">تصنيف الميزانية</label>
                    <select className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black text-readable outline-none appearance-none" value={formData.accountType} onChange={e => setFormData({...formData, accountType: e.target.value as any})}>
                       <option value="أصول">أصول (Assets)</option><option value="خصوم">خصوم (Liabilities)</option><option value="حقوق ملكية">حقوق ملكية (Equity)</option>
                    </select>
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">مدين (Debit)</label>
                    <input type="number" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-mono text-xl font-black text-emerald-500 outline-none" value={formData.debit} onChange={e => setFormData({...formData, debit: Number(e.target.value)})} />
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">دائن (Credit)</label>
                    <input type="number" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-mono text-xl font-black text-rose-500 outline-none" value={formData.credit} onChange={e => setFormData({...formData, credit: Number(e.target.value)})} />
                 </div>
                 <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">ملاحظات توضيحية</label>
                    <input type="text" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-bold text-readable outline-none focus:border-primary transition-all" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="اكتب أي ملاحظة عن هذا القيد..." />
                 </div>
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t dark:border-zinc-800">
                 <button onClick={handleSaveEntry} className="bg-primary text-white px-12 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all text-lg">تثبيت القيد في الميزانية</button>
              </div>
           </div>
        </div>
      )}

      {isAddingInventory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8 animate-in zoom-in-95 flex flex-col max-h-[90vh] duration-300">
              <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-5 mb-6 shrink-0">
                 <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${invType === 'OPENING' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                       <Box className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-readable">تسجيل {invType === 'OPENING' ? 'بضاعة أول المدة' : 'جرد آخر المدة'}</h3>
                       <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{invType === 'OPENING' ? 'بضاعة تأسيس الشركة' : 'سحب تلقائي لأرصدة المستودع الحالية'}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsAddingInventory(false)} className="text-zinc-400 hover:text-rose-500 transition-all"><X className="w-6 h-6"/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">تاريخ الجرد</label>
                    <input type="date" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-3 rounded-2xl font-bold outline-none" value={invMeta.date} onChange={e => setInvMeta({...invMeta, date: e.target.value})} />
                 </div>
                 <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">ملاحظات عامة</label>
                    <input type="text" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-3 rounded-2xl font-bold outline-none" value={invMeta.notes} onChange={e => setInvMeta({...invMeta, notes: e.target.value})} placeholder="مثلاً: جرد المستودع السنوي المعتمد..." />
                 </div>
              </div>

              {invType === 'OPENING' && (
                <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-inner mb-6 shrink-0">
                    <label className="text-[10px] font-black text-zinc-400 uppercase mb-3 block">إضافة أصناف تأسيسية</label>
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                        <input 
                        type="text" 
                        placeholder="ابحث عن مادة لإضافتها كمخزون أول مدة..." 
                        className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 p-4 pr-12 rounded-2xl font-black outline-none focus:border-primary transition-all"
                        value={itemSearch}
                        onFocus={() => setShowItemResults(true)}
                        onChange={e => { setItemSearch(e.target.value); setShowItemResults(true); }}
                        />
                        {showItemResults && itemSearch.length > 0 && (
                        <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl z-[210] max-h-48 overflow-y-auto">
                            {inventoryList.filter(i => i.name.includes(itemSearch) || i.code.includes(itemSearch)).map(item => (
                                <div key={item.id} onClick={() => handleSelectItem(item)} className="p-3 border-b dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer flex justify-between items-center group transition-colors">
                                    <span className="font-bold text-sm group-hover:text-primary">{item.name}</span>
                                    <span className="text-[10px] text-zinc-400 font-mono">#{item.code}</span>
                                </div>
                            ))}
                        </div>
                        )}
                    </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto custom-scrollbar border rounded-3xl mb-6 bg-white dark:bg-zinc-900">
                 <table className="w-full text-right border-collapse">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 text-[10px] font-black uppercase sticky top-0 z-10 h-10">
                       <tr><th className="p-3 pr-6">اسم المادة</th><th className="p-3 text-center">الكمية</th><th className="p-3 text-center">سعر التكلفة</th><th className="p-3 text-center">الإجمالي</th><th className="p-3"></th></tr>
                    </thead>
                    <tbody className="divide-y dark:divide-zinc-800 font-bold">
                       {invItems.map(it => (
                          <tr key={it.itemCode} className="h-12 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                             <td className="p-3 pr-6 text-sm">{it.itemName}</td>
                             <td className="p-3 text-center">
                                <input type="number" value={it.quantity} onChange={e => updateInvItem(it.itemCode, 'quantity', Number(e.target.value))} className="w-24 bg-zinc-50 dark:bg-zinc-950 border p-2 rounded-xl text-center font-mono font-black text-rose-600 outline-none" />
                             </td>
                             <td className="p-3 text-center">
                                <input type="number" value={it.price} onChange={e => updateInvItem(it.itemCode, 'price', Number(e.target.value))} className="w-28 bg-zinc-50 dark:bg-zinc-950 border p-2 rounded-xl text-center font-mono font-black text-emerald-600 outline-none" />
                             </td>
                             <td className="p-3 text-center font-mono text-readable">{(it.quantity * it.price).toLocaleString()}</td>
                             <td className="p-3 text-center">
                                <button onClick={() => setInvItems(invItems.filter(x => x.itemCode !== it.itemCode))} className="text-zinc-300 hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>
                             </td>
                          </tr>
                       ))}
                       {invItems.length === 0 && (
                          <tr><td colSpan={5} className="p-20 text-center text-zinc-300 font-bold italic">لا يوجد أصناف معالجة حالياً</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>

              <div className="shrink-0 flex items-center justify-between p-6 bg-zinc-900 rounded-[2rem] text-white shadow-xl">
                 <div className="flex gap-10">
                    <div className="text-center">
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">عدد المواد</span>
                       <span className="text-2xl font-mono font-black">{invItems.length}</span>
                    </div>
                    <div className="text-center">
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">إجمالي قيمة القائمة</span>
                       <span className="text-3xl font-mono font-black text-emerald-400">{invItems.reduce((s,i) => s+i.total, 0).toLocaleString()}</span>
                    </div>
                 </div>
                 <button onClick={handleSaveInventoryRecord} className="bg-white text-zinc-900 px-12 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all">تثبيت واعتماد القائمة</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AccountingCenterView;
